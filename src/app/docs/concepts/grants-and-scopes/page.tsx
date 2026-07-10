import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { NonAmplificationDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Grants & scopes',
  description:
    'A grant is the ceiling on what an agent may mint tokens for — base scopes plus a smaller set of step-up scopes — set at registration and enforced at mint.',
}

export default function GrantsAndScopes() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Grants &amp; scopes</PageTitle>

      <Lead>
        Every registered agent carries a <em>grant</em>: the fixed envelope of authority it&rsquo;s
        allowed to draw on. Scopes describe individual permissions; the grant is the set of them an
        agent may ever mint a token for. It&rsquo;s the ceiling — and it&rsquo;s checked every single time,
        at mint, not audited afterward.
      </Lead>

      <H2>Scopes: one permission each</H2>
      <P>
        A scope is the familiar OAuth unit — <code className="code-inline">repo:write</code>,
        <code className="code-inline"> vulnerability:read</code>, <code className="code-inline">payment:charge</code>{' '}
        — naming one capability against one audience. auth51 doesn&rsquo;t change what a scope <em>is</em>;
        it changes how tightly a token is held to one. An intent token is minted for exactly the
        scope its single action needs, drawn from what the grant allows.
      </P>

      <H2>The grant: base and step-up</H2>
      <P>
        A grant has two tiers. The <strong>base scopes</strong> are what the agent may mint freely.
        A smaller set of <strong>step-up scopes</strong> are ones it can reach only after an explicit
        escalation — the higher-privilege actions you want gated behind an approval rather than
        available by default. Ask for a base scope and the mint proceeds if it&rsquo;s in the grant; ask
        for a step-up scope without an approved escalation and the mint is refused.
      </P>

      <Figure n={1} caption={<>A grant is a ceiling. Down a delegation chain each agent mints against its own grant, and authority only ever narrows — a derived token is a subset, never a superset.</>}>
        <NonAmplificationDiagram />
      </Figure>

      <H2>Enforced at mint, held by the Authority</H2>
      <P>
        The grant is set when you register the agent and lives in the Authority&rsquo;s{' '}
        <code className="code-inline">/grants</code> surface. When the agent asks to mint, the request
        must fall inside the grant or it&rsquo;s denied — there is no path by which an agent mints a token
        for a scope it wasn&rsquo;t granted. That&rsquo;s the mechanism behind{' '}
        <a href="/docs/concepts/non-amplification">non-amplification</a>: because every agent is
        bounded by its own grant at mint time, no hand-off can manufacture authority.
      </P>

      <Callout>
        Grants roll out in two modes. A fresh grant starts in <code className="code-inline">observe</code>:
        the Authority logs what it <em>would</em> deny but lets the call through, so turning auth51 on
        never breaks a working app. You move a grant to <code className="code-inline">enforce</code>{' '}
        when you&rsquo;re ready for it to block. Enforcement is real — it&rsquo;s just opt-in per agent so
        adoption is safe.
      </Callout>

      <Deep title="How a customer key’s envelope relates to an agent’s grant">
        <P>
          A customer&rsquo;s API key carries its own scope envelope — the outer bound of everything that
          key is entitled to. An individual agent&rsquo;s grant is a subset of that envelope: registering
          an agent can only ever carve out authority the key already has, never exceed it. The two
          nest, so the key bounds the org and the grant bounds the agent.
        </P>
        <P className="!mb-0">
          When a run follows a registered workflow, a third bound applies on top: the workflow&rsquo;s
          per-step scopes. A step can only claim what <em>all three</em> — key, grant, and workflow
          step — permit. See <a href="/docs/concepts/workflows">workflows &amp; steps</a>.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §4.3</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/workflows', label: 'Workflows & steps' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
      ]} />
    </article>
  )
}
