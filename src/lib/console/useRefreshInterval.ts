'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * useRefreshInterval — global, per-Console user preference for how often
 * live views poll. Persisted to localStorage so the choice follows the user
 * across the app. 0 means "paused — refresh only on manual click".
 *
 * Default: 10s. Available options: 0 (paused), 2, 5, 10, 30, 60 (seconds).
 */

const STORAGE_KEY = 'auth51.console.refreshIntervalMs'
const DEFAULT_INTERVAL_MS = 10_000

export const REFRESH_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: 'Off',  ms: 0 },
  { label: '2s',   ms: 2_000 },
  { label: '5s',   ms: 5_000 },
  { label: '10s',  ms: 10_000 },
  { label: '30s',  ms: 30_000 },
  { label: '1m',   ms: 60_000 },
]

export function useRefreshInterval(): {
  intervalMs: number
  setIntervalMs: (ms: number) => void
} {
  const [intervalMs, setIntervalMsState] = useState<number>(DEFAULT_INTERVAL_MS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        const n = parseInt(stored, 10)
        if (Number.isFinite(n) && n >= 0) setIntervalMsState(n)
      }
    } catch { /* ignore */ }
    // Listen for changes from other tabs / other component instances
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        const n = parseInt(e.newValue, 10)
        if (Number.isFinite(n) && n >= 0) setIntervalMsState(n)
      }
    }
    window.addEventListener('storage', onStorage)
    // Custom event for same-tab broadcasting
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<number>
      if (typeof ce.detail === 'number') setIntervalMsState(ce.detail)
    }
    window.addEventListener('auth51.refreshInterval' as keyof WindowEventMap, onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth51.refreshInterval' as keyof WindowEventMap, onLocal as EventListener)
    }
  }, [])

  const setIntervalMs = useCallback((ms: number) => {
    setIntervalMsState(ms)
    try { localStorage.setItem(STORAGE_KEY, String(ms)) } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('auth51.refreshInterval', { detail: ms }))
  }, [])

  return { intervalMs, setIntervalMs }
}
