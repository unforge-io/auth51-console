'use client'

import { useState, useRef, useEffect } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { cn } from '@/lib/utils'

/**
 * Control Plane switcher — kubectl-context style.
 * Shows current context, drops down to switch / add new.
 */
export function ControlPlaneSwitcher() {
  const { state, currentContext, switchContext } = useControlPlane()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-c-text-2 hover:bg-c-surface transition-colors',
          'border border-c-border bg-c-bg',
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', currentContext ? 'bg-c-success' : 'bg-c-text-3')} />
        <span className="truncate flex-1 text-left">
          {currentContext ? currentContext.name : 'No control plane'}
        </span>
        <span className="text-c-text-3 text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-c-border bg-c-surface shadow-lg overflow-hidden">
          {state.contexts.length === 0 ? (
            <div className="px-3 py-3 text-[12px] text-c-text-2">
              No Control Plane configured yet.
              <br />
              <span className="text-c-text-3 text-[11px]">Add one from the Overview page.</span>
            </div>
          ) : (
            <ul className="py-1">
              {state.contexts.map((ctx) => (
                <li key={ctx.name}>
                  <button
                    onClick={() => { switchContext(ctx.name); setOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-c-text hover:bg-c-surface-2 transition-colors text-left"
                  >
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      currentContext?.name === ctx.name ? 'bg-c-success' : 'bg-c-text-3',
                    )} />
                    <span className="flex-1 truncate">{ctx.name}</span>
                    <span className="text-[10px] text-c-text-3 truncate max-w-[120px]">{shortHost(ctx.endpoint)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function shortHost(endpoint: string): string {
  try {
    return new URL(endpoint).host
  } catch {
    return endpoint
  }
}
