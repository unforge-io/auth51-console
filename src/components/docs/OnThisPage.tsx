'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { slugify } from '@/components/docs/prose'

/**
 * The right-hand "On this page" nav (Kubernetes / Stripe docs style). Self-scans
 * the rendered content for <h2> section headings — no per-page config — and
 * highlights the section currently in view via IntersectionObserver.
 *
 * Renders nothing when a page has fewer than two headings, so short pages (the
 * docs/concepts index, reference) don't show an empty rail.
 */
type Heading = { id: string; text: string }

export function OnThisPage() {
  const pathname = usePathname()
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const container = document.querySelector('[data-doc-content]')
    if (!container) {
      setHeadings([])
      return
    }

    const els = Array.from(container.querySelectorAll('h2')) as HTMLHeadingElement[]
    const items: Heading[] = els
      .map((el) => {
        const text = el.textContent?.trim() ?? ''
        if (!el.id && text) el.id = slugify(text)
        return { id: el.id, text }
      })
      .filter((h) => h.id && h.text)
    setHeadings(items)

    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        )
        setActiveId(topmost.target.id)
      },
      // trigger once a heading passes below the fixed header, before it leaves the top
      { rootMargin: '-72px 0px -72% 0px', threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  if (headings.length < 2) return null

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="text-[11px] font-mono uppercase tracking-wider text-c-text-3 mb-3">On this page</p>
      <ul className="border-l border-c-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block -ml-px border-l pl-3 py-1 leading-snug transition-colors ${
                activeId === h.id
                  ? 'border-c-accent text-c-text font-medium'
                  : 'border-transparent text-c-text-2 hover:text-c-text hover:border-c-border-2'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
