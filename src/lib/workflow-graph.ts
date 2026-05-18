/**
 * Normalized workflow graph — single shape that describes any workflow
 * regardless of its data source.
 *
 * Three data sources feed it:
 *  - `inferred`   — derived from the agent-to-agent tool graph
 *  - `registered` — actual WorkflowDefinition records pulled from the IDP
 *  - `runtime`    — actual execution traces (LangSmith, etc.)
 *
 * The same renderer (WorkflowTree, WorkflowDiagram) consumes this shape.
 * Source-specific loaders convert their native data into WorkflowGraph.
 *
 * Pure TypeScript — no React/Next dependencies. Reusable by Console and CLI.
 */

import type {
  AgentClassification,
  AgentRole,
  ReasoningPattern,
  AutonomyLevel,
  Provenance,
  ImplicitWorkflow,
} from './agent-classification'

// ── Source / kind enums ──────────────────────────────────────────────────

export type WorkflowSource = 'inferred' | 'registered' | 'runtime'

export type WorkflowNodeKind =
  /** An agent identity */
  | 'agent'
  /** A declared step in a WorkflowDefinition (agent + action + scopes) */
  | 'step'
  /** An actual execution invocation (timed, status'd) */
  | 'call'

export type WorkflowEdgeKind =
  /** Parent orchestrator delegates to child agent (tool graph) */
  | 'delegates'
  /** Step has explicit `dependencies` */
  | 'depends-on'
  /** Runtime: caller invoked callee */
  | 'calls'

// ── Node / edge / graph ──────────────────────────────────────────────────

export type WorkflowGraphNode = {
  /** Unique within this workflow graph */
  id: string
  /** Human-readable label (typically agent_id or step name) */
  label: string
  kind: WorkflowNodeKind

  /** Canonical parent in the tree projection (null = root) */
  parentId: string | null
  /** Depth from root, 0 = root */
  depth: number
  /** Additional parents beyond the canonical one — shown as "also depends on" annotations */
  extraParentIds: string[]

  /** Agent-level metadata (present when kind === 'agent' or when a step references an agent) */
  agentId?: string
  classification?: AgentClassification
  role?: AgentRole
  reasoning?: ReasoningPattern
  autonomy?: AutonomyLevel

  /** Step-specific metadata (kind === 'step') */
  action?: string
  scopes?: string[]
  approvalGate?: boolean
  required?: boolean

  /** Runtime/call-specific metadata (kind === 'call') */
  startedAt?: number
  durationMs?: number
  status?: 'ok' | 'fail' | 'running'
  error?: string
}

export type WorkflowGraphEdge = {
  from: string
  to: string
  kind: WorkflowEdgeKind
  label?: string
}

export type WorkflowGraph = {
  id: string                       // stable id for this workflow
  source: WorkflowSource
  rootLabel: string                // display label for the workflow itself
  rootNodeId: string               // the node id of the root in `nodes`
  nodes: WorkflowGraphNode[]       // BFS order from root
  edges: WorkflowGraphEdge[]
  depth: number                    // max depth across nodes
  agentCount: number               // distinct agents referenced
  hasApprovalGates: boolean
  provenance?: Provenance
  scenarioId?: string
  /** Number of nodes whose parentId in the tree projection differs from real DAG. Indicates DAG-ness. */
  mergePoints: number
}

// ── Adapter: ImplicitWorkflow → WorkflowGraph ────────────────────────────

/**
 * Convert an `ImplicitWorkflow` (derived from the agent tool graph) into the
 * normalized `WorkflowGraph` shape. The graph is naturally a DAG with one
 * root, but each agent typically has exactly one parent in the tool graph
 * so the tree projection is lossless in practice. When an agent appears as
 * a tool of multiple orchestrators, the first occurrence becomes the
 * canonical parent and subsequent ones are surfaced as `extraParentIds`.
 */
export function inferredWorkflowToGraph(wf: ImplicitWorkflow): WorkflowGraph {
  const nodes: WorkflowGraphNode[] = []
  const edges: WorkflowGraphEdge[] = []
  const seenParent = new Map<string, string>() // childId -> canonical parentId
  const extraParents = new Map<string, string[]>() // childId -> additional parents

  // Build parent index from edges
  for (const e of wf.edges) {
    if (!seenParent.has(e.to)) {
      seenParent.set(e.to, e.from)
    } else {
      const arr = extraParents.get(e.to) ?? []
      arr.push(e.from)
      extraParents.set(e.to, arr)
    }
  }

  // Build canonical node list
  for (const n of wf.nodes) {
    const canonicalParent = seenParent.get(n.agentId) ?? null
    nodes.push({
      id: n.agentId,
      label: n.agentId,
      kind: 'agent',
      parentId: canonicalParent,
      depth: n.depth,
      extraParentIds: extraParents.get(n.agentId) ?? [],
      agentId: n.agentId,
      classification: n.classification,
      role: n.role,
      reasoning: n.reasoning,
      autonomy: n.autonomy,
    })
  }

  // Edges — preserve all (canonical + extra)
  for (const e of wf.edges) {
    edges.push({
      from: e.from,
      to: e.to,
      kind: 'delegates',
      label: e.toolDescription,
    })
  }

  return {
    id: wf.id,
    source: 'inferred',
    rootLabel: wf.rootAgentId,
    rootNodeId: wf.rootAgentId,
    nodes,
    edges,
    depth: wf.depth,
    agentCount: wf.agentCount,
    hasApprovalGates: wf.hasApprovalGates,
    provenance: wf.provenance,
    scenarioId: wf.scenarioId,
    mergePoints: [...extraParents.values()].reduce((s, arr) => s + arr.length, 0),
  }
}

// ── Adapter stub: registered WorkflowDefinition → WorkflowGraph ─────────

/**
 * Shape of a registered workflow as returned by the IDP. Mirrors the
 * Python `WorkflowDefinition` model in patchet/src/intentmodel/intent_model.py.
 *
 * Will be wired to the `GET /intent/workflows/{app_id}` endpoint once it
 * ships in the IDP. The adapter below is ready and just needs that input.
 */
export type RegisteredWorkflowStep = {
  agent: string
  action: string
  scopes?: string[]
  dependencies?: string[]
  required?: boolean
  approval_gate?: boolean
  requires_approval?: boolean
}

export type RegisteredWorkflow = {
  workflow_id: string
  workflow_type?: 'dag' | string
  steps: Record<string, RegisteredWorkflowStep>
}

export function registeredWorkflowToGraph(
  wf: RegisteredWorkflow,
  // Map agent_id → classification, so step nodes carry the agent's role/reasoning/etc.
  classificationByAgent: Map<string, AgentClassification> = new Map(),
): WorkflowGraph {
  const stepEntries = Object.entries(wf.steps)
  const nodes: WorkflowGraphNode[] = []
  const edges: WorkflowGraphEdge[] = []
  const stepIds = new Set(stepEntries.map(([k]) => k))

  // Choose canonical parent per step: first dep that is itself a step in this workflow
  const canonicalParentByStep = new Map<string, string | null>()
  const extraParentsByStep = new Map<string, string[]>()
  for (const [stepId, step] of stepEntries) {
    const deps = (step.dependencies ?? []).filter((d) => stepIds.has(d))
    canonicalParentByStep.set(stepId, deps[0] ?? null)
    if (deps.length > 1) extraParentsByStep.set(stepId, deps.slice(1))
  }

  // Synthetic root if no step has null parent — use the workflow_id as the root step
  const roots = stepEntries.filter(([id]) => canonicalParentByStep.get(id) === null)
  const usingSyntheticRoot = roots.length !== 1

  let rootNodeId: string
  if (usingSyntheticRoot) {
    rootNodeId = `__root__${wf.workflow_id}`
    nodes.push({
      id: rootNodeId,
      label: wf.workflow_id,
      kind: 'step',
      parentId: null,
      depth: 0,
      extraParentIds: [],
      action: 'workflow root',
    })
    for (const [rootId] of roots) {
      canonicalParentByStep.set(rootId, rootNodeId)
    }
  } else {
    rootNodeId = roots[0][0]
  }

  // BFS to assign depth and order
  const depthOf = new Map<string, number>([[rootNodeId, 0]])
  const queue: string[] = [rootNodeId]
  const visited = new Set<string>([rootNodeId])
  while (queue.length) {
    const cur = queue.shift()!
    const curDepth = depthOf.get(cur) ?? 0
    for (const [stepId] of stepEntries) {
      if (canonicalParentByStep.get(stepId) === cur && !visited.has(stepId)) {
        visited.add(stepId)
        depthOf.set(stepId, curDepth + 1)
        queue.push(stepId)
      }
    }
  }

  let hasApproval = false
  let maxDepth = 0
  const agentsSeen = new Set<string>()

  for (const [stepId, step] of stepEntries) {
    const depth = depthOf.get(stepId) ?? 0
    if (depth > maxDepth) maxDepth = depth
    const classification = classificationByAgent.get(step.agent)
    const isApproval = !!(step.approval_gate || step.requires_approval)
    if (isApproval) hasApproval = true
    if (step.agent) agentsSeen.add(step.agent)
    nodes.push({
      id: stepId,
      label: stepId,
      kind: 'step',
      parentId: canonicalParentByStep.get(stepId) ?? null,
      depth,
      extraParentIds: extraParentsByStep.get(stepId) ?? [],
      agentId: step.agent,
      classification,
      role: classification?.role,
      reasoning: classification?.reasoning,
      autonomy: classification?.autonomy,
      action: step.action,
      scopes: step.scopes ?? [],
      approvalGate: isApproval,
      required: step.required,
    })
  }

  // Edges — from each step's dependencies
  for (const [stepId, step] of stepEntries) {
    for (const dep of step.dependencies ?? []) {
      if (stepIds.has(dep)) {
        edges.push({ from: dep, to: stepId, kind: 'depends-on' })
      }
    }
  }
  if (usingSyntheticRoot) {
    for (const [rootId] of roots) {
      edges.push({ from: rootNodeId, to: rootId, kind: 'depends-on' })
    }
  }

  return {
    id: wf.workflow_id,
    source: 'registered',
    rootLabel: wf.workflow_id,
    rootNodeId,
    nodes,
    edges,
    depth: maxDepth,
    agentCount: agentsSeen.size,
    hasApprovalGates: hasApproval,
    mergePoints: [...extraParentsByStep.values()].reduce((s, arr) => s + arr.length, 0),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Build the parent → children map for tree rendering */
export function childrenMapFromGraph(g: WorkflowGraph): Map<string | null, WorkflowGraphNode[]> {
  const map = new Map<string | null, WorkflowGraphNode[]>()
  for (const n of g.nodes) {
    const key = n.parentId
    const arr = map.get(key) ?? []
    arr.push(n)
    map.set(key, arr)
  }
  return map
}
