'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listAgents, AuthorityError, type Registration } from '@/lib/console/api'
import {
  classifyAgents,
  buildImplicitWorkflows,
  type AgentClassification,
  type ImplicitWorkflow,
} from '@/lib/agent-classification'
import {
  inferredWorkflowToGraph,
  type WorkflowGraph,
  type WorkflowGraphNode,
} from '@/lib/workflow-graph'
import { WorkflowTree } from '@/components/console/WorkflowTree'
import { WorkflowDiagram } from '@/components/console/WorkflowDiagram'
import { cn } from '@/lib/utils'

type ClassifiedRegistration = Registration & { classification: AgentClassification }

/**
 * Inferred workflows view.
 *
 * Derives workflow DAGs from the agent-to-agent tool graph (each orchestrator
 * is a workflow root). Renders the resulting normalized WorkflowGraph as a
 * collapsible tree by default; user can toggle to a spatial diagram.
 *
 * Selection panel on the right shows full details of the highlighted node.
 */
export default function InferredWorkflowsPage() {
  const { currentContext } = useControlPlane()
  const [agents, setAgents] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'diagram'>('tree')
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

  const implicitWorkflows: ImplicitWorkflow[] = useMemo(
    () => buildImplicitWorkflows(classified),
    [classified],
  )

  const graphs: WorkflowGraph[] = useMemo(
    () => implicitWorkflows.map((w) => inferredWorkflowToGraph(w)),
    [implicitWorkflows],
  )

  const filtered = useMemo(() => {
    if (scope === 'all') return graphs
    if (scope === 'production') return graphs.filter((g) => g.provenance === 'production')
    return graphs.filter((g) => g.provenance === 'test-scenario')
  }, [graphs, scope])

  // Auto-select first workflow
  useEffect(() => {
    if (!activeWorkflowId && filtered[0]) {
      setActiveWorkflowId(filtered[0].id)
      setSelectedNodeId(filtered[0].rootNodeId)
    }
  }, [filtered, activeWorkflowId])

  const activeGraph = useMemo(
    () => filtered.find((g) => g.id === activeWorkflowId) ?? filtered[0],
    [filtered, activeWorkflowId],
  )

  const selectedNode: WorkflowGraphNode | null = useMemo(() => {
    if (!activeGraph || !selectedNodeId) return null
    return activeGraph.nodes.find((n) => n.id === selectedNodeId) ?? null
  }, [activeGraph, selectedNodeId])

  if (!currentContext) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-[14px] text-c-text-2">Connect a Control Plane from the Overview page to view workflows.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left: workflow list */}
      <div className="w-[280px] shrink-0 border-r border-c-border overflow-y-auto">
        <div className="px-4 py-3 border-b border-c-border">
          <p className="text-[10.5px] font-mono tracking-wider uppercase text-c-text-3 mb-2">Workflows · Inferred</p>
          <div className="flex items-center rounded-md border border-c-border bg-c-bg overflow-hidden text-[11px]">
            {(['all', 'production', 'scenarios'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => { setScope(opt); setActiveWorkflowId(null); setSelectedNodeId(null) }}
                className={cn(
                  'px-2 py-1 font-medium transition-colors capitalize flex-1',
                  scope === opt ? 'bg-c-surface-2 text-c-text' : 'text-c-text-2 hover:text-c-text',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          {filtered.length === 0 && !loading && (
            <div className="px-4 py-6 text-[12px] text-c-text-3">No workflows in this scope.</div>
          )}
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => { setActiveWorkflowId(g.id); setSelectedNodeId(g.rootNodeId) }}
              className={cn(
                'w-full text-left px-4 py-2.5 border-b border-c-border transition-colors',
                activeWorkflowId === g.id ? 'bg-c-surface-2' : 'hover:bg-c-surface',
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  g.provenance === 'test-scenario' ? 'bg-c-text-3' : 'bg-c-success',
                )} />
                <span className="font-mono text-[12.5px] font-semibold text-c-text truncate">{g.rootLabel}</span>
              </div>
              <div className="mt-1 ml-3.5 text-[10.5px] text-c-text-3">
                {g.agentCount} agents · depth {g.depth + 1}
                {g.hasApprovalGates && <span className="ml-1 text-c-warning">· HITL</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle: tree / diagram */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-c-border px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[16px] font-semibold text-c-text font-mono truncate">
              {activeGraph?.rootLabel ?? '—'}
            </h1>
            <p className="text-[11px] text-c-text-3 mt-0.5">
              Inferred from the agent tool graph
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center rounded-md border border-c-border bg-c-bg overflow-hidden">
              {(['tree', 'diagram'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={cn(
                    'px-2.5 py-1.5 text-[11.5px] font-medium transition-colors capitalize',
                    viewMode === m ? 'bg-c-surface-2 text-c-text' : 'text-c-text-2 hover:text-c-text',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <button onClick={load} disabled={loading}
              className="text-[11.5px] text-c-text-2 hover:text-c-text px-2.5 py-1.5 rounded border border-c-border hover:border-c-border-2 transition-colors disabled:opacity-50">
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-md border border-c-danger/30 bg-c-danger/5 text-[12.5px] text-c-danger">
            <div className="font-medium mb-1">Could not load workflows</div>
            <div className="text-[11.5px] opacity-90">{error}</div>
          </div>
        )}

        {!error && activeGraph && (
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'tree' ? (
              <div className="py-2">
                <WorkflowTree
                  graph={activeGraph}
                  selectedId={selectedNodeId}
                  onSelect={setSelectedNodeId}
                  defaultExpandedDepth={2}
                />
              </div>
            ) : (
              <div className="p-4">
                <WorkflowDiagram
                  workflow={implicitWorkflows.find((w) => w.id === activeGraph.id)!}
                  height={Math.max(360, 160 + (activeGraph.depth + 1) * 110)}
                  onSelectAgent={(id) => setSelectedNodeId(id)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: selection detail */}
      {selectedNode && activeGraph && (
        <SelectionPanel node={selectedNode} graph={activeGraph} />
      )}
    </div>
  )
}

// ─── Selection panel ────────────────────────────────────────────────────

function SelectionPanel({ node, graph }: { node: WorkflowGraphNode; graph: WorkflowGraph }) {
  const router = useRouter()
  const c = node.classification

  return (
    <div className="w-[340px] shrink-0 border-l border-c-border bg-c-surface overflow-y-auto">
      <div className="sticky top-0 bg-c-surface border-b border-c-border px-4 py-3">
        <p className="text-[10px] font-mono tracking-wider uppercase text-c-text-3 mb-1">{graph.rootLabel} · {node.kind}</p>
        <h2 className="text-[15px] font-semibold text-c-text font-mono">{node.label}</h2>
      </div>
      <div className="px-4 py-3 space-y-4 text-[12px]">
        {c && (
          <Field label="Classification">
            <DetailRow k="Role" v={c.labels.role} />
            <DetailRow k="Reasoning" v={c.labels.reasoning} />
            <DetailRow k="Autonomy" v={c.labels.autonomy} />
            <DetailRow k="Provenance" v={c.labels.provenance} />
            {c.subAgentCount > 0 && <DetailRow k="Sub-agents" v={String(c.subAgentCount)} />}
            {c.parentAgentIds.length > 0 && (
              <DetailRow k="Used by" v={c.parentAgentIds.join(', ')} />
            )}
          </Field>
        )}

        {node.kind === 'step' && (
          <Field label="Step">
            {node.action && <DetailRow k="Action" v={node.action} />}
            {node.scopes && node.scopes.length > 0 && (
              <DetailRow k="Scopes" v={node.scopes.join(', ')} />
            )}
            {node.approvalGate && <DetailRow k="Approval" v="Required (human-in-loop)" />}
          </Field>
        )}

        {node.extraParentIds.length > 0 && (
          <Field label="DAG joins">
            <p className="text-[11.5px] text-c-text-2 leading-relaxed">
              This node also depends on:
            </p>
            <ul className="mt-1 space-y-0.5">
              {node.extraParentIds.map((p) => (
                <li key={p} className="font-mono text-[11.5px] text-c-text">{p}</li>
              ))}
            </ul>
          </Field>
        )}

        {node.agentId && (
          <button
            onClick={() => router.push(`/console/agents/registered?agent=${encodeURIComponent(node.agentId!)}`)}
            className="w-full text-left px-3 py-2 rounded-md border border-c-border hover:border-c-accent hover:bg-c-surface-2 transition-colors"
          >
            <div className="text-[11px] text-c-text-3">Open agent registry</div>
            <div className="text-[12.5px] font-mono text-c-accent mt-0.5">{node.agentId} →</div>
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-wider uppercase text-c-text-3 mb-1.5">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10.5px] uppercase tracking-wider text-c-text-3 shrink-0">{k}</span>
      <span className="text-[12px] text-c-text text-right min-w-0 truncate">{v}</span>
    </div>
  )
}
