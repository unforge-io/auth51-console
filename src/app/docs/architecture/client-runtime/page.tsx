import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Client runtime',
  description:
    'The in-process enforcement point. It intercepts an agent’s egress, derives its identity, and mints and attaches a scoped intent token — the durable, unbypassable path.',
}

export default function ClientRuntime() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Client runtime</PageTitle>

      <Lead>
        The client runtime is the enforcement point that lives inside the agent process. It sees
        every outbound call the agent makes — native tool calls and MCP calls alike — and gives each
        governed one a scoped, verifiable intent token before it leaves. It&rsquo;s the durable path:
        because it&rsquo;s in-process and depends only on the HTTP layer, an agent can&rsquo;t route around it.
      </Lead>

      <H2>What it does on every call</H2>
      <P>
        Four things, in order. It <strong>derives the acting agent&rsquo;s identity</strong> from what the
        process is actually running. It <strong>recomputes the checksum</strong> and confirms it
        matches a registered agent. It <strong>holds an ephemeral proof-of-possession key</strong> in
        memory and uses it to sender-constrain the token. And it <strong>mints and attaches the
        intent token</strong> to the outbound request — or fails closed if any check doesn&rsquo;t hold.
      </P>

      <Callout>
        You govern by wrapping intent, not code: configure the runtime once with your authority and
        audiences, then run your agent inside an <code className="code-inline">agent(...)</code>{' '}
        context. Calls to governed audiences get an intent token stamped on automatically; everything
        else passes straight through.
      </Callout>

      <H2>Identity is announced, never inferred</H2>
      <P>
        The single most important design choice: the runtime does not walk the call stack to guess
        which agent is calling, and it never trusts an identity passed as a call-time argument — a
        prompt-injected LLM can forge an argument, but not the framework&rsquo;s own execution entry. The
        verified agent declares its identity at its execution entry point (via auto-instrumentation),
        and the runtime attributes egress to it using process-local context, not stack introspection.
      </P>

      <H2>The unbypassable path</H2>
      <P>
        Enforcement that depends on the agent&rsquo;s cooperation isn&rsquo;t enforcement. Because the runtime
        intercepts at the HTTP layer, it catches all egress regardless of the agent host&rsquo;s
        conventions — there&rsquo;s no <code className="code-inline">authenticated_request()</code> the
        agent has to remember to call, and no framework-specific hook to opt out of. The tools are
        plain HTTP calls; governance happens underneath them.
      </P>

      <Deep title="Embed mode and the open runtime">
        <P>
          There are two client forms sharing one model. The <strong>embed</strong> client is the
          in-process interceptor described here — the generalized, MCP-era successor to the original
          A-JWT shim, with context-based attribution rather than call-stack introspection. The{' '}
          open-source <strong>runtime</strong> is the same client half of the protocol, packaged for
          adoption; it establishes verified identity and fails closed, and never enforces on its own —
          the Authority remains the verifier and trust root.
        </P>
        <P className="!mb-0">
          Both share the exact hashing code with the Authority (see{' '}
          <a href="/docs/architecture/checksum">checksum engine</a>): only the extraction layer that
          turns a live agent into identity inputs is client-side and framework-aware. That parity is
          what lets a client prove &ldquo;this is the registered, unmodified agent&rdquo; without the agent
          declaring anything the Authority has to take on faith.
        </P>
      </Deep>

      <InTheWild title="Fail-open is a deliberate, visible choice">
        Turning governance on shouldn&rsquo;t break a working app on day one, so the runtime can be run in
        a fail-open posture during rollout — it logs what it would have blocked without blocking it.
        That&rsquo;s an explicit, per-deployment setting, not a silent default: enforcement is real, and
        moving to fail-closed is the switch you flip when you&rsquo;re ready.
      </InTheWild>

      <Related items={[
        { href: '/docs/architecture/authority', label: 'Authority — where it mints' },
        { href: '/docs/architecture/mcp-proxy', label: 'MCP proxy — the tool-boundary path' },
        { href: '/docs/concepts/proof-of-possession', label: 'Concept — the PoP key it holds' },
      ]} />
    </article>
  )
}
