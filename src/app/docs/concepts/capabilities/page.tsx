import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Capabilities & the surface',
  description:
    'Before an agent can be granted anything, auth51 has to know what can be granted — the capability surface. Two kinds of capability, two scope namespaces, all assembled in the control plane.',
}

export default function Capabilities() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Capabilities &amp; the surface</PageTitle>

      <Lead>
        A <a href="/docs/concepts/grants-and-scopes">grant</a> is a <em>subset</em> — so before an
        agent can be granted anything, auth51 has to know what there is to grant. That inventory is
        the <strong>capability surface</strong>: everything reachable from your deployment, each thing
        named by a scope. This page is where scopes come from; grants are how they&rsquo;re handed out.
      </Lead>

      <H2>Two kinds of capability, two namespaces</H2>
      <P>
        An agent acts through two very different channels, and auth51 keeps them in separate scope
        namespaces on purpose — collapsing them would blur two different questions.
      </P>
      <ul className="my-5 space-y-3">
        <li className="rounded-xl border border-c-border bg-c-surface p-4">
          <div className="flex items-center gap-2">
            <code className="code-inline">mcp:tool:&lt;server&gt;:&lt;tool&gt;</code>
            <span className="text-[12px] text-c-text-3">— &ldquo;may this agent invoke this tool?&rdquo;</span>
          </div>
          <p className="mt-1.5 text-[13px] text-c-text-2 leading-relaxed">
            A <strong>tool-invocation</strong> scope. One per tool the agent can call — whether an
            in-process function it ships with, or a tool rented from an MCP server.
          </p>
        </li>
        <li className="rounded-xl border border-c-border bg-c-surface p-4">
          <div className="flex items-center gap-2">
            <code className="code-inline">a51:rs:&lt;rs&gt;:&lt;method&gt;:&lt;path&gt;</code>
            <span className="text-[12px] text-c-text-3">— &ldquo;may this token perform this operation?&rdquo;</span>
          </div>
          <p className="mt-1.5 text-[13px] text-c-text-2 leading-relaxed">
            A <strong>resource-endpoint</strong> scope. One per operation on a resource server, e.g.{' '}
            <code className="code-inline">a51:rs:github.api:delete:/repos/&#123;id&#125;</code>. It names the
            <em> effect</em>, not the tool that causes it.
          </p>
        </li>
      </ul>
      <P>
        The two aren&rsquo;t redundant: a tool is <em>how</em> an agent acts; an endpoint is <em>what</em>{' '}
        actually happens at the resource. One tool can hit several endpoints, and one endpoint can be
        reached by several tools — so the link between them is an explicit mapping, not an equality
        (below).
      </P>

      <H2>Where the tool scopes come from: the installed surface</H2>
      <P>
        Every tool your agents can reach is registered as a <strong>capability</strong> — a{' '}
        <code className="code-inline">(server, tool)</code> pair carrying its scope and a risk tier.
        There are two ways they land:
      </P>
      <P>
        <strong>MCP tools</strong> — the tools your agents rent from MCP servers — are registered as
        a batch, at CI/CD or install time, as the deployment&rsquo;s installed surface. Each becomes an{' '}
        <code className="code-inline">mcp:tool:&lt;server&gt;:&lt;tool&gt;</code> scope.
      </P>
      <P>
        <strong>In-process tools</strong> — functions the agent ships with — have no separate
        registrar, so they&rsquo;re folded into the surface automatically when the agent registers, under
        a reserved <code className="code-inline">__inprocess__</code> server. They&rsquo;re special in one
        more way: because they&rsquo;re part of the agent&rsquo;s code, they&rsquo;re also part of its{' '}
        <a href="/docs/concepts/agent-identity">identity checksum</a> — an MCP tool is rented and
        swappable, so it never is.
      </P>

      <H2>Where the endpoint scopes come from: the RS catalog</H2>
      <P>
        A resource server publishes its OpenAPI (or a plain list of operations) to the Authority. For
        each operation the Authority derives exactly one <code className="code-inline">a51:rs:*</code>{' '}
        scope, by a fixed, reversible function of <code className="code-inline">(rs&nbsp;id, method, path
        template)</code>. The scope <em>is</em> the operation — you can read the method and path straight
        out of it, and the same function run anywhere produces the same string.
      </P>
      <Callout>
        This is why the resource server needs no shared secret with the Authority: both derive the same
        scope from the same route, independently. The verifier in front of the RS derives{' '}
        <em>its own</em> endpoint&rsquo;s scope the same way and just checks the token carries it.
        Predictable, on purpose — a scope&rsquo;s legibility isn&rsquo;t a weakness, because forging a{' '}
        <em>token</em> for it still takes the Authority&rsquo;s signing key.
      </Callout>

      <H2>Linking the two: the tool → scope ladder</H2>
      <P>
        Which endpoints does a tool actually exercise? That&rsquo;s a many-to-many mapping, and auth51
        establishes it highest-confidence first:
      </P>
      <ol className="my-5 space-y-2 text-[14px] text-c-text-2 [counter-reset:step] list-none pl-0">
        <li className="flex gap-3"><span className="font-mono text-c-accent-2 shrink-0">1.</span><span><strong>Declared</strong> — the registrant states, at registration, which scopes a tool uses. The governed path; highest trust.</span></li>
        <li className="flex gap-3"><span className="font-mono text-c-accent-2 shrink-0">2.</span><span><strong>Static</strong> — inferred from the tool&rsquo;s own source: path-like literals matched against the RS&rsquo;s registered routes. A proposal, at lower confidence.</span></li>
        <li className="flex gap-3"><span className="font-mono text-c-accent-2 shrink-0">3.</span><span><strong>Observed</strong> — learned from what the tool is actually seen calling at runtime. The calibration flywheel.</span></li>
        <li className="flex gap-3"><span className="font-mono text-c-text-3 shrink-0">4.</span><span className="text-c-text-3"><strong>Fail-closed</strong> — if none of the above establishes a mapping, the tool simply carries no endpoint scope. auth51 never invents authority it can&rsquo;t substantiate.</span></li>
      </ol>

      <H2>All of this happens in the control plane</H2>
      <P>
        Registering capabilities, cataloguing a resource server, mapping tools to scopes — these are{' '}
        <em>writes</em>, done ahead of time when your surface changes. They are never done on the hot
        path. At <a href="/docs/flows/minting">mint</a> the Authority only <em>reads</em> the grant
        that was already derived; at the resource the verifier only <em>derives and checks</em> one
        endpoint&rsquo;s scope. Nothing about a live request ever changes what can be granted.
      </P>

      <Deep title="What if a tool calls an RS that never registered?">
        <P>
          The endpoint scope doesn&rsquo;t depend on the RS having published a catalog. If a tool{' '}
          <em>declares</em> a scope for an operation, that scope flows into the grant regardless — the
          catalog, when present, only enriches it (operator-tunable risk tiers, a legible name in the
          console, validation of what was declared). Absent a catalog, the risk tier falls back to a
          deterministic default read straight from the scope, so a destructive verb still lands in the
          gated tier.
        </P>
        <P className="!mb-0">
          The one thing to keep straight: the <code className="code-inline">rs&nbsp;id</code> a tool
          declares must match the id the verifier in front of that RS is configured with — otherwise the
          two derive different scope strings and the check fails closed. The safe convention is to use
          the RS&rsquo;s audience for both. <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §4</SpecRef>
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
