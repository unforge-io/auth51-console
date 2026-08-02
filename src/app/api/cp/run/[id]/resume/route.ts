import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * POST /api/cp/run/[id]/resume
 *
 * Resume a run that paused on a `Yield` (the agent asked the user for input).
 * Forwards the user's answer to the workforce, which reloads the durable paused
 * state and continues the run under the same run_id. Governance re-derives fresh
 * on resume, so it mints again — hence the same scopes as the initial run. The
 * workforce scopes the resume to the caller's org via this token, so a tenant can
 * only resume its own run. Returns 202 { status: 'running' }; the client keeps
 * polling GET /api/cp/run/[id] (it may finish, or pause again).
 *
 * Body: { input: string }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: { input?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  if (typeof body.input !== 'string' || !body.input.trim()) {
    return NextResponse.json({ error: 'input is required' }, { status: 400 })
  }

  try {
    const { token } = await getAuthorityToken('read:agents register:intent generate:intent-token')
    const res = await fetch(
      `${WORKFORCE_URL}/run/${encodeURIComponent(params.id)}/resume`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ input: body.input }),
      },
    )
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
