import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'

/**
 * GET /api/cp/generate/[jobId]
 *
 * Poll a generation job on the workforce for this org: returns
 * `{status: running|done|error, progress: [...], result, error}`. The workforce
 * scopes the job to the token's org, so a customer can only see their own jobs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/generate/${encodeURIComponent(jobId)}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
