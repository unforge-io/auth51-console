import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Protocol flows',
  description:
    'The wire-level sequences that tie auth51 together — registration, token minting, workflow tracking, and multi-agent delegation — end to end.',
}

const FLOWS = [
  { href: '/docs/flows/registration', title: 'Registration', n: '1',
    body: 'How a client, its agents, and their workflows enter the Authority — the one-time step that establishes every identity everything else checks against.' },
  { href: '/docs/flows/minting', title: 'Token minting', n: '2',
    body: 'The request-time sequence: the runtime asks for an intent token, the Authority validates and mints, the token is attached and verified at the resource.' },
  { href: '/docs/flows/workflow-tracking', title: 'Workflow tracking', n: '3',
    body: 'How the runtime follows a multi-step plan as it executes — tracking the step sequence and delegation so each mint reflects where the run actually is.' },
  { href: '/docs/flows/multi-agent', title: 'Multi-agent delegation', n: '4',
    body: 'The full path when a supervisor delegates to workers: each hop mints against its own grant, and the chain is carried and checked end to end.' },
]

export default function FlowsIndex() {
  return (
    <div>
      <PageTitle eyebrow="Protocol flows">Protocol flows</PageTitle>
      <Lead>
        The Concepts pages explain the objects; the Architecture pages explain the components. These
        pages put them in motion — the actual sequences of messages that register an agent, mint a
        token, follow a workflow, and carry a delegation across agents.
      </Lead>
      <P>
        They&rsquo;re the readable companion to the wire-level flows in the protocol draft. Read them once
        and the rest of the docs stops being a set of parts and becomes a system.
      </P>

      <ul className="mt-8 space-y-3">
        {FLOWS.map((f) => (
          <li key={f.href}>
            <Link href={f.href} className="group block rounded-xl border border-c-border bg-c-surface p-4 no-underline hover:border-c-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-c-text-3 border border-c-border rounded px-1.5 py-0.5 shrink-0">{f.n}</span>
                <span className="text-[15px] font-semibold text-c-text">{f.title}</span>
                <span className="ml-auto text-c-accent-2 transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-1.5 text-[13px] text-c-text-2 leading-relaxed">{f.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
