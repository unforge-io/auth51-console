import Link from 'next/link'
import type { ReactNode } from 'react'

/** Server-safe prose primitives shared across docs pages. Theme-aware c-* tokens. */

/** Slug for heading anchors — mirrors the id the on-this-page TOC links to. */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function PageTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-c-accent mb-2">{eyebrow}</p>
      )}
      <h1 className="text-[32px] font-semibold text-c-text tracking-tight leading-tight">{children}</h1>
    </header>
  )
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[17px] text-c-text-2 leading-relaxed mb-6">{children}</p>
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  const headingId = id ?? (typeof children === 'string' ? slugify(children) : undefined)
  return <h2 id={headingId} className="text-[22px] font-semibold text-c-text tracking-tight mt-12 mb-3 scroll-mt-24">{children}</h2>
}

export function P({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[15px] text-c-text-2 leading-relaxed mb-4 ${className}`}>{children}</p>
}

export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-c-accent-2 hover:underline">{children}</Link>
}

export function Callout({ kind = 'note', children }: { kind?: 'note' | 'warning'; children: ReactNode }) {
  const box = kind === 'warning' ? 'border-c-warning/25 bg-c-warning/[0.05]' : 'border-c-accent/25 bg-c-accent/[0.05]'
  const label = kind === 'warning' ? 'text-c-warning' : 'text-c-accent-2'
  return (
    <div className={`my-5 rounded-lg border ${box} px-4 py-3`}>
      <p className={`text-[10.5px] font-mono uppercase tracking-wider mb-1.5 ${label}`}>
        {kind === 'warning' ? 'Watch out' : 'Note'}
      </p>
      <div className="text-[13.5px] text-c-text-2 leading-relaxed [&_a]:text-c-accent-2 [&_a:hover]:underline">{children}</div>
    </div>
  )
}

/** A real-world incident sidebar — the "constructive scare", grounded and short. */
export function InTheWild({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="my-6 rounded-xl border border-c-border bg-c-surface p-5">
      <p className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">In the wild</p>
      <p className="text-[14px] font-semibold text-c-text mb-1.5">{title}</p>
      <div className="text-[13.5px] text-c-text-2 leading-relaxed">{children}</div>
    </aside>
  )
}

/**
 * Progressive disclosure. Lean readers skim past a closed <Deep>; readers who
 * want the mechanism open it. Native <details> — no client JS, server-safe.
 */
export function Deep({ title = 'Go deeper', children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group my-5 rounded-lg border border-c-border bg-c-surface/60 open:bg-c-surface">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none text-[13px] font-medium text-c-text-2 hover:text-c-text [&::-webkit-details-marker]:hidden">
        <span className="text-c-accent-2 text-[11px] transition-transform group-open:rotate-90">▶</span>
        {title}
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-c-border/60 [&>*:first-child]:mt-3 [&_p]:text-[13.5px]">
        {children}
      </div>
    </details>
  )
}

/**
 * A primer on the underlying technology we build on — OAuth, token exchange,
 * JWT/JWK, DPoP. Visually distinct from a Callout: this is context, not caution.
 */
export function Foundations({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="my-6 rounded-xl border border-c-border bg-c-surface-2/40 p-5">
      <p className="text-[10.5px] font-mono uppercase tracking-wider text-c-accent-2 mb-1.5">Background</p>
      <p className="text-[14px] font-semibold text-c-text mb-2">{title}</p>
      <div className="text-[13.5px] text-c-text-2 leading-relaxed space-y-3 [&_a]:text-c-accent-2 [&_a:hover]:underline [&_code]:font-mono [&_code]:text-[12.5px]">
        {children}
      </div>
    </aside>
  )
}

/** A diagram with a numbered, RFC-style caption. Scrolls horizontally if wide. */
export function Figure({ n, caption, children }: { n?: number; caption?: ReactNode; children: ReactNode }) {
  return (
    <figure className="my-7">
      <div className="rounded-xl border border-c-border bg-c-surface p-4 overflow-x-auto">{children}</div>
      {caption && (
        <figcaption className="mt-2.5 text-[12px] text-c-text-3 leading-relaxed">
          {n != null && <span className="font-medium text-c-text-2">Figure {n}. </span>}
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/** Inline citation chip pointing at the spec (defaults to the reference hub). */
export function SpecRef({ href = '/docs/reference', children }: { href?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block align-baseline text-[10.5px] font-mono text-c-text-3 border border-c-border rounded px-1 py-px no-underline hover:text-c-text-2 hover:border-c-border-2 transition-colors"
    >
      {children}
    </Link>
  )
}

export function Related({ items }: { items: { href: string; label: string }[] }) {
  return (
    <div className="mt-14 border-t border-c-border pt-5">
      <p className="text-[11px] font-mono uppercase tracking-wider text-c-text-3 mb-2">Keep reading</p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="text-[14px] text-c-accent-2 hover:underline">{it.label} →</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
