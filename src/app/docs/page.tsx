import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'auth51 documentation: give every agent action an identity you can verify. Start fast, understand the model, look things up.',
}

const SECTIONS = [
  {
    href: '/docs/start',
    title: 'Get started',
    body: 'Install the client, run your agent, and watch it show up in the console to approve. One import, no config.',
    cta: 'Quickstart',
  },
  {
    href: '/docs/concepts',
    title: 'Concepts',
    body: 'How agent identity works, what an intent token is, and why a stolen one is useless. Read these to understand the model.',
    cta: 'Read the concepts',
  },
  {
    href: '/docs/reference',
    title: 'Reference',
    body: 'The standards auth51 builds on (OAuth, token exchange, DPoP), plus the protocol draft and the paper.',
    cta: 'Standards & research',
  },
]

export default function DocsHome() {
  return (
    <div>
      <PageTitle eyebrow="Documentation">Give every agent action an identity you can verify</PageTitle>
      <Lead>
        When an agent calls a tool or an API, nothing in a normal request proves which
        agent made the call, that its instructions weren&rsquo;t tampered with, or that a
        leaked token isn&rsquo;t being replayed. auth51 closes that gap. These docs are
        organized by what you&rsquo;re trying to do.
      </Lead>
      <P>
        New here? Start with the <Link href="/docs/start" className="text-c-accent-2 hover:underline">Quickstart</Link>,
        then read <Link href="/docs/concepts/agent-identity" className="text-c-accent-2 hover:underline">Agent identity</Link>{' '}
        to see how the whole thing hangs together.
      </P>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-xl border border-c-border bg-c-surface p-5 no-underline hover:border-c-accent/50 transition-colors"
          >
            <div className="text-[15px] font-semibold text-c-text mb-1.5">{s.title}</div>
            <p className="text-[13px] text-c-text-2 leading-relaxed mb-3">{s.body}</p>
            <span className="text-[12.5px] text-c-accent-2">
              {s.cta} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
