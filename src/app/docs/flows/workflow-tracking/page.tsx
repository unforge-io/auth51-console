import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { WorkflowStepsDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Workflow tracking flow',
  description:
    'How the runtime follows a multi-step plan as it executes, tracking the step sequence and delegation so every mint reflects where the run actually is.',
}

export default function WorkflowTrackingFlow() {
  return (
    <article>
      <PageTitle eyebrow="Protocol flows">Workflow tracking</PageTitle>

      <Lead>
        Minting checks one action at a time. Workflow tracking is what gives each of those checks its
        context: as the agent works through a plan, the runtime keeps count of where it is, so the
        step and sequence it presents at mint are the real ones, not something the agent could assert
        after the fact.
      </Lead>

      <H2>The runtime keeps the state</H2>
      <P>
        As an agent executes, the runtime observes each tool call and maintains the current{' '}
        <strong>workflow state</strong>: which step is running, which steps have completed, and the
        delegation context so far. It does this by instrumenting the agent&rsquo;s tools at startup, so the
        tracking rides along with execution rather than depending on the agent to report its own
        progress.
      </P>

      <Figure n={1} caption={<>The plan the tracking follows. Each step&rsquo;s completion updates the sequence the runtime carries; the privileged step won&rsquo;t mint until its prerequisites are recorded complete and its gate has passed.</>}>
        <WorkflowStepsDiagram />
      </Figure>

      <H2>State becomes part of the mint</H2>
      <P>
        When a tool call turns into a resource call, the current workflow state and delegation context
        become part of the mint request. The Authority validates the step against the registered plan
        (prerequisites complete, gate passed, scope in bounds) before it issues a token. So the plan is
        enforced against the run&rsquo;s <em>actual</em> position, tracked
        independently of anything the agent claims.
      </P>

      <Callout>
        The tracked sequence is also hashed into the token as{' '}
        <code className="code-inline">step_sequence_hash</code>, so a resource server can detect a
        skipped step on its own. The plan is carried on the wire, not only checked at the Authority.
      </Callout>

      <Deep title="How the tracking is injected, and why it’s language-agnostic">
        <P>
          At startup the runtime identifies each agent&rsquo;s tools and wraps them, creating tracking
          wrappers around the tool functions so that invoking a tool updates workflow state as a side
          effect. The technique is generic: it&rsquo;s wrapper functions in Python, the same idea
          via interceptors or aspects elsewhere, so nothing about the tracking is tied to one framework.
        </P>
        <P className="!mb-0">
          Tracking can be turned off, at the cost of losing the workflow-level guarantees. Leaving it
          optional keeps adoption incremental. There&rsquo;s a real tradeoff: it adds a little in-memory
          bookkeeping per call, with no external round-trip, so the runtime overhead is small.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §6</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/flows/multi-agent', label: 'Next: multi-agent delegation' },
        { href: '/docs/concepts/workflows', label: 'Concept: workflows & steps' },
        { href: '/docs/architecture/client-runtime', label: 'Architecture: the runtime that tracks' },
      ]} />
    </article>
  )
}
