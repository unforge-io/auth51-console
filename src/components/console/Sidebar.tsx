'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { useSidebarWidth, MIN_WIDTH, MAX_WIDTH } from '@/lib/console/sidebarWidth'
import { ControlPlaneSwitcher } from './ControlPlaneSwitcher'
import { cn } from '@/lib/utils'

/**
 * Sidebar — Linear-style. Tight, monochromatic, themed via CSS variables.
 *
 * Sections:
 *  - Control Plane switcher (top, like kubectl context)
 *  - Overview
 *  - Agents (Discovered / Registered)
 *  - Workflows
 *  - Security (Threats / Audit / Policies)
 *  - Infrastructure (Runtimes / Verifiers / Resources)
 *  - MCP
 *  - Performance / Evals (coming)
 *  - Settings (bottom)
 *
 * Items show "Soon" badge when not yet implemented. We keep them visible
 * so the user understands the full surface; they just aren't clickable.
 */

type NavItem = {
  label: string
  href?: string
  badge?: 'soon'
  count?: number
  indent?: boolean
}

type NavSection = {
  heading?: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Overview', href: '/console' },
      { label: 'Get started', href: '/console/onboarding' },
    ],
  },
  {
    heading: 'Agents',
    items: [
      { label: 'Discovered', href: '/console/agents/discovered', indent: true },
      { label: 'Registered', href: '/console/agents/registered', indent: true },
      { label: 'Grants',     href: '/console/agents/grants', indent: true },
    ],
  },
  {
    heading: 'Workflows',
    items: [
      { label: 'Inferred',   href: '/console/workflows/inferred',   indent: true },
      { label: 'Registered', href: '/console/workflows/registered', indent: true },
    ],
  },
  {
    heading: 'Security',
    items: [
      { label: 'Threats',   href: '/console/security/threats',   indent: true },
      { label: 'Audit log', href: '/console/security/audit',     indent: true },
      { label: 'Policies',  href: '/console/security/policies',  badge: 'soon', indent: true },
    ],
  },
  {
    heading: 'Infrastructure',
    items: [
      { label: 'Runtimes',  href: '/console/infra/runtimes',  badge: 'soon', indent: true },
      { label: 'Verifiers', href: '/console/infra/verifiers', badge: 'soon', indent: true },
      { label: 'Resources', href: '/console/infra/resources', indent: true },
    ],
  },
  {
    heading: 'Access',
    items: [
      { label: 'API keys', href: '/console/settings/api-keys', indent: true },
      { label: 'Workload identities', href: '/console/settings/workload-identities', indent: true },
    ],
  },
  {
    heading: 'Integrations',
    items: [
      { label: 'MCP', href: '/console/mcp', badge: 'soon', indent: true },
    ],
  },
  {
    heading: 'Observability',
    items: [
      { label: 'Performance', href: '/console/perf',  badge: 'soon', indent: true },
      { label: 'Evals',       href: '/console/evals', badge: 'soon', indent: true },
    ],
  },
]

const FOOTER_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/console/settings' },
]

export function Sidebar() {
  const { width, setWidth } = useSidebarWidth()
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startW = useRef(0)

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX.current
      setWidth(startW.current + dx)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [dragging, setWidth])

  return (
    <aside
      style={{ width: `${width}px`, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      className="relative shrink-0 border-r border-c-border bg-c-bg flex flex-col"
    >
      {/* Brand mark + Control Plane switcher */}
      <div className="px-3 pt-3 pb-2 border-b border-c-border">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-c-accent text-white text-[11px] font-bold">A</span>
          <span className="text-[13px] font-semibold text-c-text tracking-tight">Auth51</span>
          <span className="ml-auto text-[10px] font-mono text-c-text-3 uppercase tracking-wider">Console</span>
        </div>
        <ControlPlaneSwitcher />
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {section.heading && (
              <div className="px-2 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-c-text-3">
                {section.heading}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.label} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-c-border px-2 py-3">
        <ul className="space-y-0.5">
          {FOOTER_ITEMS.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </ul>
      </div>

      {/* Resize handle — drag to change sidebar width */}
      <div
        onMouseDown={(e) => {
          startX.current = e.clientX
          startW.current = width
          setDragging(true)
        }}
        onDoubleClick={() => setWidth(256)}
        title="Drag to resize · double-click to reset"
        className={cn(
          'absolute top-0 right-0 h-full w-1 cursor-col-resize z-10',
          'hover:bg-c-accent/40 active:bg-c-accent',
          dragging && 'bg-c-accent',
        )}
      />
    </aside>
  )
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const { currentContext } = useControlPlane()
  const isActive = item.href && pathname === item.href
  const disabled = item.badge === 'soon' || !currentContext

  const inner = (
    <span className={cn(
      'group flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors',
      item.indent && 'pl-3',
      isActive
        ? 'bg-c-surface text-c-text font-medium'
        : 'text-c-text-2 hover:bg-c-surface hover:text-c-text',
      disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
    )}>
      <span className="truncate flex-1">{item.label}</span>
      {item.count !== undefined && (
        <span className="text-[10px] font-mono text-c-text-3 px-1.5 py-0.5 rounded bg-c-surface-2">
          {item.count}
        </span>
      )}
      {item.badge === 'soon' && (
        <span className="text-[9px] font-medium tracking-wide uppercase text-c-text-3 px-1.5 py-0.5 rounded border border-c-border">
          Soon
        </span>
      )}
    </span>
  )

  if (disabled || !item.href) {
    return <li>{inner}</li>
  }

  return (
    <li>
      <Link href={item.href} className="block no-underline">{inner}</Link>
    </li>
  )
}
