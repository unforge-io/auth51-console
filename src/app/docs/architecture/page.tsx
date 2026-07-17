import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, H2, P, Deep, Figure, Related } from '@/components/docs/prose'
import { SystemMapDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'The Auth51 components—Authority, client runtime, MCP proxy, Discovery, verifier, checksum engine, and contracts—and their Zero-Trust roles.',
}

const COMPONENTS = [
  { href: '/docs/architecture/authority', title: 'Authority', role: 'PDP · trust root',
    body: 'The adaptive identity provider. It holds the agent and workflow registries, mints intent tokens, publishes keys, and re-verifies each checksum at mint.' },
  { href: '/docs/architecture/client-runtime', title: 'Client runtime', role: 'PEP · in-process',
    body: 'The in-process enforcement point. It observes agent egress, derives identity, and mints and attaches the intent token on the governed path.' },
  { href: '/docs/architecture/mcp-proxy', title: 'MCP proxy', role: 'PEP · tool boundary',
    body: 'A proxy placed in front of an MCP server. It inspects tool calls, blocks out-of-scope or destructive actions, and writes an append-only audit trail.' },
  { href: '/docs/architecture/discovery', title: 'Discovery service', role: 'staging',
    body: 'The staging channel for unregistered agents. It holds the observed prompt and tools for review while keeping that content out of the Authority.' },
  { href: '/docs/architecture/verifier', title: 'Verifier', role: 'PEP · resource side',
    body: 'Resource-server middleware that verifies the token signature and DPoP binding without maintaining session state. It remains compatible with plain OAuth resource servers.' },
  { href: '/docs/architecture/checksum', title: 'Checksum engine', role: 'shared library',
    body: 'The byte-identical identity algorithm that runs on both sides of the trust boundary, allowing an agent to be verified without a self-declared identity.' },
  { href: '/docs/architecture/contracts', title: 'Contracts', role: 'wire source of truth',
    body: 'Generated wire types derived from the Authority schemas, keeping consumers aligned with the API the Authority serves.' },
]

export default function ArchitectureIndex() {
  return (
    <div>
      <PageTitle eyebrow="Architecture">Architecture</PageTitle>
      <Lead>
        Auth51 consists of a small set of components with distinct responsibilities. Those
        components map to the Zero-Trust roles defined in{' '}
        <Link href="/docs/foundations/zero-trust" className="text-c-accent-2 hover:underline">SP 800-207</Link>.
        This page provides the system map; the linked pages describe each component in detail.
      </Lead>

      <Figure n={1} caption={<>The runtime topology. Control-plane calls for minting, proposing identities, and fetching keys are shown with faint lines. The accent line shows the data-plane call from the agent to the resource with its intent token. The checksum engine runs identically on the client and Authority.</>}>
        <SystemMapDiagram />
      </Figure>

      <H2>Two planes, one trust root</H2>
      <P>
        The diagram separates the system into two planes. The <strong>control plane</strong> includes
        the interactions that support authorization decisions: the client runtime requesting a
        token from the Authority, an unregistered agent&rsquo;s content going to Discovery, and a
        resource server fetching verification keys. The <strong>data plane</strong> is the request
        from the agent to a resource with an intent token. The Authority acts as the trust root but
        does not sit on this data path, so resource requests do not pass through it.
      </P>

      <H2>Zero-Trust roles</H2>
      <P>
        The <Link href="/docs/architecture/authority" className="text-c-accent-2 hover:underline">Authority</Link>{' '}
        is the Policy Decision Point. The{' '}
        <Link href="/docs/architecture/client-runtime" className="text-c-accent-2 hover:underline">client runtime</Link>{' '}
        and the <Link href="/docs/architecture/verifier" className="text-c-accent-2 hover:underline">verifier</Link>{' '}
        are Policy Enforcement Points on opposite sides of the request. The client runtime proves
        identity and intent at the source, while the verifier checks them independently at the
        resource. The{' '}
        <Link href="/docs/architecture/mcp-proxy" className="text-c-accent-2 hover:underline">MCP proxy</Link>{' '}
        is a third enforcement point for the tool boundary.
      </P>

      <Deep title="Which components are on the request path, and which aren’t">
        <P>
          Three components can touch a live request: the client runtime or MCP proxy at the source,
          and the verifier at the resource. The Authority is consulted when a token is minted, not
          on each downstream hop. Discovery remains outside the request path and receives an
          unregistered agent&rsquo;s content out of band.
        </P>
        <P className="!mb-0">
          The <Link href="/docs/architecture/checksum" className="text-c-accent-2 hover:underline">checksum engine</Link>{' '}
          and <Link href="/docs/architecture/contracts" className="text-c-accent-2 hover:underline">contracts</Link>{' '}
          are shared code rather than services. The checksum engine keeps identity computation
          identical on both sides, while the generated contracts keep client types aligned with
          the Authority API.
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
        { href: '/docs/foundations/zero-trust', label: 'Foundations: Zero-Trust alignment' },
        { href: '/docs/concepts', label: 'Concepts: the objects these components move' },
        { href: '/docs/reference', label: 'Reference: standards & spec' },
      ]} />
    </div>
  )
}
