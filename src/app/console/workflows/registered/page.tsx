'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listAgents, listRegisteredWorkflows, AuthorityError, type Registration } from '@/lib/console/api'
import {
  classifyAgents,
  type AgentClassification,
} from '@/lib/agent-classification'
import {
  registeredWorkflowToGraph,
  type RegisteredWorkflow,
  type WorkflowGraph,
  type WorkflowGraphNode,
} from '@/lib/workflow-graph'
import { WorkflowTree } from '@/components/console/WorkflowTree'
import { cn } from '@/lib/utils'

/**
 * Registered workflows view.
 *
 * Fetches actual WorkflowDefinition records from the Authority's
 * `/intent/workflows/{app_id}` endpoint and renders them as trees.
 * Step nodes carry full step metadata (action, scopes, approval gates)
 * plus the agent classification of the agent the step references.
 *
 * Until the IDP endpoint lands, the API client returns an empty list
 * and this view shows a friendly placeholder.
 */
export default function RegisteredWorkflowsPage() {
  const { currentContext } = useControlPlane()
  const [agents, setAgents] = useState<Registration[]>([])
  const [workflows, setWorkflows] = useState<RegisteredWorkflow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unsupported, setUnsupported] = useState(false)
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true)
    setError(null)
    setUnsupported(false)
    try {
      const [agentList, wfList] = await Promise.all([
        listAgents(currentContext).catch(() => [] as Registration[]),
        listRegisteredWorkflows(currentContext),
      ])
      setAgents(agentList)
      setWorkflows(wfList)
    } catch (err: unknown) {
      // 404 → endpoint not deployed yet
      if (err instanceof AuthorityError && err.status === 404) {
        setUnsupported(true)
        setWorkflows([])
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setWorkflows([])
      }
    } finally {
      setLoading(false)
    }
  }, [currentContext])

  useEffect(() => { load() }, [load])

  const classified = useMemo(() => classifyAgents(agents), [agents])
  const classificationByAgent = useMemo(() => {
    const map = new Map<string, AgentClassification>()
    for (const a of classified) map.set(a.agent_id, a.classification)
    return map
  }, [classified])

  const graphs: WorkflowGraph[] = useMemo(
    () => workflows.map((wf) => registeredWorkflowToGraph(wf, classificationByAgent)),
    [workflows, classificationByAgent],
  )

  useEffect(() => {
    if (!activeWorkflowId && graphs[0]) {
      setActiveWorkflowId(graphs[0].id)
      setSelectedNodeId(graphs[0].rootNodeId)
    }
  }, [graphs, activeWorkflowId])

  const activeGraph = useMemo(
    () => graphs.find((g) => g.id === activeWorkflowId) ?? graphs[0],
    [graphs, activeWorkflowId],
  )
  const selectedNode: WorkflowGraphNode | null = useMemo(() => {
    if (!activeGraph || !selectedNodeId) return null
    return activeGraph.nodes.find((n) => n.id === selectedNodeId) ?? null
  }, [activeGraph, selectedNodeId])

  if (!currentContext) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-[14px] text-c-text-2">Connect a Control Plane to view registered workflows.</p>
      </div>
    )
  }

  if (unsupported) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <p className="text-[11px] font-mono tracking-wider uppercase text-c-accent mb-3">Coming online</p>
        <h1 className="text-[22px] font-semibold text-c-text leading-tight tracking-tight mb-3">
          Registered workflows endpoint not available yet
        </h1>
        <p className="text-[13.5px] text-c-text-2 leading-relaxed">
          The connected Control Plane (<code className="font-mono">{currentContext.endpoint}</code>) doesn&apos;t
          yet expose <code className="font-mono">GET /intent/workflows/&#123;app_id&#125;</code>.
        </p>
        <p className="mt-3 text-[13px] text-c-text-2 leading-relaxed">
          Until then, you can explore the <a className="text-c-accent hover:text-c-accent-2" href="/console/workflows/inferred">Inferred</a> view,
          which derives the same delegation structure from the agent tool graph.
        </p>
        <div className="mt-6 px-4 py-3 rounded-md border border-c-border bg-c-bg text-[11.5px] text-c-text-3 leading-relaxed">
          When you ship the endpoint, this page will pick it up automatically — no Console redeploy needed.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left: workflow list */}
      <div className="w-[280px] shrink-0 border-r border-c-border overflow-y-auto">
        <div className="px-4 py-3 border-b border-c-border">
          <p className="text-[10.5px] font-mono tracking-wider uppercase text-c-text-3 mb-1">
            Workflows · Registered
          </p>
          <p className="text-[11.5px] text-c-text-2 mt-1">
            {graphs.length} workflow{graphs.length === 1 ? '' : 's'} in IDP
          </p>
        </div>
        <div>
          {!loading && graphs.length === 0 && (
            <div className="px-4 py-6 text-[12px] text-c-text-3">
              No workflows registered yet for <span className="font-mono text-c-text">{currentContext.appId ?? 'this app'}</span>.
            </div>
          )}
          {graphs.map((g) => (
            <button
              key={g.id}
              onClick={() => { setActiveWorkflowId(g.id); setSelectedNodeId(g.rootNodeId) }}
              className={cn(
                'w-full text-left px-4 py-2.5 border-b border-c-border transition-colors',
                activeWorkflowId === g.id ? 'bg-c-surface-2' : 'hover:bg-c-surface',
              )}
            >
              <div className="font-mono text-[12.5px] font-semibold text-c-text truncate">{g.rootLabel}</div>
              <div className="mt-1 text-[10.5px] text-c-text-3">
                {g.nodes.length} steps · depth {g.depth + 1}
                {g.hasApprovalGates && <span className="ml-1 text-c-warning">· HITL</span>}
                {g.mergePoints > 0 && <span className="ml-1 text-c-text-3">· {g.mergePoints} DAG joins</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle: tree */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-c-border px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[16px] font-semibold text-c-text font-mono truncate">
              {activeGraph?.rootLabel ?? '—'}
            </h1>
            <p className="text-[11px] text-c-text-3 mt-0.5">
              Registered with the Authority
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="text-[11.5px] text-c-text-2 hover:text-c-text px-2.5 py-1.5 rounded border border-c-border hover:border-c-border-2 transition-colors disabled:opacity-50">
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-md border border-c-danger/30 bg-c-danger/5 text-[12.5px] text-c-danger">
            <div className="font-medium mb-1">Could not load workflows</div>
            <div className="text-[11.5px] opacity-90">{error}</div>
          </div>
        )}

        {!error && activeGraph && (
          <div className="flex-1 overflow-y-auto py-2">
            <WorkflowTree
              graph={activeGraph}
              selectedId={selectedNodeId}
              onSelect={setSelectedNodeId}
              defaultExpandedDepth={3}
            />
          </div>
        )}
      </div>

      {/* Right: selection panel */}
      {selectedNode && activeGraph && (
        <div className="w-[340px] shrink-0 border-l border-c-border bg-c-surface overflow-y-auto">
          <div className="sticky top-0 bg-c-surface border-b border-c-border px-4 py-3">
            <p className="text-[10px] font-mono tracking-wider uppercase text-c-text-3 mb-1">
              {activeGraph.rootLabel} · {selectedNode.kind}
            </p>
            <h2 className="text-[15px] font-semibold text-c-text font-mono">{selectedNode.label}</h2>
          </div>
          <div className="px-4 py-3 space-y-4 text-[12px]">
            {selectedNode.action && (
              <DetailRow k="Action" v={selectedNode.action} />
            )}
            {selectedNode.agentId && (
              <DetailRow k="Agent" v={selectedNode.agentId} />
            )}
            {selectedNode.scopes && selectedNode.scopes.length > 0 && (
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-c-text-3 mb-1.5">Scopes</div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.scopes.map((s) => (
                    <span key={s} className="text-[10.5px] font-mono px-1.5 py-0.5 rounded border border-c-border bg-c-bg text-c-text-2">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedNode.approvalGate && (
              <DetailRow k="Approval" v="Required (human-in-loop)" />
            )}
            {selectedNode.classification && (
              <>
                <DetailRow k="Role" v={selectedNode.classification.labels.role} />
                <DetailRow k="Reasoning" v={selectedNode.classification.labels.reasoning} />
              </>
            )}
            {selectedNode.extraParentIds.length > 0 && (
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-c-text-3 mb-1.5">DAG joins</div>
                <ul className="space-y-0.5">
                  {selectedNode.extraParentIds.map((p) => (
                    <li key={p} className="font-mono text-[11.5px] text-c-text">{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedNode.agentId && (
              <button
                onClick={() => router.push(`/console/agents/registered?agent=${encodeURIComponent(selectedNode.agentId!)}`)}
                className="w-full text-left px-3 py-2 rounded-md border border-c-border hover:border-c-accent hover:bg-c-surface-2 transition-colors"
              >
                <div className="text-[11px] text-c-text-3">Open agent registry</div>
                <div className="text-[12.5px] font-mono text-c-accent mt-0.5">{selectedNode.agentId} →</div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10.5px] uppercase tracking-wider text-c-text-3 shrink-0">{k}</span>
      <span className="text-[12px] text-c-text text-right min-w-0">{v}</span>
    </div>
  )
}
