import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Capabilities & the surface',
  description:
    'Where scopes come from. The capability surface is the set of tools and resource operations your deployment exposes; grants are drawn from it.',
}

export default function Capabilities() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Capabilities &amp; the surface</PageTitle>

      <Lead>
        An agent&rsquo;s <a href="/docs/concepts/grants-and-scopes">grant</a> can only contain scopes that
        already exist. Those scopes come from the <strong>capability surface</strong>: the set of tools
        and resource operations your deployment exposes, each with a scope. This page explains where
        scopes come from. Grants explains how a grant assigns them to an agent.
      </Lead>

      <H2>Two kinds of capability, two namespaces</H2>
      <P>
        An agent acts through two different channels, and auth51 keeps them in separate scope
        namespaces so each answers a different question.
      </P>
      <ul className="my-5 space-y-3">
        <li className="rounded-xl border border-c-border bg-c-surface p-4">
          <div className="flex items-center gap-2">
            <code className="code-inline">mcp:tool:&lt;server&gt;:&lt;tool&gt;</code>
            <span className="text-[12px] text-c-text-3">may this agent invoke this tool?</span>
          </div>
          <p className="mt-1.5 text-[13px] text-c-text-2 leading-relaxed">
            A tool-invocation scope. One per tool the agent can call, whether an in-process function it
            ships with or a tool rented from an MCP server.
          </p>
        </li>
        <li className="rounded-xl border border-c-border bg-c-surface p-4">
          <div className="flex items-center gap-2">
            <code className="code-inline">a51:rs:&lt;rs&gt;:&lt;method&gt;:&lt;path&gt;</code>
            <span className="text-[12px] text-c-text-3">may this token perform this operation?</span>
          </div>
          <p className="mt-1.5 text-[13px] text-c-text-2 leading-relaxed">
            A resource-endpoint scope. One per operation on a resource server, e.g.{' '}
            <code className="code-inline">a51:rs:github.api:delete:/repos/&#123;id&#125;</code>. It names
            the effect, not the tool that causes it.
          </p>
        </li>
      </ul>
      <P>
        These are not redundant. A tool is how an agent acts. An endpoint is what happens at the
        resource. One tool can call several endpoints, and one endpoint can be reached by several tools,
        so the link between them is an explicit mapping (below), not an equality.
      </P>

      <H2>Tool scopes: the installed surface</H2>
      <P>
        Every tool your agents can reach is registered as a capability: a{' '}
        <code className="code-inline">(server, tool)</code> pair with its scope and a risk tier. They
        arrive two ways.
      </P>
      <P>
        MCP tools, the ones your agents rent from MCP servers, are registered as a batch at CI/CD or
        install time. Each gets an <code className="code-inline">mcp:tool:&lt;server&gt;:&lt;tool&gt;</code>{' '}
        scope.
      </P>
      <P>
        In-process tools, functions the agent ships with, have no separate registrar, so they are
        folded into the surface when the agent registers, under a reserved{' '}
        <code className="code-inline">__inprocess__</code> server. They are also part of the agent&rsquo;s{' '}
        <a href="/docs/concepts/agent-identity">identity checksum</a>, because they are part of its
        code. A rented MCP tool is swappable, so it is not.
      </P>

      <H2>Endpoint scopes: the RS catalog</H2>
      <P>
        A resource server publishes its OpenAPI, or a plain list of operations, to the Authority. For
        each operation the Authority derives one <code className="code-inline">a51:rs:*</code> scope,
        using a fixed, reversible function of <code className="code-inline">(rs&nbsp;id, method, path
        template)</code>. The scope is the operation: you can read the method and path back out of it,
        and the same function run anywhere produces the same string.
      </P>
      <Callout>
        This is why the resource server needs no shared secret with the Authority. Both derive the same
        scope from the same route, on their own. The verifier in front of the RS derives its own
        endpoint&rsquo;s scope the same way and checks that the token carries it. The scope is readable,
        which is fine: knowing it does not help an attacker, because forging a token for it still
        requires the Authority&rsquo;s signing key.
      </Callout>

      <H2>Linking them: tool to scope</H2>
      <P>
        Which endpoints a tool actually calls is a many-to-many mapping. auth51 establishes it
        highest-confidence first:
      </P>
      <ol className="my-5 space-y-2 text-[14px] text-c-text-2 list-none pl-0">
        <li className="flex gap-3"><span className="font-mono text-c-accent-2 shrink-0">1.</span><span>Declared. The registrant states which scopes a tool uses, at registration. This is the governed path and the highest trust.</span></li>
        <li className="flex gap-3"><span className="font-mono text-c-accent-2 shrink-0">2.</span><span>Static. Inferred from the tool&rsquo;s source: path-like literals matched against the RS&rsquo;s registered routes. A proposal, at lower confidence.</span></li>
        <li className="flex gap-3"><span className="font-mono text-c-accent-2 shrink-0">3.</span><span>Observed. Learned from what the tool actually calls at runtime.</span></li>
        <li className="flex gap-3"><span className="font-mono text-c-text-3 shrink-0">4.</span><span className="text-c-text-3">Fail-closed. If none of these establishes a mapping, the tool carries no endpoint scope. auth51 does not invent authority it cannot substantiate.</span></li>
      </ol>

      <H2>This happens in the control plane</H2>
      <P>
        Registering capabilities, cataloguing a resource server, and mapping tools to scopes are all
        writes, done ahead of time when your surface changes. None of it happens on the request path.
        At <a href="/docs/flows/minting">mint</a> the Authority reads the grant it already derived. At
        the resource the verifier derives and checks one endpoint&rsquo;s scope. A live request never
        changes what can be granted.
      </P>

      <Deep title="What if a tool calls an RS that never registered?">
        <P>
          The endpoint scope does not depend on the RS having published a catalog. If a tool declares a
          scope for an operation, that scope flows into the grant anyway. A catalog, where present, only
          enriches it: operator-tunable risk tiers, a readable name in the console, and validation of
          what was declared. Without a catalog, the risk tier falls back to a deterministic default read
          from the scope, so a destructive verb still lands in the gated tier.
        </P>
        <P className="!mb-0">
          One thing to keep straight: the <code className="code-inline">rs&nbsp;id</code> a tool declares
          must match the id the verifier in front of that RS is configured with. If they differ, the two
          derive different scope strings and the check fails closed. Use the RS&rsquo;s audience for both.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §4</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/grants-and-scopes', label: 'Grants & scopes' },
        { href: '/docs/concepts/agent-identity', label: 'Agent identity' },
        { href: '/docs/concepts/mcp', label: 'MCP governance' },
        { href: '/docs/flows/registration', label: 'Registration flow' },
      ]} />
    </article>
  )
}
