import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Contracts',
  description:
    'The generated wire types every client consumes, derived from the Authority’s own schemas, so a consumer’s types can never drift from what the Authority actually serves.',
}

export default function Contracts() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Contracts</PageTitle>

      <Lead>
        Contracts is the least glamorous component and one of the most important: it&rsquo;s the single
        source of truth for what goes on the wire. Every client&rsquo;s request and response types are
        generated from the Authority&rsquo;s own schemas, so a consumer cannot drift from what
        the Authority serves.
      </Lead>

      <H2>The problem it removes</H2>
      <P>
        In a multi-component system, the fastest way to break things is to let each client hand-guess
        the shape of a request. One consumer assumes a field name the Authority renamed, another
        misses a required parameter, and you get the class of bug that only shows up at runtime, in
        integration, against the real server. Contracts makes that category structurally impossible.
      </P>

      <H2>How it works</H2>
      <P>
        The Authority defines its API with typed models. Those models are introspected into a
        canonical <code className="code-inline">openapi.json</code> (pure schema, no database, no
        deployment needed), which is committed as the contract. From that, typed client definitions
        are generated, with friendly aliases layered on top for consumers to import. Because the
        types are <em>derived</em> from the deployed models rather than written alongside them, a
        generated client can&rsquo;t diverge from what the Authority actually serves.
      </P>

      <Callout>
        Consumers import generated types; they never edit them. Regenerating from a fresh{' '}
        <code className="code-inline">openapi.json</code> is the only way the wire shape changes. Drift
        can&rsquo;t creep in by hand.
      </Callout>

      <Deep title="Who consumes it, and why it’s a component at all">
        <P>
          The generated contract is consumed by the TypeScript-side components (the{' '}
          <a href="/docs/architecture/mcp-proxy">MCP proxy</a>, the Node runtime, and the{' '}
          <a href="/docs/architecture/verifier">verifier</a>), so their view of a mint request or an
          error response can never fall out of step with the Authority&rsquo;s.
        </P>
        <P className="!mb-0">
          It earns a place in the architecture because it enforces an invariant the running system
          depends on: one definition of the wire, owned by the server, mechanically propagated to
          every client. It is the same instinct as the <a href="/docs/architecture/checksum">checksum
          engine</a> (shared code that guarantees two sides agree), applied to the API surface instead
          of the identity algorithm.
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/architecture/authority', label: 'Authority: the source of the schema' },
        { href: '/docs/architecture', label: 'Back to Architecture' },
        { href: '/docs/reference', label: 'Reference: API (coming)' },
      ]} />
    </article>
  )
}
