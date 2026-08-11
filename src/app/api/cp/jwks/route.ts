import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/cp/jwks?iss=<issuer>
 *
 * Fetches the Authority's PUBLIC JWKS ({iss}/.well-known/jwks.json) server-side and
 * returns it, so the browser can verify a minted intent token's signature itself
 * (the "this is a real backend" proof). JWKS is public — no auth. SSRF-guarded to
 * auth51 hosts + https only.
 */
export async function GET(req: Request) {
  const iss = new URL(req.url).searchParams.get('iss') || ''
  let base: URL
  try {
    base = new URL(iss)
  } catch {
    return NextResponse.json({ error: 'invalid iss' }, { status: 400 })
  }
  const host = base.hostname
  const allowed = base.protocol === 'https:' && (host === 'auth51.com' || host.endsWith('.auth51.com'))
  if (!allowed) {
    return NextResponse.json({ error: 'issuer not allowed' }, { status: 400 })
  }
  // The Authority exposes JWKS at a few paths depending on deploy — try in order.
  const candidates = [
    '/.well-known/jwks.json',
    '/oauth/.well-known/jwks.json',
    '/v1/oauth/.well-known/jwks.json',
  ].map((p) => `${base.origin}${p}`)
  let lastErr = 'JWKS not found'
  for (const jwksUrl of candidates) {
    try {
      const res = await fetch(jwksUrl, { cache: 'no-store' })
      if (!res.ok) { lastErr = `HTTP ${res.status} at ${jwksUrl}`; continue }
      const jwks = await res.json()
      if (jwks?.keys?.length) return NextResponse.json({ jwks, jwks_url: jwksUrl })
      lastErr = `no keys at ${jwksUrl}`
    } catch (err) {
      lastErr = String(err)
    }
  }
  return NextResponse.json({ error: lastErr }, { status: 502 })
}
