'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Container'

/**
 * Footer — Stripe-style. Dark navy bg, light text, clean columns.
 */

const FOOTER_LINKS = {
  Product: [
    { label: 'Walkthrough', href: '/walkthrough' },
    { label: 'Protocol', href: '/protocol' },
    { label: 'Architecture', href: '/architecture' },
  ],
  Deploy: [
    { label: 'Enterprise', href: '/deploy/enterprise' },
    { label: 'Cloud', href: '/deploy/cloud' },
  ],
  Resources: [
    { label: 'IETF Draft', href: '#' },
    { label: 'GitHub', href: '#' },
    { label: 'Documentation', href: '#' },
  ],
  Company: [
    { label: 'Unforge', href: '#' },
    { label: 'Contact', href: '#' },
  ],
} as const

export function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/console')) return null
  return (
    <footer className="bg-[#0a2540] text-white">
      <Container>
        <div className="py-14 sm:py-20">
          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8898aa] mb-4">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-[14px] text-[#adbdcc] no-underline hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom strip */}
          <div className="mt-14 flex flex-col items-start gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Logo className="text-[16px] !text-white" wordmarkOnly />
            <p className="text-[13px] text-[#8898aa]">
              Part of the Auth51 platform. Built by Unforge.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
