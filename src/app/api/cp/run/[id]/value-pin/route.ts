import { NextResponse } from 'next/server'

import { AuthError, getAuthorityToken } from '@/lib/console/serverAuth'
import { MANAGED_AUTHORITY_URL } from '@/lib/console/managed'

export const runtime = 'nodejs'

/**
 * POST /api/cp/run/[id]/value-pin
 *
 * Record a human value pin (or deny) for a value-bound step that paused the run
 * (T3 value binding, P7.D.3). This is the control-plane twin of the approval gate,
 * but with a stronger trust posture: the pinned value is recorded DIRECTLY at the
 * Authority by an authenticated approver (the `approve:escalation` scope), never
 * carried by the agent/workforce. The pin is scoped to one run (`execution_id`) +
 * step, so it cannot replay across runs. After this succeeds the caller resumes the
 * run (POST .../resume with `{ decision: 'pin' | 'deny' }`); the retried mint, running
 * under the SAME execution anchor, finds the frozen pin and proceeds — or, on deny,
 * the run terminates.
 *
 * Body: { app_id, execution_id, step, pins: { target: value }, decision: 'pin' | 'deny' }
 */
export async function POST(req: Request) {
  let body: {
    app_id?: string; execution_id?: string; step?: string
    pins?: Record<string, unknown>; decision?: string
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const decision = body.decision === 'deny' ? 'deny' : 'pin'
  if (!body.app_id || !body.execution_id || !body.step) {
    return NextResponse.json(
      { error: 'app_id, execution_id and step are required' }, { status: 400 })
  }
  if (decision === 'pin' && (!body.pins || Object.keys(body.pins).length === 0)) {
    return NextResponse.json(
      { error: 'a pin decision must carry at least one target value' }, { status: 400 })
  }

  try {
    // The pin is an escalation decision — mint the human-approver scope, the same one
    // the Authority requires on /v1/governance/value-pin. The Authority keys the record
    // on execution_id (in the body), not the run id in the route path.
    const { token } = await getAuthorityToken('approve:escalation')
    const res = await fetch(`${MANAGED_AUTHORITY_URL}/v1/governance/value-pin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        app_id: body.app_id,
        execution_id: body.execution_id,
        step: body.step,
        pins: body.pins || {},
        decision,
      }),
    })
    const data = await res.json().catch(() => ({ error: 'authority returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
