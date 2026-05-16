'use client'

import { usePathname } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
import { useConsoleTheme } from '@/lib/console/ThemeProvider'
import { cn } from '@/lib/utils'

/**
 * Top header bar — Linear-style.
 *
 * Shows: breadcrumb path on the left, controls (theme, profile) on the right.
 */
export function ConsoleHeader() {
  const pathname = usePathname()
  const { currentContext } = useControlPlane()
  const crumbs = breadcrumbs(pathname)

  return (
    <header className="h-12 shrink-0 border-b border-c-border bg-c-bg flex items-center px-4 gap-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12.5px]">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-2">
            {i > 0 && <span className="text-c-text-3">/</span>}
            <span className={cn(i === crumbs.length - 1 ? 'text-c-text font-medium' : 'text-c-text-2')}>
              {c}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Connection status indicator */}
      {currentContext && (
        <div className="flex items-center gap-2 text-[11px] text-c-text-2 px-2 py-1 rounded border border-c-border">
          <span className="h-1.5 w-1.5 rounded-full bg-c-success" />
          <span className="font-mono">{shortHost(currentContext.endpoint)}</span>
        </div>
      )}

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useConsoleTheme()
  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="h-7 w-7 inline-flex items-center justify-center rounded-md text-c-text-2 hover:bg-c-surface hover:text-c-text transition-colors"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function shortHost(endpoint: string): string {
  try {
    return new URL(endpoint).host
  } catch {
    return endpoint
  }
}

function breadcrumbs(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'console')) {
    return ['Overview']
  }
  // Skip "console" prefix, then title-case each remaining segment
  return parts.slice(1).map((p) =>
    p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  )
}
