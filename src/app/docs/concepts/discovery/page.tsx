import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Callout, InTheWild, Related } from '@/components/docs/prose'

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
      <P>
        Approval is the one path that moves content into the authority, and it&rsquo;s a deliberate
        human action: clicking Register runs the normal registration, which is the sanctioned
        way for a prompt and tool set to enter the trusted core. Nothing an unregistered agent
        emitted gets there on its own.
      </P>

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
