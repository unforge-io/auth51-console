import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/run/[id]
 *
 * Poll a run started via POST /api/cp/run. Returns
 * { run_id, status: running|done|error|aborted, result, error }.
 * `result.tool_outputs` holds each governed tool call's outcome.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/run/${encodeURIComponent(params.id)}`, {
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
