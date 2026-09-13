import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * POST /api/cp/run
 *
 * Start a governed run of a saved pack against one use case. The workforce
 * builds the real LLM agent and invokes it; each tool call is auto-governed by
 * the auth51 embed (mint intent token + DPoP → mock RS). It's a job: we return
 * a run_id, and the client polls GET /api/cp/run/[id] for status + tool_outputs.
 *
 * Body: { profile: string (pack id), use_case?: string }
 *
 * NOTE (Slice 1): the run mints under the workforce's own credential, so it is
 * governed under the workforce's org — this works for the SEED pack. Running a
 * customer's own pack under their org is Slice 2 (forward the caller's token).
 */
export async function POST(req: Request) {
  let body: { profile?: string; use_case?: string; mode?: string; attack?: Record<string, unknown> | null; workflow_hint?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  if (!body.profile) {
    return NextResponse.json({ error: 'profile (pack id) is required' }, { status: 400 })
  }
  const run_id = randomUUID()

  try {
    // The run registers (idempotently) + mints under YOUR org by forwarding this
    // token, so it needs register:intent + generate:intent-token (read:agents for
    // the reuse-lookup).
    const { token } = await getAuthorityToken('read:agents register:intent generate:intent-token')
    const res = await fetch(`${WORKFORCE_URL}/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        run_id, profile: body.profile, use_case: body.use_case,
        mode: body.mode === 'oauth' ? 'oauth' : 'intent',
        // Optional deterministic attack plan (Phase 6.2) — forwarded verbatim; the
        // workforce applies it to the RUNTIME agent (identity/data), never the
        // registered agent. Absent ⇒ a clean run.
        ...(body.attack ? { attack: body.attack } : {}),
        // The guard that governs THIS run (guard isolation) — the run binds only
        // to its own use case's guard, never an unrelated/leaked one.
        ...(body.workflow_hint ? { workflow_hint: body.workflow_hint } : {}),
      }),
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    // Surface the run_id so the client can poll even if the body is minimal.
    return NextResponse.json({ run_id, ...data }, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
