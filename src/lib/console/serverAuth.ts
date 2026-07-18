/**
 * Server-side Authority token for calling auth51 backends (workforce) on behalf
 * of the signed-in customer. Same RFC 8693 exchange as /api/cp/exchange, but the
 * token stays on the server (never shipped to the browser) and is used for
 * server→service calls. The org comes from the Clerk session, so the backend
 * scopes everything to that tenant from the verified token — never a request body.
 */
import { auth, currentUser } from '@clerk/nextjs/server'

import { MANAGED_AUDIENCE, MANAGED_AUTHORITY_URL } from './managed'
import { signSubjectToken } from './signing'

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export type OrgToken = { token: string; org: string }

/**
 * Sign a subject token for the current Clerk user and exchange it at the
 * Authority for an org-scoped access token. Throws AuthError(401) if not signed
 * in, AuthError(502) if the exchange fails.
 */
export async function getAuthorityToken(scope = 'read:agents'): Promise<OrgToken> {
  const { userId, orgId, orgSlug } = await auth()
  if (!userId) throw new AuthError(401, 'unauthenticated')

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    `${userId}@unknown`
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || undefined

  // Same org resolution as /api/cp/exchange: Clerk org slug → isolated tenant,
  // falling back to a per-user tenant so personal accounts stay isolated too.
  const org = orgSlug ?? orgId ?? `user_${userId}`

  const subjectToken = await signSubjectToken({
    userId,
    email,
    name,
    audience: MANAGED_AUDIENCE,
    scopes: scope.split(' '),
    ttlSeconds: 300,
    org,
    orgName: orgSlug ?? undefined,
  })

  const res = await fetch(`${MANAGED_AUTHORITY_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: subjectToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      audience: MANAGED_AUDIENCE,
      scope,
    }).toString(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new AuthError(502, `token exchange failed (${res.status}): ${detail}`)
  }
  const data = await res.json()
  return { token: data.access_token as string, org }
}

/** The workforce generation backend (server-only env; defaults to prod). */
export const WORKFORCE_URL = (
  process.env.AUTH51_WORKFORCE_URL || 'https://workforce.auth51.com'
).replace(/\/$/, '')
