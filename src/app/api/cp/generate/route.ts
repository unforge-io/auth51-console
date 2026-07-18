import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'
// Composition runs a real LLM (Claude Opus) over the spec — allow a long request.
export const maxDuration = 300

/**
 * POST /api/cp/generate
 *
 * Proxy the signed-in customer's spec to the workforce generator. We exchange a
 * server-side Authority token (org from the Clerk session) and call
 * workforce/generate with it — the backend takes ownership from the token, so the
 * generated pack belongs to this org. Returns a PREVIEW (profile + warnings) for
 * the review gate; nothing is persisted here (see /api/cp/profiles to save).
 */
export async function POST(req: Request) {
  let body: {
    spec?: unknown
    rs_id?: string
    profile_id?: string
    use_cases?: string[]
    domain_context?: string
    use_llm?: boolean
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  if (!body.spec || !body.rs_id) {
    return NextResponse.json({ error: 'spec and rs_id are required' }, { status: 400 })
  }

  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        spec: body.spec,
        rs_id: body.rs_id,
        profile_id: body.profile_id,
        use_cases: body.use_cases ?? [],
        domain_context: body.domain_context ?? '',
        use_llm: body.use_llm ?? true,
        persist: false, // review gate: save is a separate, explicit step
      }),
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
