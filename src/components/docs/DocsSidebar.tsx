'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

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
    heading: 'Foundations',
    items: [
      { label: 'Overview', href: '/docs/foundations' },
      { label: 'The intent–execution gap', href: '/docs/foundations/intent-execution-gap' },
      { label: 'OAuth 2.0 & JWT, quickly', href: '/docs/foundations/oauth-and-jwt' },
      { label: 'Token exchange', href: '/docs/foundations/token-exchange' },
      { label: 'Proof-of-possession', href: '/docs/foundations/proof-of-possession' },
      { label: 'Zero-Trust alignment', href: '/docs/foundations/zero-trust' },
      { label: 'The delegation landscape', href: '/docs/foundations/delegation-landscape' },
    ],
  },
  {
    heading: 'Architecture',
    items: [
      { label: 'Overview', href: '/docs/architecture' },
      { label: 'Authority', href: '/docs/architecture/authority' },
      { label: 'Client runtime', href: '/docs/architecture/client-runtime' },
      { label: 'MCP proxy', href: '/docs/architecture/mcp-proxy' },
      { label: 'Discovery service', href: '/docs/architecture/discovery' },
      { label: 'Verifier', href: '/docs/architecture/verifier' },
      { label: 'Checksum engine', href: '/docs/architecture/checksum' },
      { label: 'Contracts', href: '/docs/architecture/contracts' },
    ],
  },
  {
    heading: 'Concepts',
    items: [
      { label: 'Overview', href: '/docs/concepts' },
      { label: 'Agent identity', href: '/docs/concepts/agent-identity' },
      { label: 'Intent tokens', href: '/docs/concepts/intent-tokens' },
      { label: 'Proof-of-possession', href: '/docs/concepts/proof-of-possession' },
      { label: 'Capabilities & the surface', href: '/docs/concepts/capabilities' },
      { label: 'Grants & scopes', href: '/docs/concepts/grants-and-scopes' },
      { label: 'Workflows & steps', href: '/docs/concepts/workflows' },
      { label: 'Delegation & chains', href: '/docs/concepts/delegation' },
      { label: 'Non-amplification', href: '/docs/concepts/non-amplification' },
      { label: 'Discovery & the trust boundary', href: '/docs/concepts/discovery' },
      { label: 'MCP governance', href: '/docs/concepts/mcp' },
    ],
  },
  {
    heading: 'Protocol flows',
    items: [
      { label: 'Overview', href: '/docs/flows' },
      { label: 'Registration', href: '/docs/flows/registration' },
      { label: 'Token minting', href: '/docs/flows/minting' },
      { label: 'Workflow tracking', href: '/docs/flows/workflow-tracking' },
      { label: 'Multi-agent delegation', href: '/docs/flows/multi-agent' },
    ],
  },
  {
    heading: 'Security model',
    items: [
      { label: 'Overview', href: '/docs/security' },
      { label: 'Threat model', href: '/docs/security/threat-model' },
      { label: 'Security anchors', href: '/docs/security/security-anchors' },
      { label: 'Zero-Trust enforcement zones', href: '/docs/security/enforcement-zones' },
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

/** The section whose route best matches the current path (longest href prefix). */
function activeSectionFor(pathname: string): string {
  let best = { len: -1, heading: SECTIONS[0].heading }
  for (const section of SECTIONS) {
    for (const item of section.items) {
      if (!item.href) continue
      const match = pathname === item.href || pathname.startsWith(item.href + '/')
      if (match && item.href.length > best.len) {
        best = { len: item.href.length, heading: section.heading }
      }
    }
  }
  return best.heading
}

export function DocsSidebar() {
  const pathname = usePathname()
  const activeSection = activeSectionFor(pathname)

  // Collapsible sections: only the active group is open by default; the rest
  // collapse so the nav never has to scroll. Navigating opens the group you land in.
  const [open, setOpen] = useState<Record<string, boolean>>({ [activeSection]: true })
  useEffect(() => {
    setOpen((prev) => (prev[activeSection] ? prev : { ...prev, [activeSection]: true }))
  }, [activeSection])

  return (
    <nav className="text-[13px]">
      {SECTIONS.map((section) => {
        const isOpen = !!open[section.heading]
        return (
          <div key={section.heading} className="mb-2">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((prev) => ({ ...prev, [section.heading]: !prev[section.heading] }))}
              className="group flex w-full items-center gap-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-c-text-3 hover:text-c-text-2 transition-colors"
            >
              <span className={`text-[8px] transition-transform ${isOpen ? 'rotate-90' : ''} text-c-text-3 group-hover:text-c-text-2`}>▶</span>
              {section.heading}
            </button>
            {isOpen && (
              <ul className="space-y-0.5 pb-2 pl-[13px]">
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
                        className={`block border-l -ml-px pl-3 py-1 transition-colors ${
                          active
                            ? 'border-c-accent text-c-text font-medium'
                            : 'border-transparent text-c-text-2 hover:text-c-text hover:border-c-border-2'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}
