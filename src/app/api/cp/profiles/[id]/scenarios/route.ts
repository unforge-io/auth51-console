import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * PUT /api/cp/profiles/[id]/scenarios
 *
 * Upsert a saved attack scenario on the caller's pack (scenarios live on the
 * Profile). Body: { id?, name, use_case_id, attack: {kind, overrides, input_injection} }.
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  try {
    const { token } = await getAuthorityToken('read:agents manage:clients')
    const res = await fetch(`${WORKFORCE_URL}/profiles/${encodeURIComponent(params.id)}/scenarios`, {
      method: 'PUT',
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
