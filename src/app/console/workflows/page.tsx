'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listAgents, AuthorityError, type Registration } from '@/lib/console/api'
import {
  classifyAgents,
  buildImplicitWorkflows,
  type AgentClassification,
  type ImplicitWorkflow,
} from '@/lib/agent-classification'
import { WorkflowDiagram } from '@/components/console/WorkflowDiagram'
import { cn } from '@/lib/utils'

type ClassifiedRegistration = Registration & { classification: AgentClassification }

/**
 * Workflow visualizer.
 *
 * Today: renders "implicit workflows" — DAGs derived from the agent-to-agent
 * tool graph. Every orchestrator (an agent with sub-agent tools) is one
 * workflow root; sub-agents are children; recursion continues to leaves.
 *
 * Future: when the Authority exposes GET /intent/workflows/{app_id} with
 * registered WorkflowDefinition records (with step dependencies, approval
 * gates, scope declarations), we'll merge that data here to render the
 * authoritative declared workflows alongside the inferred ones.
 */
export default function WorkflowsPage() {
  const { currentContext } = useControlPlane()
  const [agents, setAgents] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [scope, setScope] = useState<'all' | 'production' | 'scenarios'>('production')

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

  const classified = useMemo(
    () => classifyAgents(agents) as ClassifiedRegistration[],
    [agents],
  )

  const workflows = useMemo(() => buildImplicitWorkflows(classified), [classified])

  const filteredWorkflows = useMemo(() => {
    if (scope === 'all') return workflows
    if (scope === 'production') return workflows.filter((w) => w.provenance === 'production')
    return workflows.filter((w) => w.provenance === 'test-scenario')
  }, [workflows, scope])

  // Auto-expand the first workflow when data first loads
  useEffect(() => {
    if (!expandedId && filteredWorkflows[0]) {
      setExpandedId(filteredWorkflows[0].id)
    }
  }, [filteredWorkflows, expandedId])

  if (!currentContext) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-[14px] text-c-text-2">Connect a Control Plane from the Overview page to view workflows.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-c-border px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-mono tracking-wider uppercase text-c-text-3 mb-1">Workflows · Definitions</p>
              <h1 className="text-[20px] font-semibold text-c-text tracking-tight">
                {currentContext.appId ?? 'Patchet'}
                <span className="ml-2 text-[14px] font-normal text-c-text-2">
                  {filteredWorkflows.length} workflow{filteredWorkflows.length === 1 ? '' : 's'}
                </span>
              </h1>
              <p className="mt-1.5 text-[12px] text-c-text-3 max-w-[600px] leading-relaxed">
                Inferred from the agent-to-agent tool graph. Each orchestrator agent and its delegation chain is one workflow.
                Click a node to jump to its agent details.
              </p>
            </div>
            <button onClick={load} disabled={loading}
              className="text-[12px] text-c-text-2 hover:text-c-text px-2.5 py-1.5 rounded border border-c-border hover:border-c-border-2 transition-colors disabled:opacity-50">
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-c-border bg-c-bg overflow-hidden">
              {(['all', 'production', 'scenarios'] as const).map((opt) => (
                <button key={opt} onClick={() => { setScope(opt); setExpandedId(null) }}
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

        {/* Content */}
        {error && (
          <div className="mx-6 mt-6 px-4 py-3 rounded-md border border-c-danger/30 bg-c-danger/5 text-[12.5px] text-c-danger">
            <div className="font-medium mb-1">Could not load workflows</div>
            <div className="text-[11.5px] opacity-90">{error}</div>
          </div>
        )}

        {!error && loading && agents.length === 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-c-text-2">Loading…</div>
        )}

        {!error && !loading && filteredWorkflows.length === 0 && agents.length > 0 && (
          <div className="px-6 py-16 text-center max-w-md mx-auto">
            <p className="text-[14px] text-c-text-2 mb-2">No workflows in this scope.</p>
            <p className="text-[12px] text-c-text-3 leading-relaxed">
              An orchestrator is an agent that delegates work to other agents (has at least one tool with{' '}
              <code className="font-mono">is_agent: true</code>).
              {scope === 'production' && ' Switch to "all" or "scenarios" to see test workflows.'}
            </p>
          </div>
        )}

        {!error && filteredWorkflows.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {filteredWorkflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                expanded={expandedId === wf.id}
                onToggle={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Workflow card ─────────────────────────────────────────────────────────

function WorkflowCard({
  wf, expanded, onToggle,
}: {
  wf: ImplicitWorkflow
  expanded: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  const isScenario = wf.provenance === 'test-scenario'
  const provLabel = isScenario ? `Threat ${wf.scenarioId}` : 'Production'
  return (
    <div className="rounded-xl border border-c-border bg-c-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-c-surface-2 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn(
            'h-2 w-2 rounded-full shrink-0',
            isScenario ? 'bg-c-text-3' : 'bg-c-success',
          )} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[14px] font-semibold text-c-text truncate">
                {wf.rootAgentId}
              </span>
              <span className="text-[10px] font-mono text-c-text-3 px-1.5 py-0.5 rounded border border-c-border">
                {provLabel}
              </span>
              {wf.hasApprovalGates && (
                <span className="text-[10px] font-mono text-c-warning px-1.5 py-0.5 rounded border border-c-warning/30 bg-c-warning/10">
                  human-in-loop
                </span>
              )}
            </div>
            <div className="mt-1 text-[11.5px] text-c-text-3">
              {wf.agentCount} agent{wf.agentCount === 1 ? '' : 's'} · {wf.edges.length} delegation{wf.edges.length === 1 ? '' : 's'} · depth {wf.depth + 1}
            </div>
          </div>
        </div>
        <div className="text-c-text-3 text-[14px]">{expanded ? '▾' : '▸'}</div>
      </button>

      {expanded && (
        <div className="border-t border-c-border bg-c-bg/40">
          <WorkflowDiagram
            workflow={wf}
            height={Math.max(280, 140 + (wf.depth + 1) * 110)}
            onSelectAgent={(agentId) => router.push(`/console/agents/registered?agent=${encodeURIComponent(agentId)}`)}
          />
          <div className="px-5 py-3 border-t border-c-border text-[11.5px] text-c-text-3 flex items-center justify-between gap-3">
            <span>Click any node to view its agent details.</span>
            <Link
              href={`/console/agents/registered?agent=${encodeURIComponent(wf.rootAgentId)}`}
              className="text-c-accent hover:text-c-accent-2 no-underline"
            >
              Open root agent → {wf.rootAgentId}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
