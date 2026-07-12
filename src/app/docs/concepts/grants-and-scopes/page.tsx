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
        A scope is the familiar OAuth unit — naming one capability. auth51 doesn&rsquo;t change what a
        scope <em>is</em>; it changes how tightly a token is held to one. An intent token is minted for
        exactly the scope its single action needs, drawn from what the grant allows. Scopes come in two
        namespaces — <code className="code-inline">mcp:tool:*</code> for &ldquo;may this agent invoke this
        tool&rdquo; and <code className="code-inline">a51:rs:*</code> for &ldquo;may this token perform this
        resource operation&rdquo; — assembled from your{' '}
        <a href="/docs/concepts/capabilities">capability surface</a>. A grant draws on both.
      </P>

      <H2>The grant: base and step-up</H2>
      <P>
        A grant has two tiers. The <strong>base scopes</strong> are what the agent may mint freely.
        A smaller set of <strong>step-up scopes</strong> are ones it can reach only after an explicit
        escalation — the higher-privilege actions you want gated behind an approval rather than
        available by default. Ask for a base scope and the mint proceeds if it&rsquo;s in the grant; ask
        for a step-up scope without an approved escalation and the mint is refused.
      </P>

      <H2>How a grant is derived</H2>
      <P>
        You don&rsquo;t write a grant by hand. When an agent registers, the Authority derives one from
        its declared surface — the tools it ships with and the servers it&rsquo;s pointed at — and tiers
        every scope by risk. Three things happen:
      </P>
      <ul className="my-5 space-y-3 text-[14px] text-c-text-2">
        <li>
          <strong className="text-c-text">In-process tools are auto-granted.</strong> A function the
          agent ships with is part of its <a href="/docs/concepts/agent-identity">identity</a>, so its
          tool scope goes straight into the grant.
        </li>
        <li>
          <strong className="text-c-text">MCP tools are inferred, not assumed.</strong> A rented tool
          isn&rsquo;t granted just because it&rsquo;s installed. auth51 reads the agent&rsquo;s system prompt and
          admits the tools its stated purpose actually implies (a deterministic match — no model in the
          loop), leaving the rest for later. You can switch this to grant nothing by default and let the
          grant grow only through escalation.
        </li>
        <li>
          <strong className="text-c-text">Endpoint scopes ride along.</strong> For the tools that made
          it into the envelope, the resource-endpoint (<code className="code-inline">a51:rs:*</code>)
          scopes they map to are unioned in too — so the grant bounds the <em>effects</em>, not just the
          tool calls.
        </li>
      </ul>
      <P>
        Each scope then lands in a tier by its risk: reversible operations become base scopes; a
        destructive one — a delete, a payment, a drop — becomes a step-up scope, gated behind approval.
        Later, a <strong>just-in-time escalation</strong> can add a scope to the envelope for a bounded
        window and then expire, so a one-off need doesn&rsquo;t permanently widen the grant.
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
        { href: '/docs/concepts/capabilities', label: 'Capabilities & the surface' },
        { href: '/docs/concepts/workflows', label: 'Workflows & steps' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
      ]} />
    </article>
  )
}
