'use client'

import { formatLastUpdated } from '@/lib/console/useAutoRefresh'
import { cn } from '@/lib/utils'

/**
 * LiveIndicator — small pill that labels a view as poll-based "live".
 *
 * Honest copy: "live · updated 3s ago". Pulsing dot conveys
 * activity without overpromising real-time push semantics.
 *
 * When SSE/push lands later, this same component will accept a
 * `mode="push"` prop and the dot stays solid (no polling jitter).
 */
export function LiveIndicator({
  lastUpdatedAt,
  /** Allows callers to force a re-render when their own ticker fires */
  tick: _tick,
  loading,
  onRefresh,
  className,
}: {
  lastUpdatedAt: number | null
  tick: number
  loading?: boolean
  onRefresh?: () => void
  className?: string
}) {
  void _tick // referenced by parent to keep us re-rendering each second

  return (
    <div className={cn('flex items-center gap-2 text-[11px] text-c-text-3', className)}>
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-c-border bg-c-bg">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className={cn(
            'absolute inline-flex h-full w-full rounded-full bg-c-success',
            !loading && 'animate-ping opacity-60',
          )} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-c-success" />
        </span>
        <span className="text-c-text-2 font-medium">live</span>
        <span className="text-c-text-3">·</span>
        <span className="font-mono text-c-text-3">
          {loading ? 'refreshing…' : `updated ${formatLastUpdated(lastUpdatedAt)}`}
        </span>
      </span>
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
    </div>
  )
}
