import { NextResponse } from 'next/server'

import { forwardControlPlanes } from '@/lib/console/sharedControlPlanes'

export const runtime = 'nodejs'

/**
 * GET /api/cp/control-planes
 *
 * The active org's shared control planes. Stored on the managed Authority,
 * tenant-scoped by the exchanged token — so every member of the org sees the
 * same set, and a personal workspace sees only its own.
 */
export async function GET() {
  return forwardControlPlanes('GET')
}

/**
 * PUT /api/cp/control-planes
 *
 * Create or update (by name) a shared control plane for the active org. Body:
 * { name, endpoint, audience?, app_id? } — non-secret by construction.
 */
export async function PUT(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  return forwardControlPlanes('PUT', '', body)
}
