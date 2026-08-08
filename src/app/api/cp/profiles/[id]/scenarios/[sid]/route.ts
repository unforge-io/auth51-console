import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/** DELETE /api/cp/profiles/[id]/scenarios/[sid] — remove a saved scenario. */
export async function DELETE(_req: Request, { params }: { params: { id: string; sid: string } }) {
  try {
    const { token } = await getAuthorityToken('read:agents manage:clients')
    const res = await fetch(
      `${WORKFORCE_URL}/profiles/${encodeURIComponent(params.id)}/scenarios/${encodeURIComponent(params.sid)}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${token}` } },
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
