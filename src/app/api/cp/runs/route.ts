import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/runs?profile=<packId>&limit=<n>
 *
 * Recent runs for a workforce (any status), newest first — the run-history list.
 * Org-scoped by the forwarded token. Returns { runs: [{run_id, status, use_case, agent}] }.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const profile = url.searchParams.get('profile')
  const limit = url.searchParams.get('limit') || '25'
  if (!profile) return NextResponse.json({ error: 'profile is required' }, { status: 400 })
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(
      `${WORKFORCE_URL}/runs?profile=${encodeURIComponent(profile)}&limit=${encodeURIComponent(limit)}`,
      { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' },
    )
    const data = await res.json().catch(() => ({ runs: [] }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
