'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listAgents, formatRegisteredAt, shortChecksum, type Registration, AuthorityError } from '@/lib/console/api'
import { cn } from '@/lib/utils'

/**
 * Registered Agents — live view of agents the Authority has admitted.
 *
 * Fetches from `GET /intent/agents/{app_id}` using OAuth-minted bearer
 * token. Renders as a Linear-style dense table with click-to-open
 * detail panel.
 */
export default function RegisteredAgentsPage() {
  const { currentContext } = useControlPlane()
  const [agents, setAgents] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Registration | null>(null)
  const [filter, setFilter] = useState('')
  const [scope, setScope] = useState<'all' | 'main' | 'threats'>('all')

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true)
    setError(null)
    try {
      const list = await listAgents(currentContext)
      setAgents(list)
    } catch (err: unknown) {
      const msg = err instanceof AuthorityError
        ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
        : err instanceof Error ? err.message : String(err)
      setError(msg)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [currentContext])

  useEffect(() => { load() }, [load])

  // Filter + scope
  const filtered = useMemo(() => {
    let list = agents
    if (scope === 'main') list = list.filter((a) => !/^T\d+/.test(a.agent_id))
    if (scope === 'threats') list = list.filter((a) => /^T\d+/.test(a.agent_id))
    if (filter) {
      const f = filter.toLowerCase()
      list = list.filter((a) =>
        a.agent_id.toLowerCase().includes(f) ||
        a.checksum.toLowerCase().includes(f) ||
        a.app_id.toLowerCase().includes(f))
    }
    return list
  }, [agents, filter, scope])

  // Empty state if no control plane
  if (!currentContext) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-[14px] text-c-text-2">Connect a Control Plane from the Overview page to view registered agents.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className={cn('flex-1 flex flex-col min-w-0', selected && 'border-r border-c-border')}>
        <PageHeader
          appId={currentContext.appId ?? 'Patchet'}
          agentCount={agents.length}
          filteredCount={filtered.length}
          filter={filter}
          setFilter={setFilter}
          scope={scope}
          setScope={setScope}
          onRefresh={load}
          loading={loading}
        />

        {error && <ErrorBanner message={error} onRetry={load} />}

        {!error && loading && agents.length === 0 && <LoadingState />}

        {!error && !loading && filtered.length === 0 && agents.length === 0 && <EmptyAgentsState appId={currentContext.appId ?? 'Patchet'} />}

        {!error && filtered.length > 0 && (
          <AgentsTable agents={filtered} selectedId={selected?.agent_id} onSelect={setSelected} />
        )}

        {!error && !loading && filtered.length === 0 && agents.length > 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-c-text-2">
            No agents match this filter.
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <AgentDetailPanel agent={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ── Header ──

function PageHeader({
  appId, agentCount, filteredCount, filter, setFilter, scope, setScope, onRefresh, loading,
}: {
  appId: string
  agentCount: number
  filteredCount: number
  filter: string
  setFilter: (s: string) => void
  scope: 'all' | 'main' | 'threats'
  setScope: (s: 'all' | 'main' | 'threats') => void
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="border-b border-c-border px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-mono tracking-wider uppercase text-c-text-3 mb-1">Agents · Registered</p>
          <h1 className="text-[20px] font-semibold text-c-text tracking-tight">
            {appId}
            <span className="ml-2 text-[14px] font-normal text-c-text-2">
              {filteredCount === agentCount ? `${agentCount} agent${agentCount === 1 ? '' : 's'}` : `${filteredCount} of ${agentCount}`}
            </span>
          </h1>
        </div>
        <button onClick={onRefresh} disabled={loading}
          className="text-[12px] text-c-text-2 hover:text-c-text px-2.5 py-1.5 rounded border border-c-border hover:border-c-border-2 transition-colors disabled:opacity-50">
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by ID or checksum…"
          className="flex-1 max-w-md px-3 py-1.5 rounded-md border border-c-border bg-c-bg text-c-text text-[12.5px] placeholder:text-c-text-3 focus:outline-none focus:border-c-accent"
        />
        <div className="flex items-center rounded-md border border-c-border bg-c-bg overflow-hidden">
          {(['all', 'main', 'threats'] as const).map((opt) => (
            <button key={opt} onClick={() => setScope(opt)}
              className={cn(
                'px-2.5 py-1.5 text-[11.5px] font-medium transition-colors capitalize',
                scope === opt ? 'bg-c-surface-2 text-c-text' : 'text-c-text-2 hover:text-c-text',
              )}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Table ──

function AgentsTable({ agents, selectedId, onSelect }: {
  agents: Registration[]
  selectedId?: string
  onSelect: (a: Registration) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-[12.5px]">
        <thead className="sticky top-0 bg-c-bg border-b border-c-border z-10">
          <tr className="text-left">
            <Th>Agent ID</Th>
            <Th>Checksum</Th>
            <Th align="right">Tools</Th>
            <Th>Registered</Th>
            <Th>Version</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr
              key={`${a.app_id}-${a.agent_id}`}
              onClick={() => onSelect(a)}
              className={cn(
                'border-b border-c-border cursor-pointer transition-colors',
                selectedId === a.agent_id ? 'bg-c-surface-2' : 'hover:bg-c-surface',
              )}
            >
              <Td>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-c-text">{a.agent_id}</span>
                  {/^T\d+/.test(a.agent_id) && (
                    <span className="text-[9.5px] font-mono px-1 py-0.5 rounded bg-c-surface-2 text-c-text-3">threat</span>
                  )}
                </div>
              </Td>
              <Td><span className="font-mono text-c-text-2">{shortChecksum(a.checksum, 12)}…</span></Td>
              <Td align="right"><span className="text-c-text-2">{a.tools?.length ?? 0}</span></Td>
              <Td><span className="text-c-text-2">{formatRegisteredAt(a.registered_at)}</span></Td>
              <Td><span className="text-c-text-2 font-mono text-[11px]">{a.version ?? '—'}</span></Td>
              <Td>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-c-success" />
                  <span className="text-c-text-2">active</span>
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={cn(
      'px-4 py-2.5 text-[10.5px] font-semibold tracking-wider uppercase text-c-text-3',
      align === 'right' && 'text-right',
    )}>{children}</th>
  )
}

function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td className={cn('px-4 py-2.5', align === 'right' && 'text-right')}>{children}</td>
}

// ── Detail panel (slide-in from right) ──

function AgentDetailPanel({ agent, onClose }: { agent: Registration; onClose: () => void }) {
  return (
    <div className="w-[420px] shrink-0 bg-c-surface overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-c-surface border-b border-c-border px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-mono tracking-wider uppercase text-c-text-3 mb-1">{agent.app_id} · agent</p>
          <h2 className="text-[16px] font-semibold text-c-text font-mono">{agent.agent_id}</h2>
        </div>
        <button onClick={onClose}
          className="text-c-text-2 hover:text-c-text text-[16px] leading-none -mt-1">
          ×
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-5">
        {/* Status pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-c-success">
            <span className="h-1.5 w-1.5 rounded-full bg-c-success" />
            active
          </span>
          {agent.version && (
            <span className="text-[10.5px] font-mono text-c-text-3 px-1.5 py-0.5 rounded border border-c-border">v{agent.version}</span>
          )}
        </div>

        <Field label="Registration ID">
          <code className="block text-[11px] font-mono text-c-text-2 break-all">{agent.registration_id}</code>
        </Field>

        <Field label="Checksum (SHA-256)">
          <code className="block text-[11px] font-mono text-c-text-2 break-all">{agent.checksum}</code>
        </Field>

        <Field label="Registered at">
          <div className="text-[12px] text-c-text-2">
            {new Date(agent.registered_at).toLocaleString()}
            <span className="text-c-text-3 ml-2">({formatRegisteredAt(agent.registered_at)})</span>
          </div>
        </Field>

        {agent.tools && agent.tools.length > 0 && (
          <Field label={`Tools (${agent.tools.length})`}>
            <ul className="space-y-2">
              {agent.tools.map((t, i) => (
                <li key={i} className="text-[11.5px] border border-c-border rounded-md p-2.5 bg-c-bg">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-mono font-semibold text-c-text">{t.name}</span>
                    {t.is_agent && (
                      <span className="text-[9.5px] font-mono px-1 py-0.5 rounded bg-c-accent/10 text-c-accent">sub-agent</span>
                    )}
                  </div>
                  <code className="block text-[10.5px] font-mono text-c-text-3 mb-1">{t.signature}</code>
                  {t.description && (
                    <p className="text-[11px] text-c-text-2 leading-relaxed whitespace-pre-line line-clamp-3">{t.description.trim()}</p>
                  )}
                </li>
              ))}
            </ul>
          </Field>
        )}

        <Field label="Prompt">
          <pre className="text-[11px] font-mono text-c-text-2 whitespace-pre-wrap leading-relaxed p-2.5 rounded border border-c-border bg-c-bg max-h-64 overflow-y-auto">
            {agent.prompt}
          </pre>
        </Field>

        {agent.public_key && (
          <Field label="Public key">
            <pre className="text-[10.5px] font-mono text-c-text-3 whitespace-pre-wrap leading-snug p-2.5 rounded border border-c-border bg-c-bg max-h-40 overflow-y-auto">
              {agent.public_key.trim()}
            </pre>
          </Field>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold tracking-wider uppercase text-c-text-3 mb-1.5">{label}</div>
      {children}
    </div>
  )
}

// ── Various sub-states ──

function LoadingState() {
  return (
    <div className="px-6 py-12 text-center text-[13px] text-c-text-2">
      Loading agents from the Control Plane…
    </div>
  )
}

function EmptyAgentsState({ appId }: { appId: string }) {
  return (
    <div className="px-6 py-16 text-center max-w-md mx-auto">
      <div className="text-[14px] text-c-text-2 mb-2">No agents registered yet for <span className="font-mono text-c-text">{appId}</span>.</div>
      <p className="text-[12px] text-c-text-3 leading-relaxed">
        Register agents from your application using the Auth51 Runtime — or invoke <code className="font-mono">POST /register_all_agents</code> on the demo app to seed sample data.
      </p>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-6 mt-6 px-4 py-3 rounded-md border border-c-danger/30 bg-c-danger/5 text-[12.5px] text-c-danger flex items-start justify-between gap-3">
      <div>
        <div className="font-medium mb-1">Could not load agents</div>
        <div className="text-[11.5px] opacity-90">{message}</div>
      </div>
      <button onClick={onRetry} className="text-[11.5px] underline hover:no-underline whitespace-nowrap">
        Retry
      </button>
    </div>
  )
}
