'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ImplicitWorkflow, ImplicitWorkflowNode } from '@/lib/agent-classification'
import { cn } from '@/lib/utils'

/**
 * Renders an implicit workflow (orchestrator + delegated agents) as a
 * DAG using React Flow. Nodes are positioned by depth (rank) and colored
 * by their classified role. Clicking a node bubbles up to the parent so
 * the page can open agent details.
 */
export function WorkflowDiagram({
  workflow,
  height = 360,
  onSelectAgent,
}: {
  workflow: ImplicitWorkflow
  height?: number
  onSelectAgent?: (agentId: string) => void
}) {
  const { nodes, edges } = useMemo(
    () => layoutWorkflow(workflow),
    [workflow],
  )

  return (
    <div className="border border-c-border rounded-lg bg-c-bg overflow-hidden" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={false}
        zoomOnPinch={true}
        panOnDrag={true}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        onNodeClick={(_event, node) => onSelectAgent?.(node.id)}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(120, 130, 150, 0.18)"
        />
      </ReactFlow>
    </div>
  )
}

// ─── Layout: group nodes by depth, fan out per level ────────────────────────

function layoutWorkflow(wf: ImplicitWorkflow): { nodes: Node[]; edges: Edge[] } {
  // Bucket nodes by their depth
  const levels = new Map<number, ImplicitWorkflowNode[]>()
  for (const n of wf.nodes) {
    const arr = levels.get(n.depth) ?? []
    arr.push(n)
    levels.set(n.depth, arr)
  }

  const Y_GAP = 110
  const X_GAP = 220
  const NODE_W = 180

  const rfNodes: Node[] = []
  for (const [depth, group] of [...levels.entries()].sort((a, b) => a[0] - b[0])) {
    const count = group.length
    const totalWidth = count * X_GAP
    const startX = -totalWidth / 2 + X_GAP / 2
    group.forEach((n, i) => {
      rfNodes.push({
        id: n.agentId,
        type: 'workflowAgent',
        position: { x: startX + i * X_GAP - NODE_W / 2, y: depth * Y_GAP },
        data: n,
        draggable: false,
      })
    })
  }

  const rfEdges: Edge[] = wf.edges.map((e, i) => ({
    id: `e${i}`,
    source: e.from,
    target: e.to,
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: 'rgb(var(--c-accent) / 0.7)',
      strokeWidth: 1.5,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(var(--c-accent))', width: 14, height: 14 },
  }))

  return { nodes: rfNodes, edges: rfEdges }
}

// ─── Custom node visual ────────────────────────────────────────────────────

const NODE_TYPES = {
  workflowAgent: WorkflowAgentNode,
}

function WorkflowAgentNode({ data }: NodeProps) {
  const d = data as ImplicitWorkflowNode

  const roleDot =
    d.role === 'orchestrator' ? 'bg-c-accent' :
    d.role === 'hybrid'       ? 'bg-c-warning' :
    d.role === 'tool-agent'   ? 'bg-c-text-3'  :
    d.role === 'worker'       ? 'bg-c-success' :
                                'bg-c-text-3'

  const roleBorder =
    d.role === 'orchestrator' ? 'border-c-accent/50' :
    d.role === 'hybrid'       ? 'border-c-warning/50' :
                                'border-c-border'

  const subtone =
    d.scenarioActorKind === 'malicious' || d.scenarioActorKind === 'attacker'
      ? 'text-c-danger'
      : 'text-c-text-3'

  const reasoningLabel =
    d.reasoning === 'react' ? 'ReAct' :
    d.reasoning === 'plan-execute' ? 'Plan-and-execute' :
    d.reasoning === 'conversational' ? 'Conversational' :
    d.reasoning === 'direct' ? 'Direct' : '—'

  return (
    <div
      className={cn(
        'min-w-[170px] max-w-[180px] rounded-md border bg-c-surface px-3 py-2 shadow-sm cursor-pointer transition-colors',
        roleBorder,
        'hover:bg-c-surface-2',
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-2 !h-2" />
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', roleDot)} />
        <span className="font-mono text-[12px] font-semibold text-c-text leading-tight truncate">
          {d.agentId}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] text-c-text-2">{reasoningLabel}</span>
        <span className={cn('text-[10px] font-mono', subtone)}>
          {d.subAgentCount > 0 ? `↳ ${d.subAgentCount}` : `${d.toolCount} tools`}
        </span>
      </div>
      {d.autonomy === 'human-in-loop' && (
        <div className="mt-1 text-[9.5px] uppercase tracking-wider text-c-warning">
          Human-in-loop
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-2 !h-2" />
    </div>
  )
}
