// Shared shapes for a generated workforce pack, used by the Studio (create/review)
// and the dedicated workforce page (operate). Mirror the workforce `Profile`
// serialization; keep in sync with auth51-workforce/workforce/profiles.py.

export type OperationRef = {
  operation_id: string
  method: string
  path: string
  scope: string
  summary?: string
  interface?: { properties?: Record<string, { type?: string; description?: string }>; required?: string[] } | null
}

export type ToolRef = { ref: string; op?: OperationRef | null }

export type AgentSpec = {
  id: string
  role?: string
  system_prompt: string
  tools: ToolRef[]
  delegates_to: string[]
  limit?: number
  llm?: string // ReActAgent model id (e.g. "openai:gpt-4.1") — shown read-only in the attack editor
}

export type UseCase = {
  id: string
  title: string
  goal?: string
  entry_agent?: string | null
  kind: string
  suggested?: boolean
  members?: string[] // agents this use case exercises (entry + any delegates)
}

export type ScenarioAttack = {
  kind: string // prompt_injection | excessive_agency | custom
  overrides: Record<string, { system_prompt: string }>
  input_injection: string
}

export type Scenario = {
  id: string
  name: string
  use_case_id: string
  attack: ScenarioAttack
}

export type Profile = {
  id: string
  name: string
  description?: string
  rs_id?: string | null
  structure: string
  agents: AgentSpec[]
  programs: UseCase[]
  scenarios?: Scenario[]
  use_cases: string[]
  owner_org?: string | null
  app_id?: string | null
  source: string
}

export type ProfileSummary = {
  id: string
  name: string
  description?: string
  source: string
  owner_org?: string | null
  use_cases: string[]
  agents: string[]
}
