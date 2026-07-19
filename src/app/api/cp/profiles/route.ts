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

  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/profiles`, {
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
