'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Docs navigation, organized by what the reader is trying to do (Diátaxis):
 * Get started (learning) · Concepts (understanding) · Guides (tasks) ·
 * Reference (lookup). Items without a page yet show as "soon" — visible so the
 * shape is clear, not clickable.
 */
type Item = { label: string; href?: string }
type Section = { heading: string; items: Item[] }

const SECTIONS: Section[] = [
  {
    heading: 'Get started',
    items: [
      { label: 'Overview', href: '/docs' },
      { label: 'Quickstart', href: '/docs/start' },
      { label: 'Threat lab' }, // soon
    ],
  },
  {
    heading: 'Concepts',
    items: [
      { label: 'Overview', href: '/docs/concepts' },
      { label: 'Agent identity', href: '/docs/concepts/agent-identity' },
      { label: 'Intent tokens', href: '/docs/concepts/intent-tokens' },
      { label: 'Proof-of-possession', href: '/docs/concepts/proof-of-possession' },
      { label: 'Non-amplification', href: '/docs/concepts/non-amplification' },
      { label: 'Discovery & the trust boundary', href: '/docs/concepts/discovery' },
      { label: 'MCP governance', href: '/docs/concepts/mcp' },
    ],
  },
  {
    heading: 'Guides',
    items: [
      { label: 'Keyless on AWS' },
      { label: 'Self-host the authority' },
      { label: 'Register from CI/CD' },
    ],
  },
  {
    heading: 'Reference',
    items: [
      { label: 'Standards & research', href: '/docs/reference' },
      { label: 'API' },
      { label: 'Config & environment' },
      { label: 'Scopes' },
    ],
  },
]

export function DocsSidebar() {
  const pathname = usePathname()
  return (
    <nav className="text-[13px]">
      {SECTIONS.map((section) => (
        <div key={section.heading} className="mb-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-c-text-3 mb-2">{section.heading}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.href && pathname === item.href
              if (!item.href) {
                return (
                  <li key={item.label} className="flex items-center gap-2 py-1 text-c-text-3">
                    <span>{item.label}</span>
                    <span className="text-[9.5px] font-mono uppercase tracking-wider text-c-text-3/70 border border-c-border rounded px-1">soon</span>
                  </li>
                )
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block py-1 rounded transition-colors ${
                      active ? 'text-c-text font-medium' : 'text-c-text-2 hover:text-c-text'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
