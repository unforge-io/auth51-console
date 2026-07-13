import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, H2, P, Callout } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Specification & standards',
  description:
    'The auth51 protocol is specified as an IETF internet-draft, built on established OAuth standards: OAuth 2.0, token exchange, DPoP, JWT, and JWK.',
}

const RFCS = [
  { id: 'RFC 6749', title: 'OAuth 2.0 Authorization Framework', href: 'https://www.rfc-editor.org/rfc/rfc6749',
    note: 'The client-credentials grant an agent uses to authenticate as its org.' },
  { id: 'RFC 8693', title: 'OAuth 2.0 Token Exchange', href: 'https://www.rfc-editor.org/rfc/rfc8693',
    note: 'How a signed-in console session is federated into an org-scoped authority token.' },
  { id: 'RFC 9449', title: 'Demonstrating Proof of Possession (DPoP)', href: 'https://www.rfc-editor.org/rfc/rfc9449',
    note: 'Binds an intent token to a key held in the agent process, so a copied token is useless.' },
  { id: 'RFC 7519', title: 'JSON Web Token (JWT)', href: 'https://www.rfc-editor.org/rfc/rfc7519',
    note: 'The shape of an intent token on the wire: identity, scope, audience, expiry.' },
  { id: 'RFC 7517', title: 'JSON Web Key (JWK)', href: 'https://www.rfc-editor.org/rfc/rfc7517',
    note: 'How a resource server fetches the authority’s public keys (JWKS) to verify a token.' },
]

export default function ReferenceHome() {
  return (
    <div>
      <PageTitle eyebrow="Reference">Specification &amp; standards</PageTitle>
      <Lead>
        auth51 rests on standards you can read. What&rsquo;s new (agent identity as a
        checksum, intent tokens minted per action, and non-amplification across delegation) is
        written up as an IETF internet-draft. Everything underneath it is established OAuth,
        so if you know these RFCs you already know most of how auth51 works.
      </Lead>

      <H2>The auth51 protocol: the specification</H2>
      <P>
        The internet-draft is the normative spec: it defines the identity checksum, the
        intent-token profile, the MCP <code className="code-inline">_meta</code> propagation
        (Hop-A / Hop-B), and the non-amplification rules. The{' '}
        <Link href="/protocol" className="text-c-accent-2 hover:underline">protocol overview</Link>{' '}
        is the readable companion to it.
      </P>
      <Callout>
        The canonical IETF datatracker link and the arXiv preprint are being finalized and
        will be linked here. (Placeholders until then, not yet public.)
      </Callout>

      <H2>Standards it builds on</H2>
      <P>These are the base standards auth51 composes. The draft above specifies how.</P>
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

      <H2>The paper</H2>
      <P>
        A companion paper (arXiv preprint) covers the threat model and the evaluation behind
        the protocol. Link lands here on publication.
      </P>

      <H2>API, config, and scopes</H2>
      <P>
        Endpoint-level reference for the authority and the client is being written and will
        live in this section: request shapes, the environment variables the client reads, and
        the scope envelope a customer key carries.
      </P>
    </div>
  )
}
