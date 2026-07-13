import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, InTheWild, Related } from '@/components/docs/prose'
import { McpHopDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'MCP governance',
  description:
    'Govern what an agent can do through MCP servers, tool call by tool call. The intent token rides in the JSON-RPC _meta, not an HTTP header.',
}

export default function McpGovernance() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">MCP governance</PageTitle>

      <Lead>
        More and more, an agent&rsquo;s tools don&rsquo;t live in its own process. They&rsquo;re behind an
        MCP server it talks to over JSON-RPC. That server then goes and touches real systems on
        the agent&rsquo;s behalf. Governing the agent&rsquo;s own egress isn&rsquo;t enough anymore; you have to
        govern what it asks an MCP server to do, one tool call at a time.
      </Lead>

      <Foundations title="What MCP is, and why a header won&rsquo;t do">
        <p>
          The <strong>Model Context Protocol</strong>{' '}
          (<a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">MCP</a>) is an open
          standard for connecting agents to tools and data. An agent talks to an MCP server over{' '}
          <strong>JSON-RPC 2.0</strong>: structured request/response messages, not HTTP requests with
          headers you can stamp a token onto. So the usual place to carry an{' '}
          <code>Authorization</code> header simply isn&rsquo;t there.
        </p>
        <p>
          MCP does define a reserved <code>_meta</code> field on messages for exactly this kind of
          out-of-band data. auth51 carries the intent token there, so authorization travels <em>with</em>{' '}
          the specific tool call. And because the downstream call is a fresh mint, the second hop is an
          ordinary <a href="/docs/reference">OAuth Token Exchange (RFC&nbsp;8693)</a>, the same machinery
          as everywhere else in auth51.
        </p>
      </Foundations>

      <H2>The token rides in the call, not a header</H2>
      <P>
        An MCP tool call is a JSON-RPC message, not an HTTP request with headers you can stamp.
        So auth51 puts the intent token inside the call, under{' '}
        <code className="code-inline">_meta</code>, keyed{' '}
        <code className="code-inline">io.auth51/intent</code>. That binds the token to the
        specific tool and arguments being invoked, and it travels with the message wherever the
        transport takes it.
      </P>

      <H2>Two hops, and why they differ</H2>
      <P>
        There are two links in this chain, and auth51 treats them differently.
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

      <Figure n={1} caption={<>The intent token rides in the JSON-RPC <code>_meta</code> on Hop A (a delegation subject, no <code>cnf</code>). The MCP server mints a fresh Hop-B token, bound to its own key, for the real downstream call.</>}>
        <McpHopDiagram />
      </Figure>

      <Deep title="What&rsquo;s in the _meta envelope">
        <P>
          MCP reserves <code className="code-inline">_meta</code> on requests for implementation-defined
          data, namespaced by key. auth51 uses the key{' '}
          <code className="code-inline">io.auth51/intent</code> and places the intent token there,
          alongside the tool name and arguments already in the JSON-RPC{' '}
          <code className="code-inline">params</code>.
        </P>
        <P className="!mb-0">
          Because the token sits in the message body rather than a transport header, it survives every
          hop the message takes (stdio, HTTP+SSE, a relay) and it can be checked against the exact
          <code className="code-inline"> tool</code> and arguments it authorizes, not just the connection
          it arrived on. A token minted for <code className="code-inline">read_file</code> can&rsquo;t be
          reused to justify a <code className="code-inline">delete_file</code> in the same session.
        </P>
      </Deep>

      <H2>The proxy: governance without changing the server</H2>
      <P>
        You usually don&rsquo;t control the MCP servers your agents use. So auth51 ships a small,
        zero-dependency proxy that sits in front of one. It reads each tool call, applies your
        policy (allow or deny, per tool) and mints the intent token, all before the call
        reaches the server. The agent and the server are unchanged; the proxy is the enforcement
        point in between.
      </P>

      <Deep title="Why an inline proxy, not a library">
        <P>
          A library would mean modifying every agent and trusting each one to call it. The proxy
          inverts that: it&rsquo;s a mandatory chokepoint the tool call <em>must</em> pass through, so
          governance doesn&rsquo;t depend on the agent&rsquo;s cooperation, which matters precisely when a
          prompt-injected agent is trying to misbehave.
        </P>
        <P className="!mb-0">
          The proxy is where policy and mint happen together: it evaluates the tool and arguments
          against your grant, and only if the call is allowed does it produce the Hop-A intent token.
          A denied call never gets a token, so the MCP server never sees an authorized request for it.
        </P>
      </Deep>

      <InTheWild title="A tool result that tells the agent to misbehave">
        Prompt injection through a tool: a document or a web page the agent reads contains
        instructions: &ldquo;now delete the production table.&rdquo; The model obliges and calls the tool.
        Per-call governance is the backstop: the delete needs a scope the agent&rsquo;s grant doesn&rsquo;t
        include, so the proxy refuses to mint for it, and the MCP server never sees an authorized
        request.
      </InTheWild>

      <Related items={[
        { href: '/docs/concepts/proof-of-possession', label: 'Proof-of-possession' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/reference', label: 'Reference: the MCP _meta profile' },
      ]} />
    </article>
  )
}
