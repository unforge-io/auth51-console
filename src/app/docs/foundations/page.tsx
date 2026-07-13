import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Foundations',
  description:
    'The standards auth51 is built on: OAuth 2.0, JWT, token exchange, DPoP, and Zero-Trust, and how each one leads into the way auth51 works.',
}

const PAGES = [
  { href: '/docs/foundations/intent-execution-gap', title: 'The intent–execution gap',
    body: 'The single assumption OAuth 2.0 makes about clients, and why an autonomous agent breaks it. The problem everything else here answers.' },
  { href: '/docs/foundations/oauth-and-jwt', title: 'OAuth 2.0 & JWT, quickly',
    body: 'Grants, access tokens, bearer semantics, JWT and JWK. The machinery you already know, and where it stops being enough for agents.' },
  { href: '/docs/foundations/token-exchange', title: 'Token exchange (RFC 8693)',
    body: 'Trading one token for a narrower one, and the actor claim for “A acting for B.” The standard the agent_checksum grant is built on top of.' },
  { href: '/docs/foundations/proof-of-possession', title: 'Proof-of-possession (DPoP & mTLS)',
    body: 'Sender-constraining a token so a copy is inert. Why auth51 chose DPoP (RFC 9449) over mTLS, and binds per action rather than per session.' },
  { href: '/docs/foundations/zero-trust', title: 'Zero-Trust alignment',
    body: 'NIST SP 800-207 in one page: policy decision vs enforcement points, implicit trust zones, and how auth51’s components map onto them one-to-one.' },
  { href: '/docs/foundations/delegation-landscape', title: 'The delegation landscape',
    body: 'What GNAP, SPIFFE/SPIRE, cloud IAM, and actor chains each solve, and the agent-level, intent-bound gap none of them close.' },
]

export default function FoundationsIndex() {
  return (
    <div>
      <PageTitle eyebrow="Foundations">Foundations</PageTitle>
      <Lead>
        auth51 is not a new protocol you take on faith. Almost everything underneath it is
        established, widely deployed OAuth and Zero-Trust machinery, composed a particular way
        for autonomous agents. These pages explain that machinery on its own terms, then show the
        seam where auth51 picks it up.
      </Lead>
      <P>
        You don&rsquo;t need to read these to use auth51. Read them if you want to know <em>why</em>{' '}
        it&rsquo;s built the way it is, and to satisfy yourself that the novel part is small and the
        rest is standards you already trust.
      </P>

      <ul className="mt-8 space-y-3">
        {PAGES.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="group block rounded-xl border border-c-border bg-c-surface p-4 no-underline hover:border-c-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-c-text">{p.title}</span>
                <span className="text-c-accent-2 transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-1 text-[13px] text-c-text-2 leading-relaxed">{p.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
