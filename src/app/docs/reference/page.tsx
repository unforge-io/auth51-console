import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, H2, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Standards & research',
  description:
    'The standards auth51 builds on — OAuth 2.0, token exchange, DPoP, JWT, JWK — plus the protocol draft and the paper.',
}

const RFCS = [
  { id: 'RFC 6749', title: 'The OAuth 2.0 Authorization Framework', href: 'https://www.rfc-editor.org/rfc/rfc6749',
    note: 'The client-credentials grant an agent uses to authenticate as its org.' },
  { id: 'RFC 8693', title: 'OAuth 2.0 Token Exchange', href: 'https://www.rfc-editor.org/rfc/rfc8693',
    note: 'How the console federates a signed-in session into an org-scoped authority token.' },
  { id: 'RFC 9449', title: 'OAuth 2.0 Demonstrating Proof of Possession (DPoP)', href: 'https://www.rfc-editor.org/rfc/rfc9449',
    note: 'Binds each intent token to a key held in the agent process, so a copied token is useless.' },
  { id: 'RFC 7519', title: 'JSON Web Token (JWT)', href: 'https://www.rfc-editor.org/rfc/rfc7519',
    note: 'The shape of an intent token on the wire — identity, scope, audience, expiry.' },
  { id: 'RFC 7517', title: 'JSON Web Key (JWK)', href: 'https://www.rfc-editor.org/rfc/rfc7517',
    note: 'How a resource server fetches the authority’s public keys (JWKS) to verify a token.' },
]

export default function ReferenceHome() {
  return (
    <div>
      <PageTitle eyebrow="Reference">Standards &amp; research</PageTitle>
      <Lead>
        auth51 isn&rsquo;t a new protocol you have to take on faith. It&rsquo;s established OAuth
        machinery applied per-action instead of per-session. If you know these RFCs, you
        already know most of how auth51 works — the rest is where we apply them.
      </Lead>

      <H2>The standards we build on</H2>
      <ul className="mt-2 space-y-3">
        {RFCS.map((r) => (
          <li key={r.id} className="rounded-xl border border-c-border bg-c-surface p-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <a href={r.href} target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-c-accent-2 hover:underline">{r.id}</a>
              <span className="text-[14px] text-c-text">{r.title}</span>
            </div>
            <p className="mt-1 text-[13px] text-c-text-2 leading-relaxed">{r.note}</p>
          </li>
        ))}
      </ul>

      <H2>The auth51 protocol</H2>
      <P>
        Where auth51 goes beyond the base standards — agent identity as a checksum, intent
        tokens minted at the source, non-amplification across delegation — is written up as
        an internet-draft and a paper. The <Link href="/protocol" className="text-c-accent-2 hover:underline">protocol overview</Link>{' '}
        is the readable version; canonical links to the IETF draft and the preprint land
        here as they&rsquo;re published.
      </P>

      <H2>API, config, and scopes</H2>
      <P>
        Endpoint-level reference for the authority and the client — request shapes, the
        environment variables the client reads, and the scope envelope a customer key
        carries — is being written and will live in this section.
      </P>
    </div>
  )
}
