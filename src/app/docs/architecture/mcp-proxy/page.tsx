import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, InTheWild, Related } from '@/components/docs/prose'
import { McpHopDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'MCP proxy',
  description:
    'A drop-in proxy in front of any MCP server. It inspects every tool call, blocks out-of-scope or destructive actions before they reach the server, and writes an append-only audit trail.',
}

export default function McpProxy() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">MCP proxy</PageTitle>

      <Lead>
        Coding agents — Claude Code, Cursor, Codex — run with your full permissions and call MCP
        tools that touch repos, databases, and prod, leaving no record your security tooling can
        see. The MCP proxy is the enforcement point for that boundary: it sits in front of any MCP
        server, inspects every tool call, and blocks the ones it shouldn&rsquo;t allow before they land.
      </Lead>

      <H2>A chokepoint, not a library</H2>
      <P>
        The proxy is a mandatory pass-through: you wrap an existing MCP server entry in your client
        config, and every <code className="code-inline">tools/call</code> now flows through the proxy
        first. That inversion matters — governance doesn&rsquo;t depend on the agent choosing to cooperate,
        which is exactly the case that fails when a prompt-injected agent is the one misbehaving. It&rsquo;s
        small, zero-dependency, and drops in front of <em>any</em> server without changing it.
      </P>

      <H2>What it does per call</H2>
      <P>
        It reads the tool name and arguments, evaluates them against your policy — allow or deny, per
        tool — and, for an allowed call, mints the intent token that authorizes it. A denied call
        never gets a token, so the MCP server never sees an authorized request for it. The agent is
        told exactly why it was refused, and every attempt — allowed or blocked — is written to an
        append-only audit log.
      </P>

      <Figure n={1} caption={<>The proxy is the Hop-A enforcement point. It authorizes the agent’s tool call and stamps the intent token into the JSON-RPC <code>_meta</code>; the MCP server mints a fresh Hop-B token for the real downstream call.</>}>
        <McpHopDiagram />
      </Figure>

      <Callout>
        You don&rsquo;t need to own the MCP servers your agents use — which you usually don&rsquo;t. The proxy
        is the enforcement point <em>between</em> the agent and a server you don&rsquo;t control, and it
        needs no account to start blocking destructive calls locally.
      </Callout>

      <H2>The audit trail</H2>
      <P>
        Every tool call the agent tried — the safe ones that passed and the destructive ones that
        were stopped — lands in an append-only log. That&rsquo;s the record that&rsquo;s otherwise missing
        entirely: a durable, after-the-fact account of what an autonomous coding agent attempted at
        the tool boundary, independent of anything the agent itself reports.
      </P>

      <Deep title="Where it fits against the in-process runtime">
        <P>
          The proxy and the <a href="/docs/architecture/client-runtime">client runtime</a> are two
          enforcement points for two boundaries. The runtime governs an agent&rsquo;s own HTTP egress from
          inside its process; the proxy governs what an agent asks a <em>third-party MCP server</em>{' '}
          to do, one tool call at a time. A system can use either or both.
        </P>
        <P className="!mb-0">
          The proxy&rsquo;s token is a Hop-A delegation subject — it rides in the JSON-RPC{' '}
          <code className="code-inline">_meta</code> and carries no key binding, because the MCP
          server, not the agent, makes the downstream call. The binding moves to the server&rsquo;s Hop-B
          token. The full chain is covered under{' '}
          <a href="/docs/concepts/mcp">MCP governance</a>.
        </P>
      </Deep>

      <InTheWild title="Nine seconds to delete a database">
        A single staging token with broad rights was enough for one agent to drop a production
        database and its backups in seconds. The proxy is the answer to exactly that shape of
        incident: the destructive call needs a scope the agent&rsquo;s grant doesn&rsquo;t include, so it&rsquo;s
        refused at the boundary — and even the attempt is on the record.
      </InTheWild>

      <Related items={[
        { href: '/docs/concepts/mcp', label: 'Concept — MCP governance in depth' },
        { href: '/docs/architecture/client-runtime', label: 'Client runtime' },
        { href: '/docs/concepts/non-amplification', label: 'Concept — non-amplification' },
      ]} />
    </article>
  )
}
