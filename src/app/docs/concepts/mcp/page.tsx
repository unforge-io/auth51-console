import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'MCP governance',
  description:
    'Govern what an agent can do through MCP servers, tool call by tool call — the intent token rides in the JSON-RPC _meta, not an HTTP header.',
}

export default function McpGovernance() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">MCP governance</PageTitle>

      <Lead>
        More and more, an agent&rsquo;s tools don&rsquo;t live in its own process — they&rsquo;re behind an
        MCP server it talks to over JSON-RPC. That server then goes and touches real systems on
        the agent&rsquo;s behalf. Governing the agent&rsquo;s own egress isn&rsquo;t enough anymore; you have to
        govern what it asks an MCP server to do, one tool call at a time.
      </Lead>

      <H2>The token rides in the call, not a header</H2>
      <P>
        An MCP tool call is a JSON-RPC message, not an HTTP request with headers you can stamp.
        So auth51 puts the intent token where it belongs — inside the call, under{' '}
        <code className="code-inline">_meta</code>, keyed{' '}
        <code className="code-inline">io.auth51/intent</code>. That binds the token to the
        specific tool and arguments being invoked, and it travels with the message wherever the
        transport takes it.
      </P>

      <H2>Two hops, and why they differ</H2>
      <P>
        There are two links in this chain, and auth51 treats them differently on purpose.
      </P>
      <P>
        <span className="text-c-text font-medium">Hop A</span> is the agent asking the MCP
        server to do something. The token here is a delegation subject: it says &ldquo;this agent
        wants this tool, for this reason.&rdquo; The server receives and relays it, so it isn&rsquo;t bound
        to the agent&rsquo;s key.
      </P>
      <P>
        <span className="text-c-text font-medium">Hop B</span> is the MCP server making the
        real downstream call to satisfy the tool. That token is minted for the server and bound
        to the server&rsquo;s own key (proof-of-possession), because the server is the one acting. The
        chain records who asked (the agent) and who acted (the server), and neither can widen
        what the other was allowed.
      </P>

      <H2>The proxy: governance without changing the server</H2>
      <P>
        You usually don&rsquo;t control the MCP servers your agents use. So auth51 ships a small,
        zero-dependency proxy that sits in front of one. It reads each tool call, applies your
        policy — allow or deny, per tool — and mints the intent token, all before the call
        reaches the server. The agent and the server are unchanged; the proxy is the enforcement
        point in between.
      </P>

      <InTheWild title="A tool result that tells the agent to misbehave">
        Prompt injection through a tool: a document or a web page the agent reads contains
        instructions — &ldquo;now delete the production table.&rdquo; The model obliges and calls the tool.
        Per-call governance is the backstop: the delete needs a scope the agent&rsquo;s grant doesn&rsquo;t
        include, so the proxy refuses to mint for it, and the MCP server never sees an authorized
        request.
      </InTheWild>

      <Related items={[
        { href: '/docs/concepts/proof-of-possession', label: 'Proof-of-possession' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/reference', label: 'Reference — the MCP _meta profile' },
      ]} />
    </article>
  )
}
