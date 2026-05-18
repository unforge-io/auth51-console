/**
 * Static threat catalog — distilled from
 * patchet/src/experiment_results/summary_report.md
 *
 * For now this is hand-encoded data. When the analyzer agent ships
 * (cross-references real blocks against OSV/OWASP/CVEs in real time),
 * this becomes a fallback default + the live event stream drives the UI.
 *
 * Pure TS, no React deps — reusable by future CLI surfaces.
 */

export type StrideCategory =
  | 'Spoofing'
  | 'Tampering'
  | 'Repudiation'
  | 'Information Disclosure'
  | 'Denial of Service'
  | 'Elevation of Privilege'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type Anchor = {
  id: string        // e.g., "A1"
  name: string      // e.g., "Agent Checksum Verification"
  brief: string     // short description for tooltip / detail
}

export type Threat = {
  id: string                                // e.g., "T1"
  name: string                              // e.g., "Agent Identity Spoofing"
  category: StrideCategory
  severity: Severity
  /** One-line description of the attack */
  attack: string
  /** Concrete outcome under each mode */
  oauthOutcome: { status: 'succeeded' | 'partial'; note: string }
  intentOutcome: { status: 'blocked' | 'detected'; note: string }
  /** Auth51 anchors that block the attack */
  detectedBy: string[]                      // ["A1", "A2", ...]
  /** Optional real-world parallel for storytelling */
  parallel?: string
  /** Performance metric: detection latency */
  detectionMs?: number
}

// ── The 12 anchors ─────────────────────────────────────────────────────

export const ANCHORS: Record<string, Anchor> = {
  A1:  { id: 'A1',  name: 'Agent Checksum Verification',           brief: 'Runtime fingerprint (prompt + tools + config hash) must match the registered value.' },
  A2:  { id: 'A2',  name: 'Registration-First Security Model',     brief: 'Every agent identity must be registered with the Authority before tokens can be minted.' },
  A3:  { id: 'A3',  name: 'Per-Agent Ephemeral Keypair',           brief: 'Each agent holds a private key it never transmits; identity proofs are signed in-process.' },
  A4:  { id: 'A4',  name: 'Scope-Bound Tokens',                    brief: 'Access tokens carry the explicit scope claim required by the resource.' },
  A5:  { id: 'A5',  name: 'Shim Integrity (X-Shim-Checksum)',      brief: 'The client shim publishes its own checksum so the Authority can detect tampered shims.' },
  A6:  { id: 'A6',  name: 'Proof-of-Possession (PoP)',             brief: 'Every API call is signed with the agent\'s ephemeral private key — stolen tokens are unusable.' },
  A7:  { id: 'A7',  name: 'Cryptographic Intent Token Binding',    brief: 'Tokens declare and bind the specific action the agent intends to perform.' },
  A8:  { id: 'A8',  name: 'Workflow Validation',                   brief: 'Actions are validated against the registered workflow DAG — out-of-order or out-of-scope steps fail.' },
  A9:  { id: 'A9',  name: 'Cryptographic Delegation Chains',       brief: 'Each delegation is signed and embedded in the next token; chain tampering breaks the signature.' },
  A10: { id: 'A10', name: 'Workflow Execution Logging',            brief: 'Every step execution is logged immutably; gaps or unexpected calls are detectable.' },
  A11: { id: 'A11', name: 'Agent Registration Versioning',         brief: 'Agent registrations are versioned; calls referencing a stale version are rejected.' },
  A12: { id: 'A12', name: 'Prompt Integrity Validation',           brief: 'Critical prompt regions are hashed and verified — injected instructions break the hash.' },
}

// ── The 12 threats ─────────────────────────────────────────────────────

export const THREATS: Threat[] = [
  {
    id: 'T1', name: 'Agent Identity Spoofing', category: 'Spoofing', severity: 'critical',
    attack: 'Attacker creates a malicious agent claiming to be a legitimate registered agent and requests tokens with that identity.',
    oauthOutcome: { status: 'succeeded', note: 'OAuth accepts any client_credentials request — identity is just a client_id string.' },
    intentOutcome: { status: 'blocked', note: 'Authority requires the agent to have been pre-registered with its checksum (A2); imposter fails registration check.' },
    detectedBy: ['A2'],
    parallel: 'Maps to OWASP LLM06 (Excessive Agency) and classic spoofing attacks (e.g., the 2019 Capital One IAM-role assumption breach pattern).',
  },
  {
    id: 'T2', name: 'Token Replay Attacks', category: 'Tampering', severity: 'high',
    attack: 'Attacker intercepts a valid bearer token in transit and replays it from a different host to make authenticated calls.',
    oauthOutcome: { status: 'succeeded', note: 'Bearer tokens are by definition replayable — possession is sufficient.' },
    intentOutcome: { status: 'blocked', note: 'Every call requires a fresh PoP signature with the agent\'s ephemeral private key (A6). Stolen tokens are cryptographic noise.' },
    detectedBy: ['A6'],
    parallel: 'Equivalent to the 2020 Twitter OAuth incident category — bearer tokens captured and reused.',
  },
  {
    id: 'T3', name: 'Shim Library Impersonation', category: 'Spoofing', severity: 'high',
    attack: 'A modified or fake client shim runs alongside the agent and intercepts authentication calls to mint tokens for an unregistered identity.',
    oauthOutcome: { status: 'succeeded', note: 'No verification of the client library identity — any HTTP caller works.' },
    intentOutcome: { status: 'blocked', note: 'X-Shim-Checksum (A5) and registration-first (A2) reject any unrecognized shim signature.' },
    detectedBy: ['A1', 'A2', 'A5'],
  },
  {
    id: 'T4', name: 'Runtime Code Modification', category: 'Tampering', severity: 'critical',
    attack: 'Attacker injects modified code into a running agent\'s process to alter its behaviour while keeping its credentials.',
    oauthOutcome: { status: 'succeeded', note: 'Compromised agent retains its bearer token and continues operating with altered logic undetected.' },
    intentOutcome: { status: 'blocked', note: 'Runtime fingerprint (A1) no longer matches the registered checksum; further token mints fail. Prompt integrity (A12) detects code-region tampering.' },
    detectedBy: ['A1', 'A12'],
  },
  {
    id: 'T5', name: 'Prompt Injection Attacks', category: 'Tampering', severity: 'critical',
    attack: 'Adversarial content in tool output causes the agent\'s LLM to deviate from its declared instructions and execute attacker actions.',
    oauthOutcome: { status: 'succeeded', note: 'No mechanism to detect prompt manipulation; injection succeeds silently.' },
    intentOutcome: { status: 'blocked', note: 'Prompt integrity validation (A12) hashes critical prompt regions; injected instructions break the hash before the agent acts.' },
    detectedBy: ['A12'],
    parallel: 'OWASP LLM01 — the canonical agentic threat.',
  },
  {
    id: 'T6', name: 'Workflow Definition Tampering', category: 'Tampering', severity: 'high',
    attack: 'Attacker modifies a registered workflow definition to introduce malicious steps or remove security checks.',
    oauthOutcome: { status: 'succeeded', note: 'OAuth has no concept of workflow definition — tampering is invisible.' },
    intentOutcome: { status: 'blocked', note: 'Workflow validation (A8) and registration versioning (A11) detect any post-registration mutation.' },
    detectedBy: ['A8', 'A11'],
  },
  {
    id: 'T7', name: 'Cross-Agent Privilege Escalation', category: 'Elevation of Privilege', severity: 'critical',
    attack: 'A low-privilege agent manipulates a high-privilege agent into executing operations on its behalf, escalating effective scope.',
    oauthOutcome: { status: 'succeeded', note: 'Agents share a flat permission space; one can invoke another with no contextual check.' },
    intentOutcome: { status: 'blocked', note: 'Intent token binding (A7) and workflow validation (A8) ensure the high-privilege agent only acts on declared steps; cross-agent escalation is rejected.' },
    detectedBy: ['A3', 'A7', 'A8'],
    parallel: 'Pattern of the 2020 Twitter OAuth incident (read-scope token used to mint write-scope posts).',
  },
  {
    id: 'T8', name: 'Workflow Step Bypass', category: 'Elevation of Privilege', severity: 'high',
    attack: 'Agent skips required workflow steps (e.g., approval gates, validation checks) to reach a sensitive operation directly.',
    oauthOutcome: { status: 'succeeded', note: 'No workflow awareness; any in-scope call is permitted.' },
    intentOutcome: { status: 'blocked', note: 'Workflow validation (A8) enforces step ordering; bypass attempts fail before execution. Execution logging (A10) records the violation.' },
    detectedBy: ['A8', 'A10'],
  },
  {
    id: 'T9', name: 'Scope Inflation', category: 'Elevation of Privilege', severity: 'high',
    attack: 'Agent requests broader scopes than its workflow step requires to gain extra capabilities for later misuse.',
    oauthOutcome: { status: 'succeeded', note: 'Scopes are coarse-grained; broad scopes are routinely granted.' },
    intentOutcome: { status: 'blocked', note: 'Intent token binding (A7) restricts the scope to the declared step; workflow validation (A8) rejects mismatches.' },
    detectedBy: ['A7', 'A8'],
  },
  {
    id: 'T10', name: 'Intent Origin Forgery', category: 'Repudiation', severity: 'high',
    attack: 'Attacker claims a malicious action originated from a different agent, evading attribution.',
    oauthOutcome: { status: 'succeeded', note: 'No cryptographic chain ties an action to the originating agent — denial is plausible.' },
    intentOutcome: { status: 'blocked', note: 'Cryptographic delegation chains (A9) bind each action to its originator; execution logging (A10) makes denial impossible.' },
    detectedBy: ['A9', 'A10'],
  },
  {
    id: 'T11', name: 'Delegation Chain Manipulation', category: 'Tampering', severity: 'critical',
    attack: 'Attacker injects, removes, or reorders entries in the delegation chain to claim authority not granted by the original principal.',
    oauthOutcome: { status: 'succeeded', note: 'No delegation chain exists; tokens carry no provenance.' },
    intentOutcome: { status: 'blocked', note: 'Delegation chains (A9) are cryptographically signed at each link; PoP (A6) prevents key theft.' },
    detectedBy: ['A6', 'A9'],
  },
  {
    id: 'T12', name: 'Agent Configuration Exposure', category: 'Information Disclosure', severity: 'medium',
    attack: 'Attacker queries an agent\'s configuration (prompts, tool list, scopes) to plan a targeted attack.',
    oauthOutcome: { status: 'succeeded', note: 'No registered configuration exists; attacker reverse-engineers from observed behaviour.' },
    intentOutcome: { status: 'blocked', note: 'Checksum verification (A1) and registration-first (A2) make tampered configurations detectable; the registered config is authoritative.' },
    detectedBy: ['A1', 'A2'],
  },
]

// ── Aggregate metrics — could be loaded from results.json in the future ──

export const THREAT_METRICS = {
  total: 12,
  oauthBlocked: 0,
  oauthSucceeded: 12,
  intentBlocked: 12,
  intentSucceeded: 0,
  performance: {
    tokenMintMs: { oauth: 2.1, intent: 4.2 },
    workflowEndToEndMs: { oauth: 696, intent: 1433 },
  },
  reportGenerated: '2025-11-16T15:11:09.632569Z',
} as const

// ── Helpers ──

export function severityColorClass(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'text-c-danger'
    case 'high':     return 'text-c-warning'
    case 'medium':   return 'text-c-accent'
    case 'low':      return 'text-c-text-3'
  }
}

export function severityBgClass(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-c-danger/10 border-c-danger/30'
    case 'high':     return 'bg-c-warning/10 border-c-warning/30'
    case 'medium':   return 'bg-c-accent/10 border-c-accent/30'
    case 'low':      return 'bg-c-surface-2 border-c-border'
  }
}
