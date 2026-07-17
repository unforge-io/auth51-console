import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'Auth51 documentation: give every agent action an identity you can verify. Start quickly, understand the model, and explore the reference.',
}

const SECTIONS = [
  {
    href: '/docs/start',
    title: 'Get started',
    body: 'Install the client, run your agent, and review its discovered identity in the console. One import, with no configuration required.',
    cta: 'Quickstart',
  },
  {
    href: '/docs/concepts',
    title: 'Concepts',
    body: 'Learn how agent identity and intent tokens work, including why a stolen token cannot be used without its bound key.',
    cta: 'Read the concepts',
  },
  {
    href: '/docs/reference',
    title: 'Reference',
    body: 'Explore the standards Auth51 builds on, including OAuth, token exchange, and DPoP, along with the protocol draft and paper.',
    cta: 'Standards & research',
  },
]

export default function DocsHome() {
  return (
    <div>
      <PageTitle eyebrow="Documentation">Give every agent action an identity you can verify</PageTitle>
      <Lead>
        A typical tool or API request does not identify the individual agent that produced it.
        It also does not show whether that agent still matches its registered instructions or
        whether a leaked token is being replayed. Auth51 adds those checks to the authorization
        path. These docs are organized around the task you want to complete.
      </Lead>
      <P>
        New here? Start with the <Link href="/docs/start" className="text-c-accent-2 hover:underline">Quickstart</Link>,
        then read <Link href="/docs/concepts/agent-identity" className="text-c-accent-2 hover:underline">Agent identity</Link>{' '}
        for the core identity model.
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
