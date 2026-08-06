import { useMemo, type ReactNode } from 'react'
import type { AgentSpec } from '@/lib/console/workforceTypes'

// A use case's supervisor→sub-agent structure, rooted at its entry agent and
// walked over each agent's `delegates_to`. Static (read from the pack), cycle-
// guarded. A single-agent use case renders as one node — the honest picture, not
// a bug. `active` (optional) highlights agents that actually participated in a run.
export function DelegationTree({ entryId, members, agents, active }: {
  entryId?: string | null
  members?: string[]
  agents: AgentSpec[]
  active?: Set<string>
}) {
  const byId = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents])
  const root = entryId || members?.[0] || agents[0]?.id
  if (!root) return null

  const node = (id: string, path: Set<string>, depth: number): ReactNode => {
    const agent = byId.get(id)
    const cycle = path.has(id)
    const next = new Set(path).add(id)
    const kids = (!cycle && agent ? (agent.delegates_to || []) : []).filter((d) => byId.has(d))
    const ran = active?.has(id)
    return (
      <div key={`${depth}:${id}`}>
        <div className="flex items-center gap-2 py-0.5" style={{ paddingLeft: depth * 16 }}>
          {depth > 0 && <span className="text-c-text-3 font-mono text-[11px] -ml-2">└</span>}
          <span
            title={depth === 0 ? 'Entry agent — starts this use case' : 'Delegated to by its parent'}
            className={`font-mono text-[11.5px] ${depth === 0 ? 'text-c-accent-2 font-medium' : 'text-c-text-2'}`}>
            {depth === 0 ? `▶ ${id}` : id}
          </span>
          {ran && <span title="Participated in this run" className="text-[9.5px] font-mono uppercase tracking-wider px-1 py-0.5 rounded bg-c-success/10 border border-c-success/30 text-c-success">ran</span>}
          {agent?.role && <span className="text-[10.5px] text-c-text-3">{agent.role}</span>}
          {agent && <span className="text-[10px] text-c-text-3">· {agent.tools.length} tool{agent.tools.length === 1 ? '' : 's'}</span>}
          {cycle && <span className="text-[10px] text-c-warning">↻ cycle</span>}
          {!agent && <span className="text-[10px] text-c-warning">missing from roster</span>}
        </div>
        {kids.map((k) => node(k, next, depth + 1))}
      </div>
    )
  }

  const reachable = new Set<string>()
  const walk = (id: string, path: Set<string>) => {
    if (path.has(id)) return
    reachable.add(id)
    const p = new Set(path).add(id)
    ;(byId.get(id)?.delegates_to || []).forEach((d) => walk(d, p))
  }
  walk(root, new Set())
  const orphans = (members || []).filter((m) => !reachable.has(m))

  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider text-c-text-3 mb-1">Delegation</div>
      {node(root, new Set(), 0)}
      {orphans.length > 0 && (
        <div className="mt-1 text-[10.5px] text-c-text-3" style={{ paddingLeft: 16 }}>
          also involved: <span className="font-mono">{orphans.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
