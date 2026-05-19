'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container } from '@/components/ui/Container'

/**
 * Marketing site header. Dark, sticky, with a translucent blur backdrop
 * that picks up depth as the user scrolls past the hero.
 *
 * Hidden entirely on /console — the Console renders its own chrome.
 */
const NAV_ITEMS = [
  { label: 'Walkthrough',  href: '/walkthrough' },
  { label: 'Protocol',     href: '/protocol' },
  { label: 'Architecture', href: '/architecture' },
] as const

export function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (pathname?.startsWith('/console')) return null

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-200',
        scrolled
          ? 'bg-[rgb(10_11_13_/_0.78)] backdrop-blur-md border-b border-[rgb(46_48_54_/_0.6)]'
          : 'bg-transparent border-b border-transparent',
      ].join(' ')}
    >
      <Container>
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="no-underline flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#6366f1] text-white text-[11px] font-bold">A</span>
              <span className="text-[14px] font-semibold tracking-tight text-white">Auth51</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-medium text-[#b6bbc5] no-underline hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden sm:block text-[13px] text-[#b6bbc5] no-underline hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/console"
              className="inline-flex items-center justify-center rounded-full bg-[#6366f1] hover:bg-[#818cf8] text-white text-[13px] font-medium px-4 py-1.5 no-underline transition-colors"
            >
              Open Console →
            </Link>
          </div>
        </div>
      </Container>
    </header>
  )
}
