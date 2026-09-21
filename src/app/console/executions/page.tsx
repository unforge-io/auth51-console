'use client'

import { useCallback, useEffect, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  listExecutions, getExecutionTrace, formatRegisteredAt,
  type ExecutionSummary, type ExecutionTrace, AuthorityError,
} from '@/lib/console/api'
import { TraceWaterfall, type Span } from '@/components/console/TraceWaterfall'
import { cn } from '@/lib/utils'

/**
 * Executions — every governed run the Authority has seen for this app, from ANY
 * auth51 client: the studio workforce OR a custom app that only imported the client.
 * Each run opens an execution and mints here, so this is where a customer's own
 * agentic app shows up — its governance decisions (allow/deny, identity, workflow,
 * consequence tier) and, when the client exports them, its trace spans (the same
 * waterfall the studio shows). Not tied to the studio; scoped per app.
 */
export default function ExecutionsPage() {
  const { currentContext } = useControlPlane()
  const [rows, setRows] = useState<ExecutionSummary[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [trace, setTrace] = useState<ExecutionTrace | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true); setError(null)
    try {
      setRows(await listExecutions(currentContext))
    } catch (e) {
      setError(e instanceof AuthorityError ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [currentContext])

  useEffect(() => { load() }, [load])

  const openTrace = useCallback(async (executionId: string) => {
    if (!currentContext) return
    setSelected(executionId); setTrace(null)
    try {
      setTrace(await getExecutionTrace(currentContext, executionId))
    } catch (e) {
      setError(e instanceof AuthorityError ? e.message : String(e))
    }
  }, [currentContext])

  if (!currentContext) {
    return <div className="p-6 text-c-text-2 text-sm">Connect a control plane to view executions.</div>
  }

  return (
    <div className="flex h-full">
      {/* Executions list */}
      <div className="w-[420px] shrink-0 border-r border-c-border overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-c-border">
          <div>
            <h1 className="text-[14px] font-semibold text-c-text">Executions</h1>
            <p className="text-[11.5px] text-c-text-2">
              Governed runs for <span className="font-mono">{currentContext.appId ?? 'Patchet'}</span> — studio and custom apps.
            </p>
          </div>
          <button onClick={load}
            className="text-[11.5px] px-2 py-1 rounded border border-c-border hover:bg-c-surface-2">
            Refresh
          </button>
        </div>
        {error && <div className="m-3 p-2 text-[11.5px] text-c-danger bg-c-danger/10 rounded">{error}</div>}
        {loading && <div className="p-4 text-c-text-2 text-sm">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-4 text-c-text-2 text-[12px]">
            No executions yet. Run a governed agent (studio or a custom app on the auth51 client) and it will appear here.
          </div>
        )}
        <ul>
          {rows.map((r) => (
            <li key={r.execution_id}>
              <button
                onClick={() => openTrace(r.execution_id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 border-b border-c-border/60 hover:bg-c-surface-2',
                  selected === r.execution_id && 'bg-c-surface-2',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-c-text">{r.execution_id}</span>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-c-text-2">
                  <span>{r.workflow_id ? `guard: ${r.workflow_id}` : 'unbound'}</span>
                  <span>·</span>
                  <span>{r.mode}</span>
                  <span>·</span>
                  <span>{formatRegisteredAt(r.created_at)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Trace detail */}
      <div className="flex-1 overflow-y-auto">
        {!trace && <div className="p-6 text-c-text-2 text-sm">Select an execution to see its trace.</div>}
        {trace && (
          <div className="p-4">
            <div className="mb-3">
              <div className="font-mono text-[13px] text-c-text">{trace.execution_id}</div>
              <div className="text-[11.5px] text-c-text-2">
                {trace.workflow_id ? `guard ${trace.workflow_id}` : 'unbound'} · {trace.mode} · {trace.status}
              </div>
            </div>

            {/* Governance decisions — the authorization timeline */}
            <h2 className="text-[12px] font-semibold text-c-text mt-4 mb-1">Governance decisions</h2>
            {trace.decisions.length === 0 && (
              <div className="text-[11.5px] text-c-text-2">No governed actions recorded for this run.</div>
            )}
            <div className="space-y-1">
              {trace.decisions.map((d, i) => {
                const claims = d.claims || {}
                const tool = (claims['tool_name'] as string) || (claims['action'] as string) || ''
                const scopes = (claims['scopes'] as string[] | undefined) || []
                return (
                  <div key={i} className="flex items-start gap-2 text-[11.5px] border border-c-border/60 rounded px-2 py-1.5">
                    <OutcomePill outcome={d.outcome} />
                    <div className="min-w-0">
                      <div className="text-c-text">
                        <span className="font-medium">{d.kind}</span>
                        {tool && <span className="font-mono ml-1">{tool}</span>}
                      </div>
                      {d.reason && <div className="text-c-text-2">{d.reason}</div>}
                      {scopes.length > 0 && (
                        <div className="text-c-text-2 font-mono truncate">{scopes.join(' ')}</div>
                      )}
                    </div>
                    <span className="ml-auto text-c-text-2 whitespace-nowrap">{formatRegisteredAt(d.created_at)}</span>
                  </div>
                )
              })}
            </div>

            {/* Trace waterfall — the same view the studio shows, from client-exported spans */}
            <h2 className="text-[12px] font-semibold text-c-text mt-5 mb-1">Trace</h2>
            {trace.spans.length === 0 ? (
              <div className="text-[11.5px] text-c-text-2">
                No spans exported for this run. Enable client span export (<span className="font-mono">trace_export=True</span> or <span className="font-mono">AUTH51_TRACE_EXPORT=1</span>) to see the full waterfall.
              </div>
            ) : (
              <TraceWaterfall spans={trace.spans as unknown as Span[]} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'open' ? 'bg-c-accent/15 text-c-accent-2'
    : status === 'closed' ? 'bg-c-success/15 text-c-success'
    : 'bg-c-surface-2 text-c-text-2'
  return <span className={cn('text-[10.5px] px-1.5 py-0.5 rounded', tone)}>{status}</span>
}

function OutcomePill({ outcome }: { outcome: string }) {
  const deny = outcome.toLowerCase().includes('deny')
  const esc = outcome.toLowerCase().includes('escal')
  const tone = deny ? 'bg-c-danger/15 text-c-danger'
    : esc ? 'bg-c-warning/15 text-c-text'
    : 'bg-c-success/15 text-c-success'
  return <span className={cn('text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5', tone)}>{outcome}</span>
}
