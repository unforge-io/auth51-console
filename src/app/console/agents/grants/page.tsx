'use client'

import { useCallback, useEffect, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listGrants, type GrantView, AuthorityError } from '@/lib/console/api'
import { EmptyState } from '@/components/console/EmptyState'

/**
 * Grants — the capability envelope for each agent (GET /grants/{app_id}).
 * A grant is the ceiling on what scopes an agent may mint, separate from its
 * identity; step-up scopes require escalation. Read-only in Phase 1.
 */
export default function GrantsPage() {
  const { currentContext } = useControlPlane()
  const [grants, setGrants] = useState<GrantView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true); setError(null)
    try {
      setGrants(await listGrants(currentContext))
    } catch (err) {
      setError(err instanceof AuthorityError
        ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
        : err instanceof Error ? err.message : String(err))
      setGrants([])
    } finally { setLoading(false) }
  }, [currentContext])

  useEffect(() => { load() }, [load])

  if (!currentContext) return <EmptyState />

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-[22px] font-semibold text-c-text tracking-tight">Grants</h1>
      <p className="mt-1 mb-6 text-[14px] text-c-text-2 max-w-2xl">
        Each agent&rsquo;s capability envelope — the scopes it may mint tokens for.
        Step-up scopes are allowed only after escalation. The grant is the ceiling,
        enforced at mint time.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>
      )}

      <div className="rounded-xl border border-c-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
          <span>Agent</span><span>Allowed scopes</span><span>Mode</span><span>Source</span>
        </div>
        {loading && grants.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-c-text-3">Loading…</div>
        ) : grants.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-c-text-3">
            No grants yet. Register an agent and derive a grant to see it here.
          </div>
        ) : (
          grants.map((g) => (
            <div key={g.agent_id}
                 className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-start px-4 py-3 border-t border-c-border">
              <div className="text-[14px] text-c-text font-medium truncate">{g.agent_id}</div>
              <div className="flex flex-wrap gap-1">
                {g.allowed_scopes.length === 0
                  ? <span className="text-[12px] text-c-text-3">—</span>
                  : g.allowed_scopes.map((s) => (
                      <span key={s} className="rounded-md bg-c-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-c-text-2">{s}</span>
                    ))}
                {g.step_up_scopes.map((s) => (
                  <span key={s} title="step-up (requires escalation)"
                        className="rounded-md border border-c-warning/40 px-1.5 py-0.5 text-[11px] font-mono text-c-warning">↑ {s}</span>
                ))}
              </div>
              <span className={`text-[12px] font-medium ${g.mode === 'enforce' ? 'text-c-success' : 'text-c-text-2'}`}>{g.mode}</span>
              <span className="text-[12px] text-c-text-3">{g.source}{g.version ? ` v${g.version}` : ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
