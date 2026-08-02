import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/run/[id]/trace
 *
 * The run's persisted spans (mint / DPoP / RS / LLM / tool), for the live trace
 * waterfall. Tenant-scoped by the forwarded org token. Polled alongside status —
 * it grows as the run progresses.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(
      `${WORKFORCE_URL}/run/${encodeURIComponent(params.id)}/trace`,
      { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' },
    )
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
