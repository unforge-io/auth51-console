'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * useAutoRefresh — drives polling-based "live" data views.
 *
 * Calls `fetcher` on mount, then every `intervalMs` afterwards. Pauses
 * when the browser tab is hidden (Page Visibility API) and re-fires on
 * tab-focus so users always see fresh data when they return.
 *
 * Returns:
 *   - lastUpdatedAt: epoch ms of the most recent successful fetch
 *   - tickedAt:      bumps on every successful fetch (use to trigger
 *                    re-render of "n seconds ago" labels)
 *   - refresh:       imperative refresh button handler
 *
 * Honest about what it is: polling, not push. The companion
 * <LiveIndicator/> badge labels it accordingly.
 */
export function useAutoRefresh({
  intervalMs = 5000,
  fetcher,
  enabled = true,
}: {
  intervalMs?: number
  fetcher: () => Promise<void> | void
  enabled?: boolean
}) {
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const [tickedAt, setTickedAt] = useState(0)
  const inFlight = useRef(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      await fetcherRef.current()
      setLastUpdatedAt(Date.now())
    } finally {
      inFlight.current = false
    }
  }, [])

  // Fire once on mount immediately — users shouldn't see an empty state
  // for the first `intervalMs` before any data arrives.
  useEffect(() => {
    if (enabled) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Periodic refresh, paused while tab hidden (or when interval is 0).
  // `intervalMs <= 0` disables polling — the user can still hit Refresh manually.
  useEffect(() => {
    if (!enabled || intervalMs <= 0) return
    let timer: ReturnType<typeof setInterval> | null = null
    const onVisibility = () => {
      if (document.hidden) {
        if (timer) { clearInterval(timer); timer = null }
      } else if (!timer) {
        run()
        timer = setInterval(run, intervalMs)
      }
    }
    if (!document.hidden) {
      timer = setInterval(run, intervalMs)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs, run])

  // Independent ticker so "2s ago" labels update without a fetch
  useEffect(() => {
    const t = setInterval(() => setTickedAt((x) => (x + 1) & 0xffff), 1000)
    return () => clearInterval(t)
  }, [])

  return {
    lastUpdatedAt,
    tickedAt,
    refresh: run,
  }
}

/** Human-relative time label, recomputes on `tickedAt` re-renders */
export function formatLastUpdated(lastUpdatedAt: number | null): string {
  if (lastUpdatedAt === null) return 'syncing…'
  const diff = Date.now() - lastUpdatedAt
  if (diff < 2000) return 'just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}
