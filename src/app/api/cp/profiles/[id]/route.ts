import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/profiles/[id]
 *
 * Load one saved pack's full profile (org-scoped by the token) so the Studio can
 * re-open its roster + use cases.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/profiles/${encodeURIComponent(params.id)}`, {
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
