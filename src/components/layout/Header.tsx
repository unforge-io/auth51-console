'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

const NAV_ITEMS = [
  { label: 'Walkthrough', href: '/walkthrough' },
  { label: 'Protocol', href: '/protocol' },
  { label: 'Architecture', href: '/architecture' },
  { label: 'Deploy', href: '/deploy/enterprise' },
] as const

export function Header() {
  return (
    <>
      {/* Header background — sits below the globe */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-stone-200/60" />

      {/* Header content — sits above the globe */}
      <header className="fixed top-0 left-0 right-0 z-[60]">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="no-underline hover:no-underline">
                <Logo className="text-[18px]" />
              </Link>

              <nav className="hidden md:flex items-center gap-7">
                {NAV_ITEMS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-[15px] font-medium text-[#425466] no-underline hover:text-[#0a2540] transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/walkthrough" className="hidden sm:block no-underline">
                <Button variant="primary" size="sm">
                  Get started →
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </header>
    </>
  )
}
