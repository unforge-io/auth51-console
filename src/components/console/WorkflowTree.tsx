'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  childrenMapFromGraph,
  type WorkflowGraph,
  type WorkflowGraphNode,
} from '@/lib/workflow-graph'
import { cn } from '@/lib/utils'

/**
 * WorkflowTree — primary visualization for workflows.
 *
 * Collapsible, keyboard-navigable tree. Each row shows the node's label
 * plus inline classification badges. Click → select; ArrowDown/Up to
 * navigate; ArrowRight/Left to expand/collapse; Enter to select.
 *
 * Selected node is exposed via onSelect so a parent can render a side
 * panel with full details.
 *
 * Renders the same WorkflowGraph shape regardless of source (inferred /
 * registered / runtime).
 */
export function WorkflowTree({
  graph,
  selectedId,
  onSelect,
  defaultExpandedDepth = 1,
}: {
  graph: WorkflowGraph
  selectedId?: string | null
  onSelect?: (nodeId: string) => void
  /** Auto-expand all nodes whose depth is ≤ this value */
  defaultExpandedDepth?: number
}) {
  const childrenOf = useMemo(() => childrenMapFromGraph(graph), [graph])

  // Track which nodes are expanded
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const n of graph.nodes) {
      if (n.depth <= defaultExpandedDepth) set.add(n.id)
    }
    return set
  })

  // Flatten visible nodes for keyboard navigation
  const visible = useMemo(() => flattenVisible(graph, childrenOf, expanded), [graph, childrenOf, expanded])

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard handlers
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedId) return
    const idx = visible.findIndex((n) => n.id === selectedId)
    if (idx < 0) return
    const cur = visible[idx]
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = visible[Math.min(idx + 1, visible.length - 1)]
      onSelect?.(next.id)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = visible[Math.max(idx - 1, 0)]
      onSelect?.(next.id)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const kids = childrenOf.get(cur.id) ?? []
      if (kids.length > 0 && !expanded.has(cur.id)) toggle(cur.id)
      else if (kids.length > 0) onSelect?.(kids[0].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const kids = childrenOf.get(cur.id) ?? []
      if (kids.length > 0 && expanded.has(cur.id)) toggle(cur.id)
      else if (cur.parentId) onSelect?.(cur.parentId)
    }
  }, [selectedId, visible, expanded, childrenOf, onSelect, toggle])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="outline-none focus:ring-1 focus:ring-c-accent/40 rounded-md"
      role="tree"
    >
      <ul className="space-y-0">
        {(childrenOf.get(null) ?? []).map((root) => (
          <TreeRow
            key={root.id}
            node={root}
            childrenOf={childrenOf}
            expanded={expanded}
            onToggle={toggle}
            selectedId={selectedId ?? null}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
}

// ── Single row, recursive ────────────────────────────────────────────────

function TreeRow({
  node, childrenOf, expanded, onToggle, selectedId, onSelect,
}: {
  node: WorkflowGraphNode
  childrenOf: Map<string | null, WorkflowGraphNode[]>
  expanded: Set<string>
  onToggle: (id: string) => void
  selectedId: string | null
  onSelect?: (id: string) => void
}) {
  const kids = childrenOf.get(node.id) ?? []
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const hasChildren = kids.length > 0
  const indentPx = 12 + node.depth * 16

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        onClick={() => onSelect?.(node.id)}
        style={{ paddingLeft: indentPx }}
        className={cn(
          'group flex items-center gap-2 pr-3 py-1.5 text-[12.5px] cursor-pointer select-none',
          'border-l-2 border-transparent',
          isSelected ? 'bg-c-surface-2 border-l-c-accent' : 'hover:bg-c-surface',
        )}
      >
        {/* Expand chevron */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id) }}
            className="text-c-text-3 hover:text-c-text shrink-0 w-3 leading-none"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        {/* Role dot — color carries classification info */}
        <RoleDot role={node.role} />

        {/* Label */}
        <span className="font-mono text-c-text truncate">{node.label}</span>

        {/* Inline classification chips */}
        <NodeChips node={node} />

        {/* Extra-parents annotation (DAG joins shown inline) */}
        {node.extraParentIds.length > 0 && (
          <span className="text-[10px] text-c-text-3 font-mono ml-1">
            ↗ {node.extraParentIds.length === 1 ? 'also from ' + node.extraParentIds[0] : `joins from ${node.extraParentIds.length}`}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <ul>
          {kids.map((k) => (
            <TreeRow
              key={k.id}
              node={k}
              childrenOf={childrenOf}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function RoleDot({ role }: { role?: WorkflowGraphNode['role'] }) {
  const color =
    role === 'orchestrator' ? 'bg-c-accent' :
    role === 'hybrid'       ? 'bg-c-warning' :
    role === 'tool-agent'   ? 'bg-c-text-3'  :
    role === 'worker'       ? 'bg-c-success' :
                              'bg-c-text-3/60'
  return <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', color)} />
}

function NodeChips({ node }: { node: WorkflowGraphNode }) {
  const chips: { label: string; tone?: 'default' | 'warning' | 'danger' | 'accent' }[] = []

  if (node.kind === 'agent') {
    if (node.reasoning && node.reasoning !== 'unknown') {
      chips.push({ label: reasoningShort(node.reasoning) })
    }
  } else if (node.kind === 'step') {
    if (node.action) chips.push({ label: node.action, tone: 'accent' })
    if (node.scopes && node.scopes.length > 0) {
      chips.push({ label: node.scopes.length === 1 ? node.scopes[0] : `${node.scopes.length} scopes` })
    }
  } else if (node.kind === 'call') {
    if (node.status === 'fail') chips.push({ label: 'failed', tone: 'danger' })
    else if (node.status === 'running') chips.push({ label: 'running', tone: 'accent' })
    if (typeof node.durationMs === 'number') chips.push({ label: `${node.durationMs}ms` })
  }
  if (node.approvalGate) chips.push({ label: 'human-in-loop', tone: 'warning' })

  return (
    <span className="flex items-center gap-1 ml-auto pl-2 shrink-0">
      {chips.map((c, i) => (
        <span
          key={i}
          className={cn(
            'text-[9.5px] font-medium px-1.5 py-0.5 rounded border',
            c.tone === 'warning' ? 'text-c-warning border-c-warning/30 bg-c-warning/10' :
            c.tone === 'danger'  ? 'text-c-danger  border-c-danger/30  bg-c-danger/10'  :
            c.tone === 'accent'  ? 'text-c-accent  border-c-accent/30  bg-c-accent/10'  :
                                   'text-c-text-3  border-c-border bg-c-surface',
          )}
        >
          {c.label}
        </span>
      ))}
    </span>
  )
}

function reasoningShort(r: string): string {
  switch (r) {
    case 'react': return 'ReAct'
    case 'plan-execute': return 'Plan'
    case 'conversational': return 'Conv'
    case 'direct': return 'Direct'
    default: return r
  }
}

// ── Flatten visible nodes for keyboard nav (BFS-with-collapse) ──────────

function flattenVisible(
  g: WorkflowGraph,
  childrenOf: Map<string | null, WorkflowGraphNode[]>,
  expanded: Set<string>,
): WorkflowGraphNode[] {
  const out: WorkflowGraphNode[] = []
  function walk(parentId: string | null) {
    const kids = childrenOf.get(parentId) ?? []
    for (const k of kids) {
      out.push(k)
      if (expanded.has(k.id)) walk(k.id)
    }
  }
  walk(null)
  return out
}

// Required to silence unused-import warning if React unused elsewhere
void useEffect
