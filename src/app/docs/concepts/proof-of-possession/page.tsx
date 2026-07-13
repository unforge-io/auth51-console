import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { DPoPBindingDiagram } from '@/components/docs/diagrams'

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

      <Foundations title="Where this comes from: bearer tokens and DPoP">
        <p>
          OAuth 2.0 <a href="/docs/reference">(RFC&nbsp;6749)</a> tokens are, by default,{' '}
          <em>bearer</em> tokens: <a href="https://www.rfc-editor.org/rfc/rfc6750" target="_blank" rel="noreferrer">RFC&nbsp;6750</a>{' '}
          says any party in possession of the token can use it, with no proof of anything else.
          That makes tokens trivial to pass around, but it means the token
          <em>is</em> the credential. Steal the string, and you have the access.
        </p>
        <p>
          <strong>DPoP</strong> (Demonstrating Proof-of-Possession,{' '}
          <a href="https://www.rfc-editor.org/rfc/rfc9449" target="_blank" rel="noreferrer">RFC&nbsp;9449</a>)
          {' '}closes that gap without mutual&nbsp;TLS or client certificates. The client holds a
          keypair; the token is issued with a <code>cnf</code> (&ldquo;confirmation&rdquo;) claim naming the
          public key&rsquo;s thumbprint, <code>jkt</code>. To use the token you attach a short signed
          proof. It&rsquo;s standard OAuth machinery, applied per action rather than per session.
        </p>
      </Foundations>

      <H2>The key never leaves the process</H2>
      <P>
        When the client starts governing an agent, it generates an ephemeral keypair in
        memory. The public half&rsquo;s thumbprint goes to the authority when a token is minted;
        the authority stamps it into the token as <code className="code-inline">cnf.jkt</code>,
        the confirmation claim from DPoP (RFC 9449). The private half stays in the process
        and is never sent anywhere.
      </P>
      <P>
        To use the token against a resource, the caller signs a small proof with that private
        key. The resource server checks two things: the token is valid, and the proof matches
        the <code className="code-inline">cnf.jkt</code> inside it. A token without a matching
        proof is refused.
      </P>

      <Figure n={1} caption={<>At mint, the agent&rsquo;s public-key thumbprint is bound into the token as <code>cnf.jkt</code>. To call a resource, the agent signs a proof with the private key; the resource server accepts only when the proof key matches the thumbprint in the token.</>}>
        <DPoPBindingDiagram />
      </Figure>

      <Deep title="What&rsquo;s actually in the DPoP proof">
        <P>
          The proof is itself a small JWT (a <em>DPoP proof</em>) that the agent creates fresh
          for each request and signs with the private key. It carries the HTTP method and URI it
          is good for (<code className="code-inline">htm</code> / <code className="code-inline">htu</code>),
          a timestamp (<code className="code-inline">iat</code>), and a unique id
          (<code className="code-inline">jti</code>) so a captured proof can&rsquo;t be replayed. Its
          header includes the full public key (<code className="code-inline">jwk</code>).
        </P>
        <P className="!mb-0">
          The resource server hashes that public key, confirms the thumbprint equals the
          <code className="code-inline">cnf.jkt</code> inside the intent token, then verifies the
          proof&rsquo;s signature and that <code className="code-inline">htm</code>/<code className="code-inline">htu</code>{' '}
          match the request it actually received. Token and proof are cryptographically joined;
          you can&rsquo;t present one without the other. <SpecRef>RFC 9449</SpecRef>
        </P>
      </Deep>

      <InTheWild title="A token in a log is not a key">
        Tokens leak the boring way: copied into a log line, a trace span, an error report, a
        screenshot. With a plain bearer token, any of those is a working credential. With a
        sender-constrained one, the leaked token is a dead artifact: the attacker has the
        string but not the key, and can&rsquo;t produce the proof.
      </InTheWild>

      <H2>Why MCP tokens are different</H2>
      <P>
        There&rsquo;s one exception. When an agent calls a tool through an MCP server,
        the intent token it hands over is a <em>delegation subject</em>: the MCP server
        receives it and acts on the agent&rsquo;s behalf. Binding that token to the agent&rsquo;s key
        would be wrong, because the agent isn&rsquo;t the one making the downstream call, the server
        is. So the Hop-A token carries no <code className="code-inline">cnf</code>. Proof-of-possession
        moves to the Hop-B token the server mints downstream, bound to the server&rsquo;s own key.
        See MCP governance for how that chain works.
      </P>

      <Deep title="Why moving the binding doesn&rsquo;t weaken anything">
        <P>
          It would be easy to read &ldquo;the Hop-A token has no <code className="code-inline">cnf</code>&rdquo;
          as a hole. It isn&rsquo;t. The Hop-A token never travels to the final resource. It stops at
          the MCP server, which validates it and then mints its own Hop-B token for the real call.
          That Hop-B token <em>is</em> DPoP-bound, to the MCP server&rsquo;s key.
        </P>
        <P className="!mb-0">
          So every token that actually reaches a resource is sender-constrained to whoever is
          making that specific call. The binding follows the party doing the work, hop by hop,
          rather than being faked onto a party that isn&rsquo;t. Non-amplification keeps each hop&rsquo;s
          authority a subset of the last. <SpecRef>draft-goswami-agentic-jwt §4</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
        { href: '/docs/concepts/mcp', label: 'MCP governance' },
        { href: '/docs/reference', label: 'Reference: DPoP (RFC 9449)' },
      ]} />
    </article>
  )
}
