import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, H2, P, Deep, Figure, Related } from '@/components/docs/prose'
import { SystemMapDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'The auth51 system as a set of components — Authority, client runtime, MCP proxy, discovery, verifier, checksum, contracts — and how they map onto Zero-Trust roles.',
}

const COMPONENTS = [
  { href: '/docs/architecture/authority', title: 'Authority', role: 'PDP · trust root',
    body: 'The adaptive IDP. Holds the agent and workflow registries, mints intent tokens, publishes keys, and re-verifies every checksum at mint.' },
  { href: '/docs/architecture/client-runtime', title: 'Client runtime', role: 'PEP · in-process',
    body: 'The embedded enforcement point. Sees all agent egress, derives identity, mints and attaches the intent token — the durable, unbypassable path.' },
  { href: '/docs/architecture/mcp-proxy', title: 'MCP proxy', role: 'PEP · tool boundary',
    body: 'Drops in front of any MCP server. Inspects every tool call, blocks out-of-scope or destructive actions, and writes an append-only audit trail.' },
  { href: '/docs/architecture/discovery', title: 'Discovery service', role: 'staging',
    body: 'The staging channel for unregistered agents. Holds observed prompt + tools so the console can review and approve — keeping content out of the Authority.' },
  { href: '/docs/architecture/verifier', title: 'Verifier', role: 'PEP · resource side',
    body: 'Resource-server middleware. Verifies the token signature and DPoP binding statelessly, backward-compatible with plain OAuth resource servers.' },
  { href: '/docs/architecture/checksum', title: 'Checksum engine', role: 'shared library',
    body: 'The single, byte-identical identity algorithm run on both sides of the trust boundary. The reason a client can verify an agent without it self-declaring.' },
  { href: '/docs/architecture/contracts', title: 'Contracts', role: 'wire source of truth',
    body: 'The generated wire types every client consumes, derived from the Authority’s own schemas so a consumer can’t drift from what the Authority serves.' },
]

export default function ArchitectureIndex() {
  return (
    <div>
      <PageTitle eyebrow="Architecture">Architecture</PageTitle>
      <Lead>
        auth51 is a small set of components, each with one job, wired into the Zero-Trust roles
        from <Link href="/docs/foundations/zero-trust" className="text-c-accent-2 hover:underline">SP 800-207</Link>.
        This page is the map; each component below has its own page with the detail.
      </Lead>

      <Figure n={1} caption={<>The runtime topology. Control-plane calls (mint, propose, fetch keys) are faint; the single data-plane call — agent to resource, carrying the intent token — is the accent line. The checksum engine runs identically on both sides.</>}>
        <SystemMapDiagram />
      </Figure>

      <H2>Two planes, one trust root</H2>
      <P>
        Read the diagram as two planes. The <strong>control plane</strong> is everything that
        decides: the client runtime asking the Authority to mint, an unregistered agent&rsquo;s content
        going to discovery, a resource server fetching keys. The <strong>data plane</strong> is the
        one call that does real work — the agent hitting a resource with an intent token. The
        Authority (the trust root) makes decisions but never sits on the data path, so it can&rsquo;t
        become a bottleneck or a single point of interception.
      </P>

      <H2>Every box is a Zero-Trust role</H2>
      <P>
        The <Link href="/docs/architecture/authority" className="text-c-accent-2 hover:underline">Authority</Link>{' '}
        is the Policy Decision Point. The{' '}
        <Link href="/docs/architecture/client-runtime" className="text-c-accent-2 hover:underline">client runtime</Link>{' '}
        and the <Link href="/docs/architecture/verifier" className="text-c-accent-2 hover:underline">verifier</Link>{' '}
        are Policy Enforcement Points on opposite sides of the call — one proves identity and intent
        at the source, the other re-verifies independently at the resource. The{' '}
        <Link href="/docs/architecture/mcp-proxy" className="text-c-accent-2 hover:underline">MCP proxy</Link>{' '}
        is a third enforcement point for the tool boundary.
      </P>

      <Deep title="Which components are on the request path, and which aren’t">
        <P>
          Only three components touch a live request: the client runtime (or MCP proxy) at the
          source, and the verifier at the resource. The Authority is consulted at mint time, not on
          every downstream hop. Discovery is off the request path entirely — it only ever sees an
          unregistered agent&rsquo;s content, out of band.
        </P>
        <P className="!mb-0">
          The <Link href="/docs/architecture/checksum" className="text-c-accent-2 hover:underline">checksum engine</Link>{' '}
          and <Link href="/docs/architecture/contracts" className="text-c-accent-2 hover:underline">contracts</Link>{' '}
          aren&rsquo;t services at all — they&rsquo;re shared code. The checksum engine guarantees both sides
          compute identity identically; contracts guarantee every client&rsquo;s types match what the
          Authority actually serves.
        </P>
      </Deep>

      <ul className="mt-10 space-y-3">
        {COMPONENTS.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="group block rounded-xl border border-c-border bg-c-surface p-4 no-underline hover:border-c-accent/50 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold text-c-text">{c.title}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-c-text-3 border border-c-border rounded px-1.5 py-0.5 shrink-0">{c.role}</span>
              </div>
              <p className="mt-1 text-[13px] text-c-text-2 leading-relaxed">{c.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Related items={[
        { href: '/docs/foundations/zero-trust', label: 'Foundations — Zero-Trust alignment' },
        { href: '/docs/concepts', label: 'Concepts — the objects these components move' },
        { href: '/docs/reference', label: 'Reference — standards & spec' },
      ]} />
    </div>
  )
}
