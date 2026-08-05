import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/run/latest?profile=<packId>
 *
 * The paused scenario a roster is currently holding, so the Studio can re-attach
 * when you navigate back to a pack. Org-scoped by the forwarded token. Returns
 * { run_id, status, result } when something is paused, or {} otherwise.
 */
export async function GET(req: Request) {
  const profile = new URL(req.url).searchParams.get('profile')
  if (!profile) {
    return NextResponse.json({ error: 'profile is required' }, { status: 400 })
  }
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(
      `${WORKFORCE_URL}/run/latest?profile=${encodeURIComponent(profile)}`,
      { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' },
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
