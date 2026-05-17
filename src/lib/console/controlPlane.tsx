'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

/**
 * Control Plane context — the kubeconfig-equivalent for Auth51.
 *
 * Persists a list of configured Control Planes + the currently-selected one
 * to localStorage. Components read the current Control Plane via
 * `useControlPlane()`.
 *
 * Shape mirrors kubeconfig conceptually:
 *   - contexts: array of named Control Planes
 *   - current: name of the active context
 *
 * For Phase 1 we only support "Connect existing" — an endpoint URL plus
 * (optional) API key. SaaS-managed and on-prem-wizard come later.
 */

export type ControlPlaneContext = {
  name: string
  endpoint: string
  /** OAuth client_credentials inputs */
  clientId?: string
  clientSecret?: string
  /** What audience to request when minting tokens (e.g. "idp.localhost") */
  audience?: string
  /** Default app to query for agents/workflows (e.g. "Patchet") */
  appId?: string
  /** Legacy field — still kept for transitional users who paste bare tokens */
  apiKey?: string
  /** When the user added it */
  addedAt: number
}

export type ControlPlaneState = {
  current: string | null
  contexts: ControlPlaneContext[]
}

const STORAGE_KEY = 'auth51.console.controlPlane'

const DEFAULT_STATE: ControlPlaneState = {
  current: null,
  contexts: [],
}

type ControlPlaneContextValue = {
  state: ControlPlaneState
  currentContext: ControlPlaneContext | null
  addContext: (ctx: ControlPlaneContext) => void
  removeContext: (name: string) => void
  switchContext: (name: string) => void
}

const Ctx = createContext<ControlPlaneContextValue | null>(null)

export function ControlPlaneProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ControlPlaneState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ControlPlaneState
        if (parsed && Array.isArray(parsed.contexts)) {
          setState(parsed)
        }
      }
    } catch (err) {
      console.warn('control plane state read failed', err)
    }
    setHydrated(true)
  }, [])

  const persist = useCallback((next: ControlPlaneState) => {
    setState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch (err) {
      console.warn('control plane state write failed', err)
    }
  }, [])

  const addContext = useCallback((ctx: ControlPlaneContext) => {
    const filtered = state.contexts.filter((c) => c.name !== ctx.name)
    const next: ControlPlaneState = {
      contexts: [...filtered, ctx],
      current: state.current ?? ctx.name,
    }
    persist(next)
  }, [state, persist])

  const removeContext = useCallback((name: string) => {
    const next: ControlPlaneState = {
      contexts: state.contexts.filter((c) => c.name !== name),
      current: state.current === name ? null : state.current,
    }
    persist(next)
  }, [state, persist])

  const switchContext = useCallback((name: string) => {
    if (!state.contexts.find((c) => c.name === name)) return
    persist({ ...state, current: name })
  }, [state, persist])

  const currentContext = state.current
    ? state.contexts.find((c) => c.name === state.current) ?? null
    : null

  // Wait for hydration to avoid SSR mismatch
  if (!hydrated) {
    return <Ctx.Provider value={{ state: DEFAULT_STATE, currentContext: null, addContext, removeContext, switchContext }}>{children}</Ctx.Provider>
  }

  return (
    <Ctx.Provider value={{ state, currentContext, addContext, removeContext, switchContext }}>
      {children}
    </Ctx.Provider>
  )
}

export function useControlPlane() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useControlPlane must be used inside ControlPlaneProvider')
  return v
}
