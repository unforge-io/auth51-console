import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Proof-of-possession',
  description:
    'auth51 binds each intent token to an ephemeral key held in the agent process (DPoP, RFC 9449). A token you can’t prove you hold is worthless.',
}

export default function ProofOfPossession() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Proof-of-possession</PageTitle>

      <Lead>
        A bearer token has one flaw baked into the name: whoever bears it, wins. Copy it and
        you are it. That&rsquo;s fine for a browser session behind a login screen. It&rsquo;s a poor
        fit for an agent whose tokens pass through logs, traces, tool outputs, and other
        processes on their way to a resource.
      </Lead>
      <P>
        auth51 makes its tokens <em>sender-constrained</em>. A token is only good if you can
        prove you hold the key it was bound to.
      </P>

      <H2>The key never leaves the process</H2>
      <P>
        When the client starts governing an agent, it generates an ephemeral keypair in
        memory. The public half&rsquo;s thumbprint goes to the authority when a token is minted;
        the authority stamps it into the token as <code className="code-inline">cnf.jkt</code>{' '}
        — the confirmation claim from DPoP (RFC 9449). The private half stays in the process
        and is never sent anywhere.
      </P>
      <P>
        To use the token against a resource, the caller signs a small proof with that private
        key. The resource server checks two things: the token is valid, and the proof matches
        the <code className="code-inline">cnf.jkt</code> inside it. A token without a matching
        proof is refused.
      </P>

      <InTheWild title="A token in a log is not a key">
        Tokens leak the boring way — copied into a log line, a trace span, an error report, a
        screenshot. With a plain bearer token, any of those is a working credential. With a
        sender-constrained one, the leaked token is a dead artifact: the attacker has the
        string but not the key, and can&rsquo;t produce the proof.
      </InTheWild>

      <H2>Why MCP tokens are different on purpose</H2>
      <P>
        There&rsquo;s one deliberate exception. When an agent calls a tool through an MCP server,
        the intent token it hands over is a <em>delegation subject</em> — the MCP server
        receives it and acts on the agent&rsquo;s behalf. Binding that token to the agent&rsquo;s key
        would be wrong: the agent isn&rsquo;t the one making the downstream call, the server is. So
        the Hop-A token carries no <code className="code-inline">cnf</code>. Proof-of-possession
        moves to the Hop-B token the server mints downstream, bound to the server&rsquo;s own key.
        See MCP governance for how that chain works.
      </P>

      <Related items={[
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
        { href: '/docs/concepts/mcp', label: 'MCP governance' },
        { href: '/docs/reference', label: 'Reference — DPoP (RFC 9449)' },
      ]} />
    </article>
  )
}
