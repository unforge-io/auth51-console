import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * POST /api/cp/profiles/[id]/register
 *
 * Commit the staged agents of a saved pack — the explicit registration step,
 * decoupled from save. Body `{ agent_ids?: string[] }` registers only that
 * subset (review, then pull agents out before committing); omit it to register
 * the whole roster. Forwards the caller's org token so registration lands in
 * their org. Same scopes as save: manage:clients (provision the app key) +
 * read:agents (idempotent reuse-lookup); the app key itself carries register:intent.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: { agent_ids?: string[] } = {}
  try {
    body = await req.json()
  } catch {
    /* empty body ⇒ register the whole roster */
  }
  try {
    const { token } = await getAuthorityToken('read:agents manage:clients')
    const res = await fetch(
      `${WORKFORCE_URL}/profiles/${encodeURIComponent(params.id)}/register`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ agent_ids: body.agent_ids ?? null }),
      },
    )
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
