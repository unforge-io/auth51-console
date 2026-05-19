'use client'

import { useState, useRef, useEffect } from 'react'
import { formatLastUpdated } from '@/lib/console/useAutoRefresh'
import { REFRESH_OPTIONS } from '@/lib/console/useRefreshInterval'
import { cn } from '@/lib/utils'

/**
 * LiveIndicator — small pill labelling a view as poll-based "live", with
 * a built-in interval selector (Off / 2s / 5s / 10s / 30s / 1m).
 *
 * Honest copy: "live · updated 3s ago" while polling, "paused" when the
 * user has turned auto-refresh off. The user can always hit ↻ manually.
 *
 * When SSE/push lands later, this component will gain a `mode="push"`
 * variant where the selector is hidden and the dot stays solid.
 */
export function LiveIndicator({
  lastUpdatedAt,
  tick: _tick,
  loading,
  onRefresh,
  intervalMs,
  onIntervalChange,
  className,
}: {
  lastUpdatedAt: number | null
  tick: number
  loading?: boolean
  onRefresh?: () => void
  intervalMs: number
  onIntervalChange: (ms: number) => void
  className?: string
}) {
  void _tick // ticker is here to force per-second re-renders of the time label

  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const paused = intervalMs <= 0
  const currentOption = REFRESH_OPTIONS.find((o) => o.ms === intervalMs) ?? REFRESH_OPTIONS[3]

  return (
    <div ref={containerRef} className={cn('relative flex items-center gap-2 text-[11px] text-c-text-3', className)}>
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded border bg-c-bg',
        paused ? 'border-c-border' : 'border-c-border',
      )}>
        {/* Status dot */}
        <span className="relative inline-flex h-1.5 w-1.5">
          {!paused && !loading && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-c-success animate-ping opacity-60" />
          )}
          <span className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            paused ? 'bg-c-text-3' : 'bg-c-success',
          )} />
        </span>
        <span className="text-c-text-2 font-medium">{paused ? 'paused' : 'live'}</span>
        <span className="text-c-text-3">·</span>
        <span className="font-mono text-c-text-3 min-w-[68px]">
          {loading ? 'refreshing…' : lastUpdatedAt === null ? 'syncing…' : `updated ${formatLastUpdated(lastUpdatedAt)}`}
        </span>
      </span>

      {/* Interval selector */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        title={paused ? 'Auto-refresh is off' : `Auto-refresh every ${currentOption.label}`}
        className="text-c-text-2 hover:text-c-text px-1.5 py-1 rounded border border-c-border hover:bg-c-surface transition-colors text-[10.5px] font-mono"
      >
        {currentOption.label} ▾
      </button>

      {/* Manual refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh now"
          className="text-c-text-2 hover:text-c-text px-1.5 py-1 rounded hover:bg-c-surface disabled:opacity-50 transition-colors"
        >
          ↻
        </button>
      )}

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 rounded-md border border-c-border bg-c-surface shadow-lg overflow-hidden min-w-[140px]">
          <div className="px-3 py-2 border-b border-c-border text-[10px] uppercase tracking-wider text-c-text-3 font-mono">
            Auto-refresh
          </div>
          {REFRESH_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              onClick={() => { onIntervalChange(opt.ms); setMenuOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-1.5 text-[12px] transition-colors',
                opt.ms === intervalMs
                  ? 'bg-c-surface-2 text-c-text font-medium'
                  : 'text-c-text-2 hover:bg-c-surface-2 hover:text-c-text',
              )}
            >
              <span>{opt.label}</span>
              {opt.ms === intervalMs && <span className="text-c-accent">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
