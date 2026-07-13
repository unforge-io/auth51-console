import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { NonAmplificationDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Grants & scopes',
  description:
    'A grant is the set of scopes an agent may mint tokens for: base scopes it uses freely, and step-up scopes that sit behind an approval. It is set at registration and checked on every mint.',
}

export default function GrantsAndScopes() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Grants &amp; scopes</PageTitle>

      <Lead>
        Every registered agent has a grant: the fixed set of scopes it is allowed to mint tokens for.
        A scope is one permission. The grant is a ceiling on what the agent can ask for, and the
        Authority checks every mint against it before issuing a token.
      </Lead>

      <H2>Scopes: one permission each</H2>
      <P>
        A scope is the familiar OAuth unit, naming one permission. auth51 does not change what a scope
        is. It changes how tightly a token is bound to one: each intent token is minted for the single
        scope its action needs, taken from what the grant allows. Scopes fall into two namespaces.
        <code className="code-inline">mcp:tool:*</code> answers whether an agent may invoke a tool.
        <code className="code-inline"> a51:rs:*</code> answers whether a token may perform a resource
        operation. Both are built from your <a href="/docs/concepts/capabilities">capability surface</a>,
        and a grant can hold either kind.
      </P>

      <H2>The grant: base and step-up</H2>
      <P>
        A grant has two tiers. Base scopes are the ones an agent may mint freely. Step-up scopes are
        ones it can reach only after an explicit escalation. Put the higher-privilege actions in the
        step-up tier so they sit behind an approval instead of being available by default. A request
        for a base scope succeeds if the scope is in the grant. A request for a step-up scope without
        an approved escalation is refused.
      </P>

      <H2>How a grant is derived</H2>
      <P>
        You do not write a grant by hand. When an agent registers, the Authority derives one from the
        tools the agent declares and the servers it points at, and sorts each scope by risk. Three
        things happen:
      </P>
      <ul className="my-5 space-y-3 text-[14px] text-c-text-2">
        <li>
          In-process tools are granted automatically. A function the agent ships with is part of its{' '}
          <a href="/docs/concepts/agent-identity">identity</a>, so its tool scope goes into the grant.
        </li>
        <li>
          MCP tools are inferred rather than assumed. A rented tool is not granted just because it is
          installed. auth51 reads the agent&rsquo;s system prompt and admits the tools its stated purpose
          implies, using a deterministic match with no model involved, and leaves the rest for later.
          You can switch this off so nothing is granted by default and the grant grows only through
          escalation.
        </li>
        <li>
          Endpoint scopes follow the tools. For the tools that made it into the grant, the{' '}
          <code className="code-inline">a51:rs:*</code> scopes they map to are added too, so the grant
          bounds the resource effects and not only the tool calls.
        </li>
      </ul>
      <P>
        Each scope then lands in a tier by its risk. Reversible operations become base scopes. A
        destructive one, such as a delete or a payment, becomes a step-up scope behind approval. A
        just-in-time escalation can add a scope for a bounded window and then expire, so a one-off need
        does not widen the grant permanently.
      </P>

      <Figure n={1} caption={<>A grant is a ceiling. Along a delegation chain, each agent mints against its own grant, so authority only narrows. A derived token is always a subset of the one it came from, never a superset.</>}>
        <NonAmplificationDiagram />
      </Figure>

      <H2>Enforced at mint, held by the Authority</H2>
      <P>
        The grant is set at registration and lives in the Authority&rsquo;s{' '}
        <code className="code-inline">/grants</code> surface. When an agent asks to mint, the request
        must fall inside its grant or the mint is denied. There is no path to a token for a scope the
        agent was not granted. This is what makes{' '}
        <a href="/docs/concepts/non-amplification">non-amplification</a> hold: every agent is bounded
        by its own grant at mint time, so no hand-off can produce authority that was not already there.
      </P>

      <Callout>
        Grants roll out in two modes. A new grant starts in <code className="code-inline">observe</code>:
        the Authority logs what it would have denied but lets the call through, so turning auth51 on
        does not break a working app. Move a grant to <code className="code-inline">enforce</code> when
        you are ready for it to block. Enforcement is per agent, so you can adopt it one agent at a time.
      </Callout>

      <Deep title="How a customer key’s envelope relates to an agent’s grant">
        <P>
          A customer&rsquo;s API key has its own scope envelope, the outer bound of what that key is
          entitled to. An agent&rsquo;s grant is a subset of that envelope. Registering an agent can only
          carve out authority the key already holds, never more. The key bounds the org and the grant
          bounds the agent.
        </P>
        <P className="!mb-0">
          When a run follows a registered workflow, a third bound applies: the workflow&rsquo;s per-step
          scopes. A step can claim only what all three allow, the key, the grant, and the workflow step.
          See <a href="/docs/concepts/workflows">workflows &amp; steps</a>.{' '}
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
