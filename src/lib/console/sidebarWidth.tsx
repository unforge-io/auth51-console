'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

/**
 * Sidebar width state — persisted to localStorage.
 *
 * - Drag the resize handle on the right edge of the sidebar to change width
 * - Width is clamped to [MIN, MAX]
 * - Persists across reloads
 * - Collapsed state (icon-only) reserved for a future iteration; for now
 *   the user can drag the sidebar down to MIN_WIDTH and that's "narrow mode"
 */

export const MIN_WIDTH = 200
export const MAX_WIDTH = 400
export const DEFAULT_WIDTH = 256

const STORAGE_KEY = 'auth51.console.sidebarWidth'

type Ctx = {
  width: number
  setWidth: (w: number) => void
}

const SidebarWidthContext = createContext<Ctx | null>(null)

export function SidebarWidthProvider({ children }: { children: ReactNode }) {
  const [width, setWidthState] = useState<number>(DEFAULT_WIDTH)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const n = stored ? parseInt(stored, 10) : DEFAULT_WIDTH
      if (Number.isFinite(n)) setWidthState(clamp(n))
    } catch { /* ignore */ }
  }, [])

  const setWidth = useCallback((w: number) => {
    const clamped = clamp(w)
    setWidthState(clamped)
    try { localStorage.setItem(STORAGE_KEY, String(clamped)) } catch { /* ignore */ }
  }, [])

  return (
    <SidebarWidthContext.Provider value={{ width, setWidth }}>
      {children}
    </SidebarWidthContext.Provider>
  )
}

export function useSidebarWidth() {
  const ctx = useContext(SidebarWidthContext)
  if (!ctx) throw new Error('useSidebarWidth must be used inside SidebarWidthProvider')
  return ctx
}

function clamp(n: number) {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, n))
}
