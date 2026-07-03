/**
 * Console signing infrastructure.
 *
 * The Console mints short-lived JWTs that assert "user X is authenticated
 * by auth51.com". These JWTs are sent to customer Authorities as the
 * `subject_token` in an RFC 8693 token exchange request.
 *
 * The Console's private key lives in `CONSOLE_SIGNING_KEY` env var
 * (PEM-encoded Ed25519). The public key is served at /api/jwks.json
 * for any Authority that trusts auth51.com as an issuer.
 *
 * Key id (kid): a stable identifier so Authorities can fetch a fresh
 * JWKS and look up the right key when verifying signatures.
 */

import { importPKCS8, importSPKI, exportJWK, SignJWT, type JWK } from 'jose'

const ALG = 'EdDSA'
const KID = 'auth51-console-v1'

let cachedPrivateKey: CryptoKey | null = null
let cachedPublicJwk: JWK | null = null

async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey
  const pem = process.env.CONSOLE_SIGNING_KEY
  if (!pem) {
    throw new Error('CONSOLE_SIGNING_KEY env var is not set. Generate an Ed25519 key and set its PEM-encoded private key.')
  }
  cachedPrivateKey = await importPKCS8(pem.replace(/\\n/g, '\n'), ALG, { extractable: true })
  return cachedPrivateKey
}

/**
 * Returns the Console's public key as a JWK for the JWKS endpoint.
 * Derived from the private key on first call, cached thereafter.
 */
export async function getPublicJwk(): Promise<JWK> {
  if (cachedPublicJwk) return cachedPublicJwk
  // For Ed25519, jose can derive the public component from the private CryptoKey
  const priv = await getPrivateKey()
  // Re-import as public if we have a separate CONSOLE_SIGNING_PUBLIC_KEY,
  // otherwise jose can extract it.
  const pubPem = process.env.CONSOLE_SIGNING_PUBLIC_KEY
  let pub: CryptoKey
  if (pubPem) {
    pub = await importSPKI(pubPem.replace(/\\n/g, '\n'), ALG, { extractable: true })
  } else {
    // Derive public from private — extract raw and re-import.
    const raw = await crypto.subtle.exportKey('jwk', priv)
    pub = await crypto.subtle.importKey('jwk', { kty: raw.kty, crv: raw.crv, x: raw.x }, { name: 'Ed25519' }, true, ['verify'])
  }
  const jwk = await exportJWK(pub)
  jwk.alg = ALG
  jwk.use = 'sig'
  jwk.kid = KID
  cachedPublicJwk = jwk
  return jwk
}

/**
 * Sign a subject_token JWT asserting that the given user is authenticated
 * by auth51.com. Returns the compact-serialized JWT string suitable for
 * inclusion as `subject_token` in an RFC 8693 token exchange request.
 *
 * Claims:
 *   iss: https://auth51.com — required for trust verification by Authority
 *   sub: stable user identifier (Clerk user_id)
 *   aud: audience expected by the target Authority (e.g. "idp.acme.com")
 *   email, name: user identity for audit
 *   exp / iat / jti: standard validity claims; tokens are short-lived (5 min)
 */
export async function signSubjectToken(opts: {
  userId: string
  email: string
  name?: string
  audience: string
  scopes?: string[]
  ttlSeconds?: number
  /**
   * The customer's organization (Clerk org slug/id). The Authority maps this
   * to an isolated tenant (`org:<org>`), so a customer's agents, grants, API
   * keys and audit are scoped to their own org. Omit for the single-tenant
   * demo (the Authority falls back to DEFAULT_FEDERATED_TENANT).
   */
  org?: string
  orgName?: string
}): Promise<string> {
  const priv = await getPrivateKey()
  const now = Math.floor(Date.now() / 1000)
  const ttl = opts.ttlSeconds ?? 300 // 5 minutes
  const jwt = await new SignJWT({
    email: opts.email,
    name: opts.name,
    scope: opts.scopes?.join(' '),
    ...(opts.org ? { org: opts.org, org_name: opts.orgName ?? opts.org } : {}),
  })
    .setProtectedHeader({ alg: ALG, kid: KID, typ: 'JWT' })
    .setIssuer('https://auth51.com')
    .setSubject(opts.userId)
    .setAudience(opts.audience)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .setJti(`${opts.userId}-${now}-${Math.random().toString(36).slice(2, 8)}`)
    .sign(priv)
  return jwt
}
