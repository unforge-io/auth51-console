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

// The audience the subject_token must carry — it must equal the console trusted
// issuer's `expected_audience` on the Authority (the real issuer host,
// `authority.auth51.com`, via MANAGED_AUDIENCE). Overridable if that changes.
const EXCHANGE_AUDIENCE = process.env.AUTH51_EXCHANGE_AUDIENCE || MANAGED_AUDIENCE

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export type OrgToken = { token: string; org: string }

/** The signed-in member and the org (workspace) they are acting in. */
export type ConsoleIdentity = {
  userId: string
  email: string
  name?: string
  /** Tenant key sent as the `org` claim: Clerk org slug → isolated tenant shared
   *  by every member, falling back to a per-user tenant for personal accounts. */
  org: string
  orgId?: string
  orgRole?: string
  orgName?: string
}

/**
 * Resolve the current Clerk user + active org. Shared by every exchange path
 * (browser /api/cp/exchange and server-side getAuthorityToken) so they always
 * agree on the tenant. Throws AuthError(401) if not signed in.
 */
export async function getConsoleIdentity(): Promise<ConsoleIdentity> {
  const { userId, orgId, orgSlug, orgRole } = await auth()
  if (!userId) throw new AuthError(401, 'unauthenticated')
  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    `${userId}@unknown`
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || undefined
  return {
    userId,
    email,
    name,
    org: orgSlug ?? orgId ?? `user_${userId}`,
    orgId: orgId ?? undefined,
    orgRole: orgRole ?? undefined,
    orgName: orgSlug ?? undefined,
  }
}

// Cache the exchanged token per user so a burst of calls (e.g. polling a
// generation job every 1.5s) reuses ONE token instead of re-exchanging each
// time. Each exchange makes the Authority re-fetch the console JWKS, which is
// flaky (occasional 403 from the CDN); caching turns ~1 exchange/sec into ~1 per
// token lifetime, so a poll storm can't trip it. Module-scope, so it survives
// within a warm serverless instance (a cold start just re-exchanges once).
type CacheEntry = { token: string; org: string; exp: number }
const _tokenCache = new Map<string, CacheEntry>()

/**
 * Sign a subject token for the current Clerk user and exchange it at the
 * Authority for an org-scoped access token (cached until shortly before it
 * expires). Throws AuthError(401) if not signed in, AuthError(502) if the
 * exchange fails.
 */
export async function getAuthorityToken(scope = 'read:agents'): Promise<OrgToken> {
  const { userId, orgId, orgSlug, orgRole } = await auth()
  if (!userId) throw new AuthError(401, 'unauthenticated')

  // Key on the active org + role too: a member who switches orgs (or whose role
  // changes) must not keep acting with a token minted for the old one.
  const cacheKey = `${userId}:${orgId ?? orgSlug ?? 'personal'}:${orgRole ?? ''}:${scope}`
  const cached = _tokenCache.get(cacheKey)
  if (cached && cached.exp > Date.now()) {
    return { token: cached.token, org: cached.org }
  }

  const id = await getConsoleIdentity()
  const org = id.org

  const subjectToken = await signSubjectToken({
    userId: id.userId,
    email: id.email,
    name: id.name,
    audience: EXCHANGE_AUDIENCE,
    scopes: scope.split(' '),
    ttlSeconds: 300,
    org,
    orgName: id.orgName,
    orgId: id.orgId,
    orgRole: id.orgRole,
  })

  const res = await fetch(`${MANAGED_AUTHORITY_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: subjectToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      audience: EXCHANGE_AUDIENCE,
      scope,
    }).toString(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new AuthError(502, `token exchange failed (${res.status}): ${detail}`)
  }
  const data = await res.json()
  const token = data.access_token as string
  // Cache until 60s before expiry (default 30m if the Authority omits expires_in).
  const ttlSec = typeof data.expires_in === 'number' ? data.expires_in : 1800
  _tokenCache.set(cacheKey, { token, org, exp: Date.now() + Math.max(30, ttlSec - 60) * 1000 })
  return { token, org }
}

/** The workforce generation backend (server-only env; defaults to prod). */
export const WORKFORCE_URL = (
  process.env.AUTH51_WORKFORCE_URL || 'https://workforce.auth51.com'
).replace(/\/$/, '')
