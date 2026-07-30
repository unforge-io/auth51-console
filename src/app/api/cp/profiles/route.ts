import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/profiles
 *
 * List the caller's saved packs (org-scoped by the token) plus shared seeds.
 * This is what the Studio loads on visit so your saved workforces come back.
 */
export async function GET() {
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/profiles`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * POST /api/cp/profiles
 *
 * Persist an approved (possibly edited) generated pack — the review-gate commit.
 * The workforce backend forces the pack's owner to the token's org, so a customer
 * can only ever save into their own tenant. The saved agents then surface in the
 * console's existing Agents view (owner_org = app_id = org slug).
 */
export async function POST(req: Request) {
  let profile: unknown
  try {
    profile = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  // "Register on Save": when set, the workforce provisions the profile's own
  // app-scoped OAuth key (POST /v1/oauth-clients → needs manage:clients) and then
  // registers the roster THROUGH that key. So the forwarded token needs
  // manage:clients (to create the key in the caller's org); the app key itself
  // carries register:intent. Default save only needs read:agents.
  const autoRegister = new URL(req.url).searchParams.get('auto_register') === 'true'

  try {
    const { token } = await getAuthorityToken(
      autoRegister ? 'read:agents manage:clients' : 'read:agents',
    )
    const wfUrl = `${WORKFORCE_URL}/profiles${autoRegister ? '?auto_register=true' : ''}`
    const res = await fetch(wfUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
