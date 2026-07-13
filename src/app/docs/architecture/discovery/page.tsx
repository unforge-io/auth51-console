import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, Related } from '@/components/docs/prose'
import { DiscoveryBoundaryDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Discovery service',
  description:
    'The staging channel for proposed agent registrations. It holds an unregistered agent’s observed prompt and tools so the console can review and approve, without that content ever entering the Authority.',
}

export default function DiscoveryService() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Discovery service</PageTitle>

      <Lead>
        Discovery is a separate service. When an agent runs that nobody registered, its
        observed identity has to go <em>somewhere</em> a human can review it. The last place you
        want an unapproved agent&rsquo;s prompt is inside the component that holds your keys. Discovery is
        that somewhere: a staging channel that keeps content out of the trust root.
      </Lead>

      <H2>What it stores, and what it doesn&rsquo;t</H2>
      <P>
        When the client runtime detects an agent whose checksum matches nothing registered, it
        pushes the <strong>content</strong> it observed (the system prompt, the tools, and the
        computed checksum) to discovery. That is all discovery holds: proposed identities awaiting
        review, keyed by checksum. It mints nothing, holds no keys, and makes no authorization
        decisions.
      </P>

      <Figure n={1} caption={<>Content and reference travel apart. The full identity goes only to discovery; the Authority sees just an id and checksum. The console joins them by checksum for review.</>}>
        <DiscoveryBoundaryDiagram />
      </Figure>

      <H2>How the two halves rejoin</H2>
      <P>
        Meanwhile the same agent&rsquo;s attempted mint reaches the Authority carrying only a{' '}
        <strong>reference</strong>: its id and checksum. The Authority denies it (fail-closed) and
        records a reference-only trigger. The console then joins the two: it reads the Authority&rsquo;s
        triggers and fetches the matching content from discovery by checksum, renders a review card,
        and on <span className="text-c-text font-medium">Approve</span> fires the real registration
        into the Authority. This is the one sanctioned path for content to cross into the trust root.
      </P>

      <Callout>
        The join key is a checksum both sides compute independently. It is not a shared copy of the
        sensitive prompt. The Authority learns &ldquo;an unregistered agent with this checksum tried to
        act&rdquo;; the console shows you what that checksum <em>is</em> by looking it up in discovery. The
        prompt never passes through the Authority.
      </Callout>

      <Deep title="Why a whole service for this">
        <P>
          It would be simpler to just let the Authority record the prompt of any agent it sees. That
          simplicity is the property you don&rsquo;t want: an agent&rsquo;s system prompt is often its
          most sensitive asset, and the trust root should hold as little as it can. Splitting content
          (discovery) from references (Authority) means an unapproved agent can be made{' '}
          <em>visible</em> for review without being made <em>present</em> in the component that matters
          most.
        </P>
        <P className="!mb-0">
          Discovery is where visibility-without-trust lives. Approval, a human action, is
          the only thing that moves an identity from staging into the registered set. See{' '}
          <a href="/docs/concepts/discovery">Discovery &amp; the trust boundary</a> for the concept, and{' '}
          <a href="/docs/architecture/authority">the Authority</a> for what registration writes.
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/discovery', label: 'Concept: Discovery & the trust boundary' },
        { href: '/docs/architecture/authority', label: 'Authority: where approval lands' },
        { href: '/docs/architecture/checksum', label: 'Checksum engine: the join key' },
      ]} />
    </article>
  )
}
