/**
 * Auth51 Authority API client.
 *
 * Talks directly from the browser to the customer's Control Plane
 * endpoint (cross-origin, CORS-enabled). Handles OAuth client_credentials
 * grant + JWT bearer auth on subsequent calls. Caches access tokens
 * in memory per (endpoint, client_id, audience, scope) tuple and
 * auto-refreshes 60s before expiry.
 */

import type { ControlPlaneContext } from './controlPlane'

// ── Domain types — match the shape returned by `/intent/agents/{app_id}` ──

export type Tool = {
  name: string
  signature: string
  description: string
  source_code: string | null
  is_agent: boolean
}

export type Registration = {
  app_id: string
  agent_id: string
  registration_id: string
  checksum: string
  prompt: string
  tools: Tool[]
  public_key: string | null
  registered_at: number // epoch ms
  version: string | null
}

// ── Token cache ──

type CachedToken = {
  access_token: string
  /** epoch ms when token expires */
  expiresAt: number
}

const tokenCache = new Map<string, CachedToken>()

function cacheKey(endpoint: string, clientId: string, audience: string, scope: string): string {
  return `${endpoint}|${clientId}|${audience}|${scope}`
}

// ── Token minting ──

export class AuthorityError extends Error {
  constructor(message: string, public status?: number, public detail?: unknown) {
    super(message)
    this.name = 'AuthorityError'
  }
}

/**
 * Mint an access token via OAuth client_credentials.
 * Refreshes the in-memory cache. Returns the access token string.
 */
export async function mintToken(
  endpoint: string,
  clientId: string,
  clientSecret: string,
  audience: string,
  scope: string,
): Promise<string> {
  const url = `${endpoint.replace(/\/$/, '')}/oauth/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    audience,
    scope,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Token mint failed (HTTP ${res.status})`, res.status, detail)
  }

  const data = await res.json() as { access_token: string; expires_in?: number; token_type?: string }
  const expiresIn = data.expires_in ?? 1800
  tokenCache.set(cacheKey(endpoint, clientId, audience, scope), {
    access_token: data.access_token,
    expiresAt: Date.now() + (expiresIn * 1000),
  })
  return data.access_token
}

/**
 * Exchange a Console session for a fresh Authority access token via
 * the server-side /api/cp/exchange route. Returns the access_token.
 * Cached in memory via the standard token cache.
 */
async function exchangeViaConsole(
  endpoint: string,
  audience: string,
  scope: string,
): Promise<string> {
  const res = await fetch('/api/cp/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, audience, scope }),
  })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Token exchange failed (HTTP ${res.status})`, res.status, detail)
  }
  const data = await res.json() as { access_token: string; expires_in?: number }
  const expiresIn = data.expires_in ?? 1800
  tokenCache.set(cacheKey(endpoint, '__exchange__', audience, scope), {
    access_token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  })
  return data.access_token
}

/**
 * Get a valid access token for the given Control Plane context.
 *
 * Resolution order:
 *   1. Cached token (from previous exchange) if still valid → return it
 *   2. Token exchange via Console server (production path) → uses Clerk session
 *   3. Static API key (legacy / dev fallback)
 *   4. OAuth client_credentials (dev/demo only — secrets in browser)
 */
export async function getAccessToken(
  ctx: ControlPlaneContext,
  scope = 'read:agents',
): Promise<string> {
  const audience = ctx.audience ?? 'idp.localhost'

  // 1 — Check in-memory cache (keyed by either client_id OR __exchange__)
  for (const candidateKey of [
    cacheKey(ctx.endpoint, '__exchange__', audience, scope),
    ctx.clientId ? cacheKey(ctx.endpoint, ctx.clientId, audience, scope) : null,
  ].filter(Boolean) as string[]) {
    const cached = tokenCache.get(candidateKey)
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.access_token
  }

  // 2 — Production path: token exchange via Console (Clerk session required)
  try {
    return await exchangeViaConsole(ctx.endpoint, audience, scope)
  } catch (err) {
    // Fall through to legacy paths if exchange fails — the user is likely
    // in a dev/demo configuration where Clerk isn't set up or the Authority
    // doesn't yet support token exchange.
    if (!(ctx.apiKey || (ctx.clientId && ctx.clientSecret))) throw err
  }

  // 3 — Legacy: pasted bearer token
  if (ctx.apiKey) return ctx.apiKey

  // 4 — Legacy: client_credentials (browser-side secrets, dev only)
  if (ctx.clientId && ctx.clientSecret) {
    return mintToken(ctx.endpoint, ctx.clientId, ctx.clientSecret, audience, scope)
  }

  throw new AuthorityError('Unable to obtain access token. Sign in to the Console or configure credentials for this control plane.')
}

// ── Health check ──

export async function checkHealth(endpoint: string): Promise<boolean> {
  try {
    const url = `${endpoint.replace(/\/$/, '')}/health`
    const res = await fetch(url, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

// ── Agents ──

export async function listAgents(
  ctx: ControlPlaneContext,
  appId?: string,
): Promise<Registration[]> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/intent/agents/${encodeURIComponent(app)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Agents fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  const data = await res.json()
  // Authority shape: { "<app_id>": [Registration, ...] } — flatten to a list
  if (Array.isArray(data)) return data as Registration[]
  if (data && typeof data === 'object') {
    const values = Object.values(data) as Registration[][]
    return values.flat()
  }
  return []
}

// ── Workflows ──

export type WorkflowStepWire = {
  agent: string
  action: string
  scopes?: string[]
  dependencies?: string[]
  required?: boolean
  approval_gate?: boolean
  requires_approval?: boolean
}

export type WorkflowDefinitionWire = {
  workflow_id: string
  workflow_type?: 'dag' | string
  steps: Record<string, WorkflowStepWire>
}

/**
 * List registered workflows for an app.
 *
 * Expected IDP endpoint shape: `GET /intent/workflows/{app_id}` returning
 *   `{ "<app_id>": [WorkflowDefinition, ...] }`
 * (same envelope pattern as /intent/agents/{app_id}).
 *
 * If the endpoint returns 404 the Authority hasn't shipped this yet —
 * the caller surfaces a friendly "coming online" placeholder rather than
 * a hard error.
 */
export async function listRegisteredWorkflows(
  ctx: ControlPlaneContext,
  appId?: string,
): Promise<WorkflowDefinitionWire[]> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/intent/workflows/${encodeURIComponent(app)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (res.status === 404) {
    throw new AuthorityError('endpoint_not_supported', 404)
  }
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Workflows fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  const data = await res.json()
  if (Array.isArray(data)) return data as WorkflowDefinitionWire[]
  if (data && typeof data === 'object') {
    const values = Object.values(data) as WorkflowDefinitionWire[][]
    return values.flat()
  }
  return []
}

export async function getAgent(
  ctx: ControlPlaneContext,
  agentId: string,
  appId?: string,
): Promise<Registration | null> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/intent/agents/${encodeURIComponent(app)}/${encodeURIComponent(agentId)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Agent fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  const data = await res.json()
  return data as Registration | null
}

// ── Self-serve API keys (oauth-clients) ──

export type ApiKey = {
  client_id: string
  display_name: string
  allowed_scopes: string[]
  allowed_audiences: string[]
  is_active: boolean
  created_at: number
}

export type ApiKeyCreated = ApiKey & {
  /** Returned exactly once, at creation — never retrievable again. */
  client_secret: string
}

/**
 * Create a self-serve API key (OAuth client) in the signed-in customer's org.
 * Needs `manage:clients` (the console federation carries it). The returned
 * `client_secret` is shown once — surface it to the user immediately.
 */
export async function createApiKey(
  ctx: ControlPlaneContext,
  opts: { displayName: string; audiences?: string[]; scopes?: string[] },
): Promise<ApiKeyCreated> {
  const token = await getAccessToken(ctx, 'manage:clients')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/oauth-clients`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      display_name: opts.displayName,
      audiences: opts.audiences ?? [],
      ...(opts.scopes ? { scopes: opts.scopes } : {}),
    }),
  })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`API key creation failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as ApiKeyCreated
}

export async function listApiKeys(ctx: ControlPlaneContext): Promise<ApiKey[]> {
  const token = await getAccessToken(ctx, 'manage:clients')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/oauth-clients`
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`API keys fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as ApiKey[]
}

export async function revokeApiKey(ctx: ControlPlaneContext, clientId: string): Promise<void> {
  const token = await getAccessToken(ctx, 'manage:clients')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/oauth-clients/${encodeURIComponent(clientId)}`
  const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`API key revoke failed (HTTP ${res.status})`, res.status, detail)
  }
}

// ── Audit (decisions) ──

export type DecisionEvent = {
  id: number
  kind: string           // mint | verify | deny | token_exchange | oauth_token | escalate
  outcome: string        // allow | deny
  anchor: string | null
  reason: string | null
  agent_id: number | null
  claims: Record<string, unknown> | null
  created_at: number     // epoch ms
}

export async function listDecisions(
  ctx: ControlPlaneContext,
  opts: { appId?: string; limit?: number; before?: number } = {},
): Promise<DecisionEvent[]> {
  const app = opts.appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.before) params.set('before', String(opts.before))
  const qs = params.toString() ? `?${params.toString()}` : ''
  const url = `${ctx.endpoint.replace(/\/$/, '')}/decisions/${encodeURIComponent(app)}${qs}`
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  if (res.status === 404) return []  // no such app yet in this org → empty feed
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Audit fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as DecisionEvent[]
}

// ── Grants ──

export type GrantView = {
  app_id: string
  agent_id: string
  version: number
  allowed_scopes: string[]
  step_up_scopes: string[]
  mode: string           // observe | enforce
  source: string         // seed | calibration | jit | manual
  expires_at?: number | null
}

export async function listGrants(
  ctx: ControlPlaneContext,
  appId?: string,
): Promise<GrantView[]> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/grants/${encodeURIComponent(app)}`
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  if (res.status === 404) return []
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Grants fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as GrantView[]
}

// ── Workload identities (keyless bindings) ──

export type WorkloadBinding = {
  id: number
  provider: 'aws' | 'oidc'
  display_name: string
  aws_account_id?: string | null
  aws_role_name?: string | null
  aws_role_id?: string | null
  oidc_issuer?: string | null
  oidc_subject?: string | null
  allowed_scopes: string[]
  allowed_audiences: string[]
  is_active: boolean
  created_at: number
}

export async function listWorkloadBindings(ctx: ControlPlaneContext): Promise<WorkloadBinding[]> {
  const token = await getAccessToken(ctx, 'manage:clients')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/workload-identity`
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Workload bindings fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as WorkloadBinding[]
}

export async function createWorkloadBinding(
  ctx: ControlPlaneContext,
  opts: {
    provider: 'aws' | 'oidc'
    displayName: string
    awsAccountId?: string
    awsRoleName?: string
    awsRoleId?: string
    oidcIssuer?: string
    oidcSubject?: string
    audiences?: string[]
  },
): Promise<WorkloadBinding> {
  const token = await getAccessToken(ctx, 'manage:clients')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/workload-identity`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: opts.provider,
      display_name: opts.displayName,
      aws_account_id: opts.awsAccountId,
      aws_role_name: opts.awsRoleName,
      aws_role_id: opts.awsRoleId,
      oidc_issuer: opts.oidcIssuer,
      oidc_subject: opts.oidcSubject,
      audiences: opts.audiences ?? [],
    }),
  })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Workload binding create failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as WorkloadBinding
}

export async function deleteWorkloadBinding(ctx: ControlPlaneContext, id: number): Promise<void> {
  const token = await getAccessToken(ctx, 'manage:clients')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/workload-identity/${id}`
  const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Workload binding delete failed (HTTP ${res.status})`, res.status, detail)
  }
}

// ── Discovered agents (import → run → approve) ──
// The Authority holds only a REFERENCE trigger (agent_id + checksum) captured at
// the denied mint; the CONTENT (prompt/tools) lives in the separate
// auth51-discovery service (DESIGN §5b). The console joins the two by checksum,
// and Approve fires the normal /intent/register/agent — content's one sanctioned
// path into the Authority (which then auto-resolves the trigger).

const DISCOVERY_URL =
  process.env.NEXT_PUBLIC_AUTH51_DISCOVERY_URL ?? 'https://discovery.auth51.com'

export type DiscoveredTrigger = {
  agent_id: string
  app_id: string | null
  checksum: string
  source: string
  seen_count: number
  status: string
  first_seen_at: number
  last_seen_at: number | null
}

export type Proposal = {
  agent_id: string
  app_id: string | null
  checksum: string
  prompt: string
  tools: Record<string, unknown>[]
  configuration: Record<string, unknown>
  status: string
  first_seen_at: number
  last_seen_at: number
}

export async function listDiscovered(
  ctx: ControlPlaneContext,
  appId?: string,
): Promise<DiscoveredTrigger[]> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/intent/discovered/${encodeURIComponent(app)}`
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
  if (res.status === 404) return []
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Discovered fetch failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as DiscoveredTrigger[]
}

export async function dismissDiscovered(
  ctx: ControlPlaneContext,
  agentId: string,
  appId?: string,
): Promise<void> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'register:intent')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/intent/discovered/${encodeURIComponent(app)}/${encodeURIComponent(agentId)}`
  const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Dismiss failed (HTTP ${res.status})`, res.status, detail)
  }
}

/** List the org's pending proposals straight from auth51-discovery. This is the
 * PRIMARY source of "discovered agents": the embed pushes a proposal at the LLM
 * egress the moment it sees an unregistered agent — no governed call, no
 * `audiences`, no mint required. (The Authority's reference trigger, from a
 * denied mint, is a secondary signal we can layer on later.) The exchanged
 * Authority token authenticates — discovery trusts the Authority's JWKS. */
export async function listProposals(
  ctx: ControlPlaneContext,
  appId?: string,
): Promise<Proposal[]> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${DISCOVERY_URL.replace(/\/$/, '')}/v1/proposals/${encodeURIComponent(app)}`
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    if (!res.ok) return []
    return await res.json() as Proposal[]
  } catch {
    return [] // discovery unreachable ⇒ empty list, page still renders
  }
}

/** Fetch the proposal content for one trigger from auth51-discovery (joined by
 * checksum). The same exchanged Authority token authenticates — discovery is a
 * resource server trusting the Authority's JWKS. Null = no content proposed yet
 * (bare mint sighting; the client hasn't pushed components). */
export async function getProposal(
  ctx: ControlPlaneContext,
  checksum: string,
  appId?: string,
): Promise<Proposal | null> {
  const app = appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'read:agents')
  const url = `${DISCOVERY_URL.replace(/\/$/, '')}/v1/proposals/${encodeURIComponent(app)}/by-checksum/${encodeURIComponent(checksum)}`
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    if (!res.ok) return null
    return await res.json() as Proposal
  } catch {
    return null // discovery unreachable ⇒ triggers still render, just without content
  }
}

/** Approve: register the proposed agent via the Authority's normal registration
 * path. The Authority recomputes checksums and auto-resolves the trigger. */
export async function registerAgent(
  ctx: ControlPlaneContext,
  proposal: Proposal,
  appId?: string,
): Promise<{ agent_id: string; checksum: string }> {
  const app = proposal.app_id ?? appId ?? ctx.appId ?? 'Patchet'
  const token = await getAccessToken(ctx, 'register:intent')
  const url = `${ctx.endpoint.replace(/\/$/, '')}/intent/register/agent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: app,
      agent_components: {
        agent_id: proposal.agent_id,
        prompt_template: proposal.prompt,
        tools: proposal.tools,
        configuration: proposal.configuration,
      },
    }),
  })
  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new AuthorityError(`Registration failed (HTTP ${res.status})`, res.status, detail)
  }
  return await res.json() as { agent_id: string; checksum: string }
}

// ── Utilities ──

/** Group registrations by their `agent_id` prefix (e.g. "T1*" -> threat 1) */
export function groupByThreat(agents: Registration[]): { main: Registration[]; byThreat: Record<string, Registration[]> } {
  const main: Registration[] = []
  const byThreat: Record<string, Registration[]> = {}
  for (const a of agents) {
    const m = a.agent_id.match(/^T(\d+)/)
    if (m) {
      const key = `T${m[1]}`
      byThreat[key] = byThreat[key] ?? []
      byThreat[key].push(a)
    } else {
      main.push(a)
    }
  }
  return { main, byThreat }
}

export function shortChecksum(s: string, len = 8): string {
  return s ? s.slice(0, len) : ''
}

export function formatRegisteredAt(ms: number): string {
  if (!ms) return '—'
  const d = new Date(ms)
  const now = Date.now()
  const diff = now - ms
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
