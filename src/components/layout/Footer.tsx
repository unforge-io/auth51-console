'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from '@/components/ui/Container'

const FOOTER_LINKS = {
  Product: [
    { label: 'Console',     href: '/console' },
    { label: 'Walkthrough', href: '/walkthrough' },
    { label: 'Architecture', href: '/architecture' },
  ],
  Deploy: [
    { label: 'Enterprise',  href: '/deploy/enterprise' },
    { label: 'Cloud',       href: '/deploy/cloud' },
  ],
  Resources: [
    { label: 'IETF Draft (Agentic JWT)', href: '#' },
    { label: 'Protocol Spec',            href: '/protocol' },
    { label: 'GitHub',                   href: '#' },
  ],
  Company: [
    { label: 'Unforge',  href: '#' },
    { label: 'Contact',  href: '#' },
  ],
} as const

export function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/console')) return null
  return (
    <footer className="bg-[rgb(8_9_11)] text-white border-t border-[rgb(38_39_43)]">
      <Container>
        <div className="py-14 sm:py-20">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#5c6168] mb-4">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-[13.5px] text-[#b6bbc5] no-underline hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start gap-4 border-t border-[rgb(38_39_43)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#6366f1] text-white text-[11px] font-bold">A</span>
              <span className="text-[15px] font-semibold tracking-tight text-white">Auth51</span>
            </span>
            <p className="text-[12.5px] text-[#5c6168]">
              The control plane for AI agents. Built by Unforge.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
