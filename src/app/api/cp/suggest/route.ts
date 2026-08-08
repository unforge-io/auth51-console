import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * POST /api/cp/suggest
 *
 * "Ask the LLM" for the attack simulator: forwards to the workforce, which reuses the
 * same generator model that authored the agents to draft a tampered component
 * (system prompt or input injection) for the attack the operator wants to simulate.
 * Run-only — the console applies the result as a per-run override; nothing is
 * registered or persisted. Body: { profile, agent_id, component, kind, instruction, current }.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  try {
    const { token } = await getAuthorityToken('read:agents')
    const res = await fetch(`${WORKFORCE_URL}/suggest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
