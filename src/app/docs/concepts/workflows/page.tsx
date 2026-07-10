import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { WorkflowStepsDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Workflows & steps',
  description:
    'A registered workflow is an ordered plan of steps, each with its own scopes, prerequisites, and approval gates. The authority checks the step against the plan before it mints.',
}

export default function Workflows() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Workflows &amp; steps</PageTitle>

      <Lead>
        A grant says <em>what</em> an agent may do. A workflow says <em>in what order</em>, and
        <em> under what conditions</em>. It&rsquo;s the structure that lets a multi-step agent plan be
        authorized step by step — so a run can&rsquo;t skip ahead, jump a gate, or claim a scope the plan
        never gave a given step.
      </Lead>

      <H2>A workflow is a registered plan</H2>
      <P>
        Where a single tool call is one action, a workflow is the sequence they add up to — scan a
        manifest, plan a patch, open a PR. You register the plan with the Authority up front: its
        steps, the scopes each step needs, the dependencies between them, and any approval gates.
        Once registered, a run that declares it&rsquo;s executing that workflow is held to the plan.
      </P>

      <Figure n={1} caption={<>A workflow&rsquo;s steps, each with its own scopes. Step 3 is privileged and sits behind an approval gate; the authority won&rsquo;t mint for it until its prerequisites are complete and the gate has passed.</>}>
        <WorkflowStepsDiagram />
      </Figure>

      <H2>What the Authority checks per step</H2>
      <P>
        When a request names a workflow and a step, the mint becomes a check against the plan. The
        Authority confirms the step&rsquo;s <strong>prerequisites</strong> are complete, that any{' '}
        <strong>approval gate</strong> on the step has been passed, and that the step is only claiming
        the <strong>scopes</strong> its definition granted it. A step can&rsquo;t run before the steps it
        depends on, and it can&rsquo;t reach for authority the workflow didn&rsquo;t give it.
      </P>

      <Callout>
        Workflow tracking is optional per agent. With it off, an agent is still bounded by its grant;
        with it on, it&rsquo;s additionally bounded by the plan — prerequisites, gates, and per-step
        scopes. It&rsquo;s the difference between &ldquo;may do these things&rdquo; and &ldquo;may do these things, in this
        order, once these conditions hold.&rdquo;
      </Callout>

      <H2>Steps carry into the token</H2>
      <P>
        The current <code className="code-inline">workflow_id</code> and{' '}
        <code className="code-inline">workflow_step</code> ride inside the intent token&rsquo;s{' '}
        <code className="code-inline">intent</code> object, alongside a hash of the steps completed
        so far (<code className="code-inline">step_sequence_hash</code>). That means a resource server
        can independently see which step it&rsquo;s serving and detect a skipped one — the plan isn&rsquo;t only
        enforced at mint, it&rsquo;s carried on the wire.
      </P>

      <Deep title="Where workflow definitions come from — and the scaling tradeoff">
        <P>
          Registering a workflow is a governance action: only authenticated administrators should be
          able to create or change one, and definitions should be validated for safety — no cycles in
          the step graph, sensible scope restrictions per step, approval gates on high-privilege
          steps. The Authority holds the workflow registry the same way it holds the agent registry.
        </P>
        <P className="!mb-0">
          There&rsquo;s an honest tradeoff: every new workflow has to be registered, which is more
          governance surface than plain OAuth. The mitigation is automation — workflows can be
          inferred from an agent&rsquo;s source and tools and registered from CI/CD, rather than authored by
          hand. <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §9.3</SpecRef>
        </P>
      </Deep>

      <InTheWild title="Skipping the approval step">
        A recurring business-logic failure: a multi-step process where an actor jumps straight to the
        privileged step, skipping the review or payment-authorization step before it. Workflow
        validation is the backstop — the privileged step&rsquo;s prerequisites aren&rsquo;t met and its gate
        hasn&rsquo;t passed, so the Authority won&rsquo;t mint a token for it, no matter what the agent decides.
      </InTheWild>

      <Related items={[
        { href: '/docs/concepts/delegation', label: 'Delegation & chains' },
        { href: '/docs/concepts/grants-and-scopes', label: 'Grants & scopes' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
      ]} />
    </article>
  )
}
