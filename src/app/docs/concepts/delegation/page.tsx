import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { DelegationChainDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Delegation & chains',
  description:
    'When one agent hands work to another, the delegation path is hashed into the token and validated at mint, so a resource server can tell who really acted, and a tampered chain is caught.',
}

export default function Delegation() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Delegation &amp; chains</PageTitle>

      <Lead>
        Agents delegate: a supervisor hands a step to a planner, a planner to a worker. The
        question every resource server should be able to answer is &ldquo;who really acted, and through
        whom?&rdquo; auth51 makes that answer part of the token: the delegation path is recorded, hashed,
        and checked, so the chain can&rsquo;t be forged or quietly rewritten.
      </Lead>

      <H2>The delegation assertion</H2>
      <P>
        When a call happens inside a multi-agent run, the intent token carries a{' '}
        <em>delegation assertion</em>: the record of the path that led to this action. It names the
        workflow and step being executed and the agent executing it, and it carries an ordered,
        hashed representation of every agent that participated on the way here. It&rsquo;s what turns &ldquo;a
        token from some agent&rdquo; into &ldquo;a token from <em>this</em> agent, reached through <em>this</em>{' '}
        path.&rdquo;
      </P>

      <Figure n={1} caption={<>The ordered delegation path is hashed into the token. A resource server can recompute it to detect a tampered or reordered chain without calling back to the authority.</>}>
        <DelegationChainDiagram />
      </Figure>

      <H2>Hashed so it can&rsquo;t be rewritten</H2>
      <P>
        The chain of agent ids is joined in order and hashed into a compact{' '}
        <code className="code-inline">delegation_chain</code> value carried in the token. Completed
        workflow steps are hashed the same way into <code className="code-inline">step_sequence_hash</code>.
        Because the hash is over the ordered path, altering who delegated to whom, or reordering the
        hops, changes the value, and a resource server that recomputes it will see the mismatch,
        without calling anyone.
      </P>

      <H2>What the Authority validates at mint</H2>
      <P>
        Before it mints for a delegated call, the Authority checks the path is real: every agent
        named in the chain is registered, the chain represents a delegation each parent actually
        authorized, and the requesting agent is the last link in it. A chain that names an
        unregistered agent, or claims a hop no parent authorized, or puts the requester somewhere
        other than the end, is refused.
      </P>

      <InTheWild title="Hiding behind a borrowed chain">
        The attack this closes is a delegation forged to launder origin: an agent asserting a chain
        that makes its action look like it came down a legitimate path it was never part of.
        Manipulating delegation claims to disguise the true origin of an action is a known
        repudiation risk; binding the chain into the token and validating it at mint is what makes
        the true path non-repudiable.
      </InTheWild>

      <Deep title="Depth limits and chain-wide revocation">
        <P>
          Two operational safeguards ride along with the chain. Delegation <strong>depth is bounded</strong>{' '}
          so a run can&rsquo;t spawn an unbounded tower of sub-agents to dilute accountability. And the
          Authority keeps a server-side record of chains, so if a parent agent is found compromised,
          <strong> every token in the chain beneath it can be revoked at once</strong> rather than one
          at a time.
        </P>
        <P className="!mb-0">
          The relationship to the two neighboring concepts: the chain is <em>consistent with</em> the
          registered <a href="/docs/concepts/workflows">workflow</a>, and each hop still mints against
          its own <a href="/docs/concepts/grants-and-scopes">grant</a>, which is why a delegated call
          can never end up with more authority than its origin, the rule called{' '}
          <a href="/docs/concepts/non-amplification">non-amplification</a>.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §4.3.4 · §9.3</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/concepts/workflows', label: 'Workflows & steps' },
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
      ]} />
    </article>
  )
}
