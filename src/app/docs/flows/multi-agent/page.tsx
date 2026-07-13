import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { DelegationChainDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Multi-agent delegation flow',
  description:
    'The full path when a supervisor delegates to workers: each hop mints against its own grant, and the delegation chain is carried and checked end to end.',
}

export default function MultiAgentFlow() {
  return (
    <article>
      <PageTitle eyebrow="Protocol flows">Multi-agent delegation</PageTitle>

      <Lead>
        The hardest case, and the one auth51 was built for: a run that isn&rsquo;t one agent but several, with
        a supervisor planning, workers executing, and each calling tools. This flow puts the other three
        together and shows how authority stays bounded as work is handed down a chain.
      </Lead>

      <H2>The shape of a multi-agent run</H2>
      <P>
        A supervisor agent receives the goal and produces a plan; it delegates steps to worker agents,
        each with its own identity and its own grant. A worker does the actual tool call (read a repo,
        open a PR), and it&rsquo;s the worker, not the supervisor, that mints the intent token for that
        action. Every agent in the run is a distinct identity, registered separately, even though they
        share one client application.
      </P>

      <Figure n={1} caption={<>Each hop is a registered agent; the ordered path is hashed into the token so a resource server can detect a tampered or reordered chain without calling back.</>}>
        <DelegationChainDiagram />
      </Figure>

      <H2>Each hop mints against its own grant</H2>
      <P>
        This is what keeps a hand-off from manufacturing authority. A worker invoked by a supervisor
        mints against the <em>worker&rsquo;s</em> grant, not the supervisor&rsquo;s. If the worker&rsquo;s grant doesn&rsquo;t
        include the scope the action needs, the mint is denied. The supervisor can&rsquo;t lend authority it
        has but the worker doesn&rsquo;t. Authority flows down the chain and can only narrow, never widen.
      </P>

      <Callout>
        The mint request carries the <code className="code-inline">delegation_context</code>: the chain
        of parents and the steps completed so far. The Authority checks every agent in the chain is
        registered, the path was actually authorized, and the requester is its last link, before it
        mints.
      </Callout>

      <H2>The chain rides in the token</H2>
      <P>
        The token the worker gets carries the hashed delegation chain and step sequence. So the resource
        server on the far end doesn&rsquo;t just see &ldquo;a worker called&rdquo;. It sees the ordered path that led
        here, and can detect a tampered or reordered chain itself, without calling back to the Authority.
        Who asked and who acted are both recorded, and neither can be forged after the fact.
      </P>

      <InTheWild title="The low-privilege worker reaching up">
        The failure this closes is a low-privilege agent getting a higher-privilege one to act for it,
        so the powerful agent&rsquo;s authority, not the caller&rsquo;s, is what gets spent. Because every hop is
        bounded by its own grant at mint time, that laundering has no path: the privileged agent&rsquo;s grant
        governs its own mints, and the low-privilege caller can&rsquo;t borrow it.
      </InTheWild>

      <Deep title="How the four flows compose">
        <P>
          A multi-agent run is the other three flows layered: each agent was established in{' '}
          <a href="/docs/flows/registration">registration</a>; each action is a{' '}
          <a href="/docs/flows/minting">token mint</a>; and{' '}
          <a href="/docs/flows/workflow-tracking">workflow tracking</a> keeps the step sequence and
          delegation context current so each mint reflects the run&rsquo;s real position.
        </P>
        <P className="!mb-0">
          The guarantee that emerges, that a derived token is always a subset of the one it came from, is{' '}
          <a href="/docs/concepts/non-amplification">non-amplification</a>, enforced at every mint rather
          than audited after. <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §6.6</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/delegation', label: 'Concept: delegation & chains' },
        { href: '/docs/concepts/non-amplification', label: 'Concept: non-amplification' },
        { href: '/docs/flows', label: 'Back to Protocol flows' },
      ]} />
    </article>
  )
}
