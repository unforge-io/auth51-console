import Link from 'next/link'
import type { ReactNode } from 'react'

/** Server-safe prose primitives shared across docs pages. Theme-aware c-* tokens. */

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
  return <h2 id={id} className="text-[22px] font-semibold text-c-text tracking-tight mt-12 mb-3 scroll-mt-24">{children}</h2>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] text-c-text-2 leading-relaxed mb-4">{children}</p>
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
