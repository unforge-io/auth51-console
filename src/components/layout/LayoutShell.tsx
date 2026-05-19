'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

/**
 * LayoutShell — switches between marketing chrome and bare body based on
 * route. /console paths render full-bleed without the marketing Header /
 * Footer or the `pt-16` offset, which would otherwise break Console's
 * full-viewport flex layout.
 */
export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isConsole = pathname?.startsWith('/console') ?? false

  if (isConsole) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
