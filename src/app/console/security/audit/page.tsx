'use client'

import { useCallback, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listDecisions, formatRegisteredAt, type DecisionEvent, AuthorityError } from '@/lib/console/api'
import { useAutoRefresh } from '@/lib/console/useAutoRefresh'
import { useRefreshInterval } from '@/lib/console/useRefreshInterval'
import { LiveIndicator } from '@/components/console/LiveIndicator'
import { EmptyState } from '@/components/console/EmptyState'

/**
 * Audit log — the authority's append-only decision feed for this app
 * (GET /decisions/{app_id}). Every mint / verify / deny / escalate /
 * token-exchange the authority performed, newest first.
 */
export default function AuditPage() {
  const { currentContext } = useControlPlane()
  const [events, setEvents] = useState<DecisionEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!currentContext) return
    try {
      setError(null)
      setEvents(await listDecisions(currentContext, { limit: 200 }))
    } catch (err) {
      setError(err instanceof AuthorityError
        ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
        : err instanceof Error ? err.message : String(err))
      setEvents([])
    }
  }, [currentContext])

  const { intervalMs, setIntervalMs } = useRefreshInterval()
  const { lastUpdatedAt, tickedAt } = useAutoRefresh({ intervalMs, fetcher: load, enabled: !!currentContext })

  if (!currentContext) return <EmptyState />

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-c-text tracking-tight">Audit log</h1>
          <p className="mt-1 text-[14px] text-c-text-2 max-w-2xl">
            Every authority decision — token mints, verifications, denials, and
            escalations — for <span className="font-medium text-c-text">{currentContext.appId ?? 'Patchet'}</span>.
          </p>
        </div>
        <LiveIndicator lastUpdatedAt={lastUpdatedAt} tick={tickedAt} intervalMs={intervalMs} onIntervalChange={setIntervalMs} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>
      )}

      <div className="rounded-xl border border-c-border overflow-hidden">
        <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
          <span>Event</span><span>Outcome</span><span>Reason</span><span>When</span>
        </div>
        {events.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-c-text-3">
            No events yet. Once your agents mint tokens, they appear here.
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="border-t border-c-border">
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="w-full grid grid-cols-[auto_auto_1fr_auto] gap-4 items-center px-4 py-2.5 text-left hover:bg-c-surface-2/50">
                <span className="text-[12px] font-mono text-c-text-2 w-28 truncate">{e.kind}</span>
                <span className={`text-[12px] font-medium w-16 ${e.outcome === 'allow' ? 'text-c-success' : 'text-c-danger'}`}>
                  {e.outcome === 'allow' ? '✓ allow' : '✕ deny'}
                </span>
                <span className="text-[13px] text-c-text-2 truncate">
                  {e.reason || <span className="text-c-text-3">—</span>}
                  {e.anchor && <span className="ml-2 text-[11px] font-mono text-c-warning">{e.anchor}</span>}
                </span>
                <span className="text-[12px] text-c-text-3 whitespace-nowrap">{formatRegisteredAt(e.created_at)}</span>
              </button>
              {expanded === e.id && e.claims && (
                <pre className="mx-4 mb-3 rounded-lg border border-c-border bg-c-bg p-3 text-[12px] font-mono text-c-text-2 overflow-x-auto">
                  {JSON.stringify(e.claims, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
