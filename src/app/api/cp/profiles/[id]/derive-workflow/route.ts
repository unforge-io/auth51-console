import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * POST /api/cp/profiles/[id]/derive-workflow
 *
 * Inductive workflow discovery (P7.B3): mine the pack's own clean runs of a use
 * case into a GUARDED workflow — the observed class with red lines (destructive /
 * money-movement ops) held behind an approval gate. Dry-run by default (returns the
 * proposal for review); `commit: true` registers it at the Authority under the pack's
 * app key (enforce-first — loose but enforcing; a changed re-derive supersedes the
 * prior version).
 *
 * Body: { use_case, commit?, mode?, workflow_id? }. Same scopes as register — the
 * workforce provisions/reuses the pack's app key to register (manage:clients) and
 * reads the roster (read:agents).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: { use_case?: string; commit?: boolean; mode?: string; workflow_id?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* fall through — the workforce validates use_case */
  }
  try {
    const { token } = await getAuthorityToken('read:agents manage:clients')
    const res = await fetch(
      `${WORKFORCE_URL}/profiles/${encodeURIComponent(params.id)}/derive-workflow`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          use_case: body.use_case,
          commit: body.commit ?? false,
          mode: body.mode ?? 'enforce',
          ...(body.workflow_id ? { workflow_id: body.workflow_id } : {}),
        }),
      },
    )
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
