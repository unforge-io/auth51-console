/**
 * Agent classification — derived entirely from observable registration data.
 *
 * Philosophy: the system interprets agents from their fingerprint + tool
 * graph + workflow declarations. Agents do NOT self-declare type, role,
 * or trust. Everything in this module is computed.
 *
 * This module is pure TypeScript with no React/Next dependencies, so it
 * can be reused by:
 *   - the Auth51 Console (web)
 *   - the `a51` CLI (Node)
 *   - any future tooling that consumes agent registrations
 *
 * Maps to the orchestration / reasoning / autonomy framework described in
 * "From Prompts to Production: A Playbook for Agentic Development"
 *   https://www.infoq.com/articles/prompts-to-production-playbook-for-agentic-development/
 */

// ── Input types — match the IDP's Registration shape ──

export type ClassifierTool = {
  name: string
  signature?: string
  description?: string
  source_code?: string | null
  is_agent?: boolean
}

export type ClassifierAgent = {
  app_id: string
  agent_id: string
  prompt: string
  tools: ClassifierTool[]
  // …other fields present but not used for classification
}

// Optional workflow data — when available, sharpens autonomy detection
export type ClassifierWorkflowStep = {
  agent: string
  action: string
  scopes?: string[]
  dependencies?: string[]
  required?: boolean
  approval_gate?: boolean
  requires_approval?: boolean
}

export type ClassifierWorkflow = {
  workflow_id: string
  steps: Record<string, ClassifierWorkflowStep>
}

// ── Output types ──

export type AgentRole = 'orchestrator' | 'worker' | 'tool-agent' | 'hybrid' | 'unknown'
export type ReasoningPattern = 'react' | 'plan-execute' | 'direct' | 'conversational' | 'unknown'
export type AutonomyLevel = 'human-in-loop' | 'human-on-loop' | 'autonomous' | 'unknown'
export type Provenance = 'production' | 'test-scenario' | 'unknown'
export type AppOrchestrationShape = 'sequential' | 'concurrent' | 'hierarchical' | 'event-driven' | 'mixed' | 'unknown'

export type CapabilitySurface = {
  readOps: number          // tools whose name/scope suggests read-only
  writeOps: number         // tools whose name/scope suggests writes
  externalCalls: boolean   // any tool looks like an external API call (http_, call_, fetch_, etc.)
  internalCalls: boolean   // any tool is itself an agent (delegates)
  approvalGateScopes: number // tools whose name suggests human approval
}

export type AgentClassification = {
  /** Primary role in the multi-agent system */
  role: AgentRole
  /** Inferred reasoning architecture from prompt + tool patterns */
  reasoning: ReasoningPattern
  /** How much human supervision the agent operates under */
  autonomy: AutonomyLevel
  /** Whether this is a production agent or a synthetic scenario actor */
  provenance: Provenance

  /** If provenance=test-scenario, the threat scenario id (e.g. "T1") */
  scenarioId?: string
  /** Within a scenario, which side of the test does this agent play */
  scenarioActorKind?: 'genuine' | 'legitimate' | 'malicious' | 'attacker' | 'neutral'

  /** Tool-graph stats */
  subAgentCount: number      // tools where is_agent === true
  parentAgentIds: string[]   // agents whose .tools[] reference this agent
  isOrchestrator: boolean
  isToolOfOtherAgent: boolean

  /** Capability stats */
  capabilities: CapabilitySurface

  /** Friendly display strings */
  labels: {
    role: string             // e.g. "Orchestrator", "Worker"
    reasoning: string        // e.g. "ReAct loop", "Direct execution"
    autonomy: string         // e.g. "Human-in-loop", "Autonomous"
    provenance: string       // e.g. "Production", "Threat T1 · malicious"
  }

  /** Compact badges for UI listings */
  badges: string[]
}

// ── Heuristics ──

const REACT_KEYWORDS = [
  /\bthought\b.*\baction\b.*\bobservation\b/is,
  /\breason(?:ing)?\b.*\bact(?:ion)?\b/is,
  /\bobserve\b.*\bthink\b.*\bact\b/is,
  /\bReAct\b/,
]

const PLAN_EXECUTE_KEYWORDS = [
  /\bplan\b.*\bexecute\b/is,
  /\b(?:create|generate|build)\s+(?:a\s+)?plan\b/is,
  /\bstep[- ]by[- ]step\s+plan\b/is,
  /\bdecompose\b.*\btask\b/is,
]

// "Conversational" here means the agent's primary mode is interacting with
// a human user (chatbot-style). It does NOT include passive references to
// the LLM's own message log ("conversation history") which is a runtime
// implementation detail of almost every agent.
const CONVERSATIONAL_KEYWORDS = [
  /\b(?:chatbot|conversational\s+agent|dialogue\s+system)\b/i,
  /\brespond\s+to\s+the\s+user\b/i,
  /\bgreet\s+the\s+user\b/i,
  /\bassist(?:ing)?\s+(?:the\s+)?user\b/i,
  /\bclarif(?:y|ication)\s+questions?\b/i,
  /\bongoing\s+dialogue\b/i,
]

const WRITE_SCOPE_PATTERNS = [
  /^write[:_-]/i,
  /^delete[:_-]/i,
  /^create[:_-]/i,
  /^update[:_-]/i,
  /^(?:put|post|patch)[:_-]/i,
  /^merge[:_-]/i,
  /^approve[:_-]/i,
  /^payment[:_-]/i,
  /^deploy[:_-]/i,
]

const READ_SCOPE_PATTERNS = [
  /^read[:_-]/i,
  /^list[:_-]/i,
  /^get[:_-]/i,
  /^fetch[:_-]/i,
  /^search[:_-]/i,
  /^introspect[:_-]/i,
]

const EXTERNAL_API_TOOL_PATTERNS = [
  /^http[:_-]/i,
  /^api[:_-]/i,
  /\bcall_(?:api|external)/i,
  /\bfetch_url\b/i,
  /\binvoke_(?:external|service)/i,
]

const APPROVAL_TOOL_PATTERNS = [
  /\bapprov(?:e|al)\b/i,
  /\bconfirm\b/i,
  /\bhuman[_-]review\b/i,
  /\brequire[_-]approval\b/i,
]

const THREAT_SCENARIO_ID_RE = /^(T\d{1,2})(?=[A-Z]|$)/

const ACTOR_KIND_PATTERNS: Array<[RegExp, AgentClassification['scenarioActorKind']]> = [
  [/malicious/i,   'malicious'],
  [/attacker/i,    'attacker'],
  [/rogue/i,       'malicious'],
  [/fake/i,        'malicious'],
  [/impersonat/i,  'malicious'],
  [/genuine/i,     'genuine'],
  [/legitimate/i,  'legitimate'],
]

// ── Classification logic (per agent) ──

function classifyRole(
  agent: ClassifierAgent,
  parentAgentIds: string[],
  subAgentCount: number,
): AgentRole {
  const isParent = subAgentCount >= 1
  const isChild = parentAgentIds.length >= 1
  if (isParent && isChild) return 'hybrid'
  if (isParent) return 'orchestrator'
  if (isChild) return 'tool-agent'
  if (!isParent && !isChild) return 'worker'
  return 'unknown'
}

/**
 * Reasoning pattern inference — structural-first.
 *
 * The literal prompt rarely says "ReAct" or "Plan-and-execute". The
 * pattern reveals itself through what tools an agent has and how it's
 * composed. We use prompt language only as a refinement / tiebreaker.
 */
function classifyReasoning(agent: ClassifierAgent): ReasoningPattern {
  const text = agent.prompt ?? ''
  const tools = agent.tools ?? []
  const subAgents = tools.filter((t) => t.is_agent)
  const detTools = tools.filter((t) => !t.is_agent)
  const hasSubAgents = subAgents.length > 0

  // ── (1) Explicit prompt signals override everything ──
  if (REACT_KEYWORDS.some((re) => re.test(text))) return 'react'
  if (PLAN_EXECUTE_KEYWORDS.some((re) => re.test(text))) return 'plan-execute'
  if (CONVERSATIONAL_KEYWORDS.some((re) => re.test(text))) return 'conversational'

  // ── (2) Orchestrators with sub-agents → plan-and-execute ──
  // An agent that delegates work to other agents is, by definition, planning
  // and dispatching. This is the "Supervisor / Hierarchical Agent" pattern.
  if (hasSubAgents) return 'plan-execute'

  // ── (3) ReAct heuristic: multiple tools including observation-style ones ──
  // ReAct = think → act → observe → loop. Agents that have search / lookup /
  // inspect / verify-style tools alongside action tools are using this loop.
  //
  // We tokenize the tool name on underscores/hyphens/camelCase boundaries so
  // names like `list_files` or `generate_sbom` match correctly — JavaScript
  // word boundaries don't break on underscores.
  const OBSERVATION_VERBS = new Set([
    'search','lookup','observe','inspect','check','verify','validate',
    'read','list','get','fetch','query','find','introspect','whoami','peek','review',
  ])
  const ACTION_VERBS = new Set([
    'create','update','delete','write','put','post','patch','merge','deploy',
    'approve','bump','push','raise','invoke','run','trigger','execute','generate',
    'build','send','publish','register','triage','remove','add','set',
  ])

  const tokenize = (name: string): string[] =>
    name.split(/[_\-\s]+|(?=[A-Z])/).map((s) => s.toLowerCase()).filter(Boolean)
  const matchesAny = (name: string, set: Set<string>): boolean =>
    tokenize(name).some((tok) => set.has(tok))

  const observationTools = detTools.filter((t) => matchesAny(t.name, OBSERVATION_VERBS))
  const actionTools = detTools.filter((t) => matchesAny(t.name, ACTION_VERBS))

  if (detTools.length >= 3 && observationTools.length >= 1 && actionTools.length >= 1) {
    return 'react'
  }

  // ── (4) Plan-and-execute structurally: many sequential action tools ──
  // 4+ action-style tools with few observation tools = predefined plan that
  // the agent walks through (e.g. Patcher: bump → verify → push → PR → merge).
  if (detTools.length >= 4 && actionTools.length >= 3) {
    return 'plan-execute'
  }

  // ── (5) Conversational signal: presence of memory/history-related tools ──
  if (detTools.some((t) => /\b(?:history|memory|context|recall|conversation)\b/i.test(t.name))) {
    return 'conversational'
  }

  // ── (6) Direct: few tools, no looping characteristics ──
  if (detTools.length > 0 && detTools.length <= 3) return 'direct'

  // ── (7) Single-tool or no-tool agents ──
  if (detTools.length === 0 && !hasSubAgents) return 'unknown'

  return 'unknown'
}

function classifyAutonomy(
  agent: ClassifierAgent,
  workflows: ClassifierWorkflow[],
): AutonomyLevel {
  // 1. Workflow steps assigned to this agent that have approval gates
  for (const wf of workflows) {
    for (const step of Object.values(wf.steps ?? {})) {
      if (step.agent === agent.agent_id) {
        if (step.approval_gate || step.requires_approval) return 'human-in-loop'
      }
    }
  }
  // 2. Tools that smell like approval gates
  if (agent.tools.some((t) => APPROVAL_TOOL_PATTERNS.some((re) => re.test(t.name)))) {
    return 'human-in-loop'
  }
  // 3. Prompt language about supervision / oversight (weaker signal — "on-loop")
  if (/\bhuman\b.*\b(?:oversee|monitor|supervise|review|override)\b/i.test(agent.prompt)) {
    return 'human-on-loop'
  }
  return 'autonomous'
}

function classifyProvenance(agent: ClassifierAgent): {
  provenance: Provenance
  scenarioId?: string
  scenarioActorKind?: AgentClassification['scenarioActorKind']
} {
  const m = agent.agent_id.match(THREAT_SCENARIO_ID_RE)
  if (!m) {
    return { provenance: 'production' }
  }
  const scenarioId = m[1]
  const rest = agent.agent_id.slice(m[0].length)
  let scenarioActorKind: AgentClassification['scenarioActorKind'] = 'neutral'
  for (const [re, kind] of ACTOR_KIND_PATTERNS) {
    if (re.test(rest)) { scenarioActorKind = kind; break }
  }
  return { provenance: 'test-scenario', scenarioId, scenarioActorKind }
}

function classifyCapabilities(agent: ClassifierAgent): CapabilitySurface {
  let read = 0, write = 0, external = false, approvalGate = 0
  let internal = false
  for (const t of agent.tools) {
    if (t.is_agent) { internal = true; continue }
    if (WRITE_SCOPE_PATTERNS.some((re) => re.test(t.name))) write++
    else if (READ_SCOPE_PATTERNS.some((re) => re.test(t.name))) read++
    if (EXTERNAL_API_TOOL_PATTERNS.some((re) => re.test(t.name))) external = true
    if (APPROVAL_TOOL_PATTERNS.some((re) => re.test(t.name))) approvalGate++
  }
  return { readOps: read, writeOps: write, externalCalls: external, internalCalls: internal, approvalGateScopes: approvalGate }
}

// ── Top-level: classify a population ──

export function classifyAgents(
  agents: ClassifierAgent[],
  workflows: ClassifierWorkflow[] = [],
): Array<ClassifierAgent & { classification: AgentClassification }> {
  // Build reverse tool-graph index: for each agent_id, find which agents reference it as a tool
  const parentsOf = new Map<string, string[]>()
  for (const a of agents) {
    for (const t of a.tools ?? []) {
      if (t.is_agent && t.name) {
        const arr = parentsOf.get(t.name) ?? []
        arr.push(a.agent_id)
        parentsOf.set(t.name, arr)
      }
    }
  }

  return agents.map((agent) => {
    const subAgentCount = (agent.tools ?? []).filter((t) => t.is_agent).length
    const parentAgentIds = parentsOf.get(agent.agent_id) ?? []

    const role = classifyRole(agent, parentAgentIds, subAgentCount)
    const reasoning = classifyReasoning(agent)
    const autonomy = classifyAutonomy(agent, workflows)
    const prov = classifyProvenance(agent)
    const capabilities = classifyCapabilities(agent)

    const labels = {
      role: roleLabel(role),
      reasoning: reasoningLabel(reasoning),
      autonomy: autonomyLabel(autonomy),
      provenance: provenanceLabel(prov),
    }

    const badges: string[] = []
    if (subAgentCount > 0) badges.push(`${subAgentCount} sub-agent${subAgentCount === 1 ? '' : 's'}`)
    if (parentAgentIds.length > 0) badges.push(`tool of ${parentAgentIds.length}`)
    if (capabilities.writeOps > 0) badges.push('write-capable')
    if (capabilities.externalCalls) badges.push('external API')
    if (capabilities.approvalGateScopes > 0) badges.push('approval-gated')
    if (autonomy === 'human-in-loop') badges.push('human-in-loop')

    return {
      ...agent,
      classification: {
        role,
        reasoning,
        autonomy,
        provenance: prov.provenance,
        scenarioId: prov.scenarioId,
        scenarioActorKind: prov.scenarioActorKind,
        subAgentCount,
        parentAgentIds,
        isOrchestrator: subAgentCount >= 1,
        isToolOfOtherAgent: parentAgentIds.length >= 1,
        capabilities,
        labels,
        badges,
      },
    }
  })
}

// ── App-level orchestration shape (works on workflows) ──

export function classifyAppOrchestration(workflows: ClassifierWorkflow[]): AppOrchestrationShape {
  if (!workflows || workflows.length === 0) return 'unknown'
  let sequential = 0, concurrent = 0
  const hierarchical = 0
  for (const wf of workflows) {
    const steps = Object.values(wf.steps ?? {})
    if (steps.length === 0) continue
    // Hierarchical signal: a step's `agent` is itself a parent in the agent tool-graph
    // (would need the agent set to fully resolve — left as a heuristic placeholder)
    // Concurrent signal: multiple steps with the same `dependencies`
    const depSig = new Map<string, number>()
    for (const s of steps) {
      const key = (s.dependencies ?? []).slice().sort().join('|')
      depSig.set(key, (depSig.get(key) ?? 0) + 1)
    }
    const maxParallel = Math.max(0, ...Array.from(depSig.values()))
    if (maxParallel >= 2) concurrent++
    // Sequential signal: each step has at most one dependency, forming a chain
    const looksLinear = steps.every((s) => (s.dependencies ?? []).length <= 1)
    if (looksLinear && maxParallel <= 1) sequential++
  }
  if (concurrent && sequential) return 'mixed'
  if (concurrent) return 'concurrent'
  if (sequential) return 'sequential'
  if (hierarchical) return 'hierarchical'
  return 'mixed'
}

// ── Display labels ──

function roleLabel(r: AgentRole): string {
  switch (r) {
    case 'orchestrator': return 'Orchestrator'
    case 'worker':       return 'Worker'
    case 'tool-agent':   return 'Tool-agent'
    case 'hybrid':       return 'Hybrid'
    default:             return 'Unknown'
  }
}

function reasoningLabel(r: ReasoningPattern): string {
  switch (r) {
    case 'react':          return 'ReAct loop'
    case 'plan-execute':   return 'Plan-and-execute'
    case 'direct':         return 'Direct execution'
    case 'conversational': return 'Conversational'
    default:               return 'Unknown'
  }
}

function autonomyLabel(a: AutonomyLevel): string {
  switch (a) {
    case 'human-in-loop':  return 'Human-in-loop'
    case 'human-on-loop':  return 'Human-on-loop'
    case 'autonomous':     return 'Autonomous'
    default:               return 'Unknown'
  }
}

function provenanceLabel(p: { provenance: Provenance; scenarioId?: string; scenarioActorKind?: string }): string {
  if (p.provenance === 'production') return 'Production'
  if (p.provenance === 'test-scenario') {
    const kind = p.scenarioActorKind && p.scenarioActorKind !== 'neutral' ? ` · ${p.scenarioActorKind}` : ''
    return `Threat ${p.scenarioId}${kind}`
  }
  return 'Unknown'
}
