import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, SpecRef, Callout, InTheWild, Related } from '@/components/docs/prose'
import { NonAmplificationDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Non-amplification',
  description:
    'An agent can never mint more authority than its grant allows. The grant is the ceiling, enforced at the authority when a token is minted.',
}

export default function NonAmplification() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Non-amplification</PageTitle>

      <Lead>
        Agents delegate. A planner hands a step to a worker; a worker calls a tool that calls
        another service. The risk in any hand-off is that authority quietly grows along the
        way — the worker ends up able to do more than the planner was ever allowed to. auth51&rsquo;s
        answer is a rule with a plain name: authority can go down a chain, never up.
      </Lead>

      <Foundations title="The old problem this is a new name for">
        <p>
          This is the <strong>confused deputy</strong>, a failure mode identified in access-control
          research decades ago: a program with real privileges is tricked by a less-privileged caller
          into using those privileges on the caller&rsquo;s behalf. The authority that gets used is the
          deputy&rsquo;s, not the caller&rsquo;s — so privilege is effectively laundered upward.
        </p>
        <p>
          The classic mitigation is <em>least privilege</em> plus <em>attenuation</em>: authority may
          only ever be narrowed as it&rsquo;s passed along, never broadened. OAuth already has the mechanism
          for the narrowing half — <a href="/docs/reference">Token Exchange (RFC&nbsp;8693)</a> lets a
          holder trade a token for a <em>more constrained</em> one. auth51 makes attenuation the only
          direction that exists: every mint is checked against a ceiling, so a hop can shrink authority
          but never grow it.
        </p>
      </Foundations>

      <H2>The grant is the ceiling</H2>
      <P>
        Every registered agent has a <em>grant</em>: the set of scopes it may mint tokens for,
        plus a smaller set of <em>step-up</em> scopes it may reach only after an explicit
        escalation. When the agent asks the authority to mint a token, the request has to fall
        inside that grant. Ask for a scope outside it and the mint is refused. Ask for a
        step-up scope and you need an approved escalation first. The grant is set when you
        register the agent and enforced at mint time — not audited after the fact.
      </P>

      <Callout>
        Grants roll out in two modes. A freshly seeded grant starts in <code className="code-inline">observe</code>:
        the authority logs what it <em>would</em> deny but lets the call through, so turning
        auth51 on never breaks a working app. You move a grant to <code className="code-inline">enforce</code>{' '}
        when you&rsquo;re ready for it to start blocking. Enforcement is real; it&rsquo;s just opt-in per
        agent so adoption is safe.
      </Callout>

      <H2>Delegation can&rsquo;t widen the envelope</H2>
      <P>
        Because every agent is bounded by its own grant, a hand-off can&rsquo;t manufacture
        authority. A worker invoked by a planner still mints against the worker&rsquo;s grant, not
        the planner&rsquo;s. When a run follows a registered workflow, the authority also checks the
        step against the workflow definition — its declared scopes, its dependencies, and any
        approval gates — before it mints. A step can&rsquo;t claim scopes the workflow didn&rsquo;t give
        it, and it can&rsquo;t run before the steps it depends on have completed.
      </P>

      <Figure n={1} caption={<>Down a delegation chain, each agent mints against its own grant and the authority only narrows. The token that reaches a resource is a subset of every grant above it — never a superset.</>}>
        <NonAmplificationDiagram />
      </Figure>

      <Deep title="What the authority actually checks at each mint">
        <P>
          When a request carries a <code className="code-inline">delegation_context</code>, the authority
          validates the chain before it mints: every agent named in the chain is registered, the chain is
          a path each parent actually authorized, and the requesting agent is the last link.{' '}
          <SpecRef>draft-goswami-agentic-jwt §4.3.4</SpecRef>
        </P>
        <P>
          For a workflow run it adds step checks: prerequisite steps must be complete, approval gates for
          high-privilege steps must have been passed, and a step can only claim the scopes its workflow
          definition granted it — no skipping ahead, no widening.
        </P>
        <P className="!mb-0">
          Delegation depth is bounded to stop runaway chains, and if a parent agent is found compromised,
          the whole delegation chain beneath it can be revoked at once.{' '}
          <SpecRef>draft-goswami-agentic-jwt §9.3</SpecRef>
        </P>
      </Deep>

      <InTheWild title="The confused deputy">
        The classic failure: a low-privilege caller gets a high-privilege component to act for
        it, and the component&rsquo;s authority — not the caller&rsquo;s — is what gets used. Bounding
        every agent by its own grant, at the moment of minting, is what stops a delegation from
        laundering privilege it was never given.
      </InTheWild>

      <H2>Where this is headed</H2>
      <P>
        Today the ceiling is enforced per agent and per workflow step, which is what stops
        amplification in practice. The protocol draft goes further: a formal, checkable
        guarantee that a token derived across a hop is a strict subset of the one it came from,
        verifiable independently at each resource. That deeper cross-hop enforcement is being
        hardened alongside the verifier — the model is fixed; the machinery is landing.
      </P>

      <Related items={[
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
        { href: '/docs/concepts/mcp', label: 'MCP governance' },
        { href: '/docs/reference', label: 'Reference — the protocol draft' },
      ]} />
    </article>
  )
}
