import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, Callout, InTheWild, Related } from '@/components/docs/prose'
import { DiscoveryBoundaryDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Discovery & the trust boundary',
  description:
    'How an unregistered agent surfaces for review — without its prompt or tools ever entering the authority. Content and references travel separate paths.',
}

export default function Discovery() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Discovery &amp; the trust boundary</PageTitle>

      <Lead>
        You won&rsquo;t register every agent up front, and you shouldn&rsquo;t have to. Someone spins up
        a new agent, a script gets copied, a prompt changes. auth51&rsquo;s job is to notice the ones
        you haven&rsquo;t approved and put them in front of you — without quietly trusting them, and
        without your prompts ending up somewhere they shouldn&rsquo;t.
      </Lead>

      <Foundations title="Why the authority is kept blind on purpose">
        <p>
          It&rsquo;s a long-standing security principle — <em>data minimization</em>, and least privilege
          applied to components: the part of a system that holds the keys and mints the credentials
          should see as little as it can get away with. In auth51 that part is the{' '}
          <strong>authority</strong>. An agent&rsquo;s system prompt is often its most sensitive asset, so
          the authority is designed never to receive one for an agent you haven&rsquo;t approved.
        </p>
        <p>
          There&rsquo;s an OAuth parallel. Just as a client formally enters an authorization server through
          <a href="https://www.rfc-editor.org/rfc/rfc7591" target="_blank" rel="noreferrer"> Dynamic Client
          Registration (RFC&nbsp;7591)</a> — a deliberate, sanctioned step — an agent&rsquo;s identity enters
          the trusted core only through registration. Discovery is what happens <em>before</em> that
          step: visibility without trust.
        </p>
      </Foundations>

      <H2>What happens when an unknown agent runs</H2>
      <P>
        The client identifies agents at the model call by matching their checksum against the
        ones your org has registered. When nothing matches, two things happen, on two separate
        paths:
      </P>
      <P>
        First, the client sends a <em>proposal</em> to the discovery service — the agent&rsquo;s
        observed identity: its system prompt, its tools, and the computed checksum. Second,
        when the agent tries to take a governed action, the mint is denied (it&rsquo;s not a
        registered agent) and the authority records a <em>reference</em>: just the agent id and
        the checksum, nothing more.
      </P>
      <P>
        In the console those two meet again, joined by checksum, under{' '}
        <span className="text-c-text font-medium">Agents → Discovered</span>. You see the agent,
        read the prompt it was actually running, and click Register. From its next run on, it&rsquo;s
        recognized.
      </P>

      <H2>The trust boundary: content and references travel apart</H2>
      <P>
        This is the part worth understanding. The authority — the component that mints tokens
        and holds your keys — never receives an agent&rsquo;s prompt or tools until you approve it.
        All it ever sees for an unregistered agent is a reference: an id and a checksum. The
        content lives in the discovery service, a separate component, and stays there for your
        review.
      </P>

      <Figure n={1} caption={<>An unregistered agent&rsquo;s full identity goes only to the discovery service. Only a reference — id and checksum — crosses into the trusted core, so the authority never holds a prompt you haven&rsquo;t approved.</>}>
        <DiscoveryBoundaryDiagram />
      </Figure>

      <P>
        Approval is the one path that moves content into the authority, and it&rsquo;s a deliberate
        human action: clicking Register runs the normal registration, which is the sanctioned
        way for a prompt and tool set to enter the trusted core. Nothing an unregistered agent
        emitted gets there on its own.
      </P>

      <Deep title="Why a checksum is enough to join the two halves">
        <P>
          The two paths never share the prompt, yet the console still lines them up. That works because
          the checksum is a deterministic fingerprint of the agent&rsquo;s identity (see agent identity): the
          client computes the same value the authority recorded as a reference, and the discovery service
          stores the full identity under that same value.
        </P>
        <P className="!mb-0">
          So the join key is a hash both sides arrive at independently — not a shared copy of the
          sensitive content. The authority learns &ldquo;an unregistered agent with checksum{' '}
          <code className="code-inline">a7f3…</code> tried to act,&rdquo; and the console can show you what
          that checksum <em>is</em> by looking it up in discovery — without the prompt ever passing
          through the authority.
        </P>
      </Deep>

      <Callout kind="warning">
        Discovery is not permission. An unregistered agent&rsquo;s governed calls are denied the
        whole time it sits in the Discovered list — fail-closed. Discovery makes the agent
        <em> visible and easy to approve</em>; it never makes it trusted.
      </Callout>

      <InTheWild title="Shadow agents">
        The version of shadow IT that&rsquo;s coming: agents nobody registered, running with real
        credentials, calling real systems. You can&rsquo;t govern what you can&rsquo;t see. Discovery&rsquo;s
        first job is to end the &ldquo;you can&rsquo;t see it&rdquo; part — every agent that runs shows up,
        with the exact identity it presented.
      </InTheWild>

      <Related items={[
        { href: '/docs/concepts/agent-identity', label: 'Agent identity' },
        { href: '/docs/start', label: 'Quickstart — watch an agent get discovered' },
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
      ]} />
    </article>
  )
}
