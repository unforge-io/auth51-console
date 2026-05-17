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
 * Get a valid access token for the given Control Plane context, minting
 * a fresh one if the cached token has expired or doesn't exist.
 */
export async function getAccessToken(
  ctx: ControlPlaneContext,
  scope = 'read:agents',
): Promise<string> {
  // If user pasted a static API key, use it directly (legacy / dev mode)
  if (ctx.apiKey && (!ctx.clientId || !ctx.clientSecret)) {
    return ctx.apiKey
  }
  if (!ctx.clientId || !ctx.clientSecret) {
    throw new AuthorityError('No credentials configured — set OAuth client_id and client_secret for this control plane.')
  }
  const audience = ctx.audience ?? 'idp.localhost'
  const key = cacheKey(ctx.endpoint, ctx.clientId, audience, scope)
  const cached = tokenCache.get(key)
  // Refresh if expired or within 60s of expiry
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.access_token
  }
  return mintToken(ctx.endpoint, ctx.clientId, ctx.clientSecret, audience, scope)
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
