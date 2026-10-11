'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from '@clerk/nextjs'
import { MANAGED_AUDIENCE } from './managed'
import { clearTokenCache } from './api'

/**
 * Control Plane context — the kubeconfig-equivalent for Auth51.
 *
 * Control planes are shared by everyone in the active org (workspace): the list
 * lives on the managed Authority (`/api/cp/control-planes`, tenant-scoped), so a
 * member who connects a control plane makes it appear for the whole team. A
 * personal account (no org) gets its own private list the same way.
 *
 * What stays per-browser, in localStorage keyed by workspace:
 *   - which context is selected and which App each one is viewing
 *   - legacy dev credentials (client secret / pasted bearer) — never shared
 *   - a cache of the shared list, so the console renders instantly and still
 *     works if the Authority is briefly unreachable
 *
 * Sync rule: a context with `shared: true` mirrors a server row (dropped if a
 * teammate deleted it); one without it was added locally and not yet saved, so
 * it is pushed on the next sync. That also migrates pre-org localStorage state.
 */

export type ControlPlaneContext = {
  name: string
  endpoint: string
  /** What audience to request when exchanging tokens (e.g. "idp.localhost") */
  audience?: string
  /** Default app to query for agents/workflows (e.g. "Patchet") */
  appId?: string
  /** ─── Legacy / dev-only fallbacks (local to this browser, never shared) ─── */
  clientId?: string
  clientSecret?: string
  apiKey?: string
  /** When the user added it */
  addedAt: number
  /** Saved to the org's shared list on the Authority. */
  shared?: boolean
  /** Org member who connected it (from the shared list). */
  createdBy?: string
}

export type ControlPlaneState = {
  current: string | null
  contexts: ControlPlaneContext[]
}

/** Shape served by the Authority's /v1/control-planes. */
type SharedControlPlane = {
  name: string
  endpoint: string
  audience?: string | null
  app_id?: string | null
  created_by?: string | null
  created_at: number
}

const STORAGE_KEY = 'auth51.console.controlPlane'
const storageKey = (workspace: string) => `${STORAGE_KEY}:${workspace}`

const DEFAULT_STATE: ControlPlaneState = {
  current: null,
  contexts: [],
}

type ControlPlaneContextValue = {
  state: ControlPlaneState
  currentContext: ControlPlaneContext | null
  /** The active Clerk org id, or `user_<id>` for a personal workspace. */
  workspace: string | null
  addContext: (ctx: ControlPlaneContext) => void
  removeContext: (name: string) => void
  switchContext: (name: string) => void
  /** Set the active App on the current context (drives ctx.appId — which app's
   *  agents/discovered the console reads, and what generated agents register under).
   *  A per-member view choice: it does not change the org's shared default. */
  setActiveApp: (appId: string) => void
}

const Ctx = createContext<ControlPlaneContextValue | null>(null)

function readLocal(workspace: string): ControlPlaneState | null {
  try {
    let raw = localStorage.getItem(storageKey(workspace))
    if (!raw) {
      // One-time migration of the pre-workspace, unscoped key: adopt it into the
      // first workspace that loads. Its contexts carry no `shared` flag, so the
      // next sync pushes them to that org's shared list.
      raw = localStorage.getItem(STORAGE_KEY)
      if (raw) localStorage.removeItem(STORAGE_KEY)
    }
    if (!raw) return null
    const parsed = JSON.parse(raw) as ControlPlaneState
    if (!parsed || !Array.isArray(parsed.contexts)) return null
    // Migrate the retired "idp.localhost" placeholder audience left by earlier
    // builds / the old ConnectDialog default: the authority's trusted issuer
    // expects the managed audience, so it would fail the RFC 8693 exchange.
    for (const c of parsed.contexts) {
      if (c.audience === 'idp.localhost') c.audience = MANAGED_AUDIENCE
    }
    return parsed
  } catch (err) {
    console.warn('control plane state read failed', err)
    return null
  }
}

function writeLocal(workspace: string, state: ControlPlaneState) {
  try {
    localStorage.setItem(storageKey(workspace), JSON.stringify(state))
  } catch (err) {
    console.warn('control plane state write failed', err)
  }
}

async function putShared(ctx: ControlPlaneContext): Promise<boolean> {
  try {
    const res = await fetch('/api/cp/control-planes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ctx.name,
        endpoint: ctx.endpoint,
        audience: ctx.audience ?? null,
        app_id: ctx.appId ?? null,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Merge the server's list with this browser's local state (see sync rule). */
function merge(local: ControlPlaneState, server: SharedControlPlane[]): ControlPlaneState {
  const localByName = new Map(local.contexts.map((c) => [c.name, c]))
  const serverNames = new Set(server.map((s) => s.name))
  const contexts: ControlPlaneContext[] = server.map((s) => {
    const mine = localByName.get(s.name)
    return {
      name: s.name,
      endpoint: s.endpoint,
      audience: s.audience ?? undefined,
      // Keep this member's own App selection; otherwise the org default.
      appId: mine?.appId ?? s.app_id ?? undefined,
      clientId: mine?.clientId,
      clientSecret: mine?.clientSecret,
      apiKey: mine?.apiKey,
      addedAt: s.created_at,
      shared: true,
      createdBy: s.created_by ?? undefined,
    }
  })
  // Local-only contexts that have not reached the server yet.
  for (const c of local.contexts) {
    if (!c.shared && !serverNames.has(c.name)) contexts.push(c)
  }
  const names = new Set(contexts.map((c) => c.name))
  const current = local.current && names.has(local.current)
    ? local.current
    : contexts[0]?.name ?? null
  return { current, contexts }
}

export function ControlPlaneProvider({ children }: { children: ReactNode }) {
  const { isLoaded, userId, orgId } = useAuth()
  const workspace = isLoaded && userId ? (orgId ?? `user_${userId}`) : null

  const [state, setState] = useState<ControlPlaneState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  // Latest state for async sync callbacks (avoids stale closures).
  const stateRef = useRef(state)
  stateRef.current = state
  const workspaceRef = useRef(workspace)
  workspaceRef.current = workspace

  const persist = useCallback((next: ControlPlaneState) => {
    setState(next)
    stateRef.current = next
    if (workspaceRef.current) writeLocal(workspaceRef.current, next)
  }, [])

  const sync = useCallback(async () => {
    const ws = workspaceRef.current
    if (!ws) return
    // Push contexts added locally (or migrated) that the server doesn't have yet.
    // The proxy resolves the org from the live Clerk session, so stop if the
    // member switched org meanwhile — never push one org's context into another.
    const pending = stateRef.current.contexts.filter((c) => !c.shared)
    for (const c of pending) {
      if (workspaceRef.current !== ws) return
      await putShared(c)
    }

    let server: SharedControlPlane[]
    try {
      const res = await fetch('/api/cp/control-planes', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      server = await res.json() as SharedControlPlane[]
      if (!Array.isArray(server)) throw new Error('unexpected response')
    } catch (err) {
      // Keep the local cache; the next sync (focus / next action) retries.
      console.warn('shared control planes unavailable; using local cache', err)
      return
    }
    if (workspaceRef.current !== ws) return // switched org mid-flight
    const next = merge(stateRef.current, server)
    if (JSON.stringify(next) !== JSON.stringify(stateRef.current)) persist(next)
  }, [persist])

  // (Re)load whenever the workspace changes — sign-in, or switching orgs.
  useEffect(() => {
    if (!workspace) return
    // Tokens minted for the previous org must never be reused for this one.
    clearTokenCache()
    const local = readLocal(workspace) ?? DEFAULT_STATE
    setState(local)
    stateRef.current = local
    setHydrated(true)
    void sync()
  }, [workspace, sync])

  // Pick up teammates' changes when the tab regains focus.
  useEffect(() => {
    const onFocus = () => { void sync() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [sync])

  const addContext = useCallback((ctx: ControlPlaneContext) => {
    const cur = stateRef.current
    persist({
      contexts: [...cur.contexts.filter((c) => c.name !== ctx.name), { ...ctx, shared: false }],
      current: cur.current ?? ctx.name,
    })
    // sync() pushes it (it's not yet `shared`) and folds in the server's view.
    void sync()
  }, [persist, sync])

  const removeContext = useCallback((name: string) => {
    const cur = stateRef.current
    const target = cur.contexts.find((c) => c.name === name)
    persist({
      contexts: cur.contexts.filter((c) => c.name !== name),
      current: cur.current === name ? null : cur.current,
    })
    if (target?.shared) {
      void fetch(`/api/cp/control-planes/${encodeURIComponent(name)}`, { method: 'DELETE' })
        .catch((err) => console.warn('shared control plane delete failed', err))
    }
  }, [persist])

  const switchContext = useCallback((name: string) => {
    const cur = stateRef.current
    if (!cur.contexts.find((c) => c.name === name)) return
    persist({ ...cur, current: name })
  }, [persist])

  const setActiveApp = useCallback((appId: string) => {
    const cur = stateRef.current
    if (!cur.current) return
    persist({
      ...cur,
      contexts: cur.contexts.map((c) =>
        c.name === cur.current ? { ...c, appId } : c,
      ),
    })
  }, [persist])

  const currentContext = state.current
    ? state.contexts.find((c) => c.name === state.current) ?? null
    : null

  // Wait for hydration to avoid SSR mismatch
  if (!hydrated) {
    return <Ctx.Provider value={{ state: DEFAULT_STATE, currentContext: null, workspace, addContext, removeContext, switchContext, setActiveApp }}>{children}</Ctx.Provider>
  }

  return (
    <Ctx.Provider value={{ state, currentContext, workspace, addContext, removeContext, switchContext, setActiveApp }}>
      {children}
    </Ctx.Provider>
  )
}

export function useControlPlane() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useControlPlane must be used inside ControlPlaneProvider')
  return v
}
