import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { signSubjectToken } from '@/lib/console/signing'
import { MANAGED_AUDIENCE } from '@/lib/console/managed'

export const runtime = 'nodejs'

/**
 * POST /api/cp/exchange
 *
 * The bridge between Console identity and Authority identity.
 *
 * Body: { endpoint, audience, scope? }
 *
 * Flow:
 *   1. Verify the caller is a logged-in Console user (Clerk session).
 *   2. Sign a short-lived subject_token JWT asserting that user's identity
 *      with iss=https://auth51.com.
 *   3. POST it to the Authority's /oauth/token endpoint with
 *      grant_type = urn:ietf:params:oauth:grant-type:token-exchange.
 *   4. Authority verifies the JWT against auth51.com's JWKS, looks up the
 *      user's permissions in its own role mapping, issues a fresh
 *      Authority-domain access token.
 *   5. Return that access token to the browser.
 *
 * After this call, the browser uses the returned access token directly
 * against the Authority. The Console is not in the data path for
 * subsequent calls — only for token refresh / re-exchange.
 */
export async function POST(req: Request) {
  // 1. Identify the user via Clerk session
  const { userId, orgId, orgSlug } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown`
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || undefined

  // The customer's org → an isolated Authority tenant. Prefer the Clerk org
  // (slug is human-readable + stable); fall back to a per-user tenant so even
  // personal accounts (no org) get their own isolated space rather than sharing
  // the demo default.
  const org = orgSlug ?? orgId ?? `user_${userId}`

  // 2. Parse body
  let body: { endpoint?: string; audience?: string; scope?: string } = {}
  try { body = await req.json() } catch { /* ignore */ }
  const endpoint = body.endpoint?.replace(/\/$/, '')
  // Default to the real issuer host (the trusted issuer's expected_audience);
  // "idp.localhost" was a stale patchet-era placeholder, retired.
  const audience = body.audience ?? MANAGED_AUDIENCE
  const scope = body.scope ?? 'read:agents'

  if (!endpoint) {
    return NextResponse.json({ error: 'bad_request', detail: 'endpoint is required' }, { status: 400 })
  }

  try {
    // 3. Sign subject_token
    const subjectToken = await signSubjectToken({
      userId,
      email,
      name,
      audience,
      scopes: scope.split(' '),
      ttlSeconds: 300,
      org,
      orgName: orgSlug ?? undefined,
    })

    // 4. Exchange with Authority via RFC 8693
    const tokenUrl = `${endpoint}/oauth/token`
    const formBody = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: subjectToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      audience,
      scope,
    })

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })

    if (!tokenRes.ok) {
      let detail: unknown
      try { detail = await tokenRes.json() } catch { detail = await tokenRes.text() }
      return NextResponse.json(
        { error: 'exchange_failed', status: tokenRes.status, detail },
        { status: 502 },
      )
    }

    const tokenData = await tokenRes.json()
    // 5. Return access token + metadata to browser
    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type ?? 'Bearer',
      expires_in: tokenData.expires_in ?? 1800,
      scope: tokenData.scope ?? scope,
      issued_to: { user_id: userId, email },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'exchange_error', detail: msg },
      { status: 500 },
    )
  }
}
