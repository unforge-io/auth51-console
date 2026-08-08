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
  let body: { input?: string; answers?: Record<string, unknown>; attack?: Record<string, unknown> | null } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const hasAnswers = body.answers && Object.keys(body.answers).length > 0
  const hasInput = typeof body.input === 'string' && body.input.trim().length > 0
  if (!hasAnswers && !hasInput) {
    return NextResponse.json({ error: 'answers or input is required' }, { status: 400 })
  }

  try {
    const { token } = await getAuthorityToken('read:agents register:intent generate:intent-token')
    const res = await fetch(
      `${WORKFORCE_URL}/run/${encodeURIComponent(params.id)}/resume`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        // Forward the armed attack so run-only overrides re-apply to the RESUMED
        // portion — the agents that run after an elicitation pause (the workforce's
        // apply_run_attack re-tampers the roster on resume; input injection is not
        // re-applied, it's already in the restored state).
        body: JSON.stringify({ answers: body.answers, input: body.input,
                               ...(body.attack ? { attack: body.attack } : {}) }),
      },
    )
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
