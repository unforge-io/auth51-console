'use client'

import { useState, useRef, useEffect } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { ConnectDialog } from './ConnectDialog'
import { cn } from '@/lib/utils'

/**
 * Control Plane switcher — kubectl-context style.
 * Shows current context. Drops down to:
 *   - switch between configured contexts
 *   - add another Control Plane (opens ConnectDialog)
 *   - disconnect (remove) the current Control Plane
 *
 * Disconnect just removes the entry from localStorage; the next render
 * either selects another configured context or, if none remain, returns
 * the Console to the first-run EmptyState.
 */
export function ControlPlaneSwitcher() {
  const { state, currentContext, switchContext, removeContext } = useControlPlane()
  const [open, setOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [confirmRemoveName, setConfirmRemoveName] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const doRemove = (name: string) => {
    removeContext(name)
    setConfirmRemoveName(null)
    setOpen(false)
  }

  return (
    <>
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
            {/* Configured contexts */}
            {state.contexts.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-c-text-2">
                No Control Plane configured yet.
              </div>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-c-border text-[10px] uppercase tracking-wider text-c-text-3 font-mono">
                  Switch context
                </div>
                <ul className="py-1">
                  {state.contexts.map((ctx) => (
                    <li key={ctx.name} className="group/row flex items-center pr-1">
                      <button
                        onClick={() => { switchContext(ctx.name); setOpen(false) }}
                        className="flex-1 flex items-center gap-2 px-3 py-1.5 text-[12px] text-c-text hover:bg-c-surface-2 transition-colors text-left min-w-0"
                      >
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          currentContext?.name === ctx.name ? 'bg-c-success' : 'bg-c-text-3',
                        )} />
                        <span className="flex-1 truncate">{ctx.name}</span>
                        <span className="text-[10px] text-c-text-3 truncate max-w-[100px]">{shortHost(ctx.endpoint)}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRemoveName(ctx.name) }}
                        title={`Disconnect ${ctx.name}`}
                        className="ml-1 px-1.5 py-1 text-c-text-3 opacity-0 group-hover/row:opacity-100 hover:text-c-danger transition-opacity text-[11px]"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Actions */}
            <div className="border-t border-c-border">
              <button
                onClick={() => { setConnectOpen(true); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-[12px] text-c-text hover:bg-c-surface-2 transition-colors flex items-center gap-2"
              >
                <span className="text-c-accent">+</span>
                Add another Control Plane…
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add new */}
      {connectOpen && <ConnectDialog onClose={() => setConnectOpen(false)} />}

      {/* Confirm remove */}
      {confirmRemoveName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmRemoveName(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-c-surface border border-c-border rounded-xl shadow-2xl p-5">
            <h2 className="text-[14px] font-semibold text-c-text mb-1">Disconnect Control Plane?</h2>
            <p className="text-[12.5px] text-c-text-2 mb-4">
              This removes <span className="font-mono text-c-text">{confirmRemoveName}</span> from the Console&apos;s local state.
              The Authority itself isn&apos;t affected — you can reconnect anytime by adding the same endpoint again.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmRemoveName(null)}
                className="px-3 py-1.5 rounded-md text-[12.5px] text-c-text-2 hover:bg-c-surface-2 transition-colors">
                Cancel
              </button>
              <button onClick={() => doRemove(confirmRemoveName)}
                className="px-3 py-1.5 rounded-md text-[12.5px] font-medium text-white bg-c-danger hover:opacity-90 transition-opacity">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function shortHost(endpoint: string): string {
  try {
    return new URL(endpoint).host
  } catch {
    return endpoint
  }
}
