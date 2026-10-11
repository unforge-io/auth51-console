import { forwardControlPlanes } from '@/lib/console/sharedControlPlanes'

export const runtime = 'nodejs'

/** DELETE /api/cp/control-planes/:name — remove a shared control plane for the whole org. */
export async function DELETE(_req: Request, { params }: { params: { name: string } }) {
  return forwardControlPlanes('DELETE', `/${encodeURIComponent(params.name)}`)
}
