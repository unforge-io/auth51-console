import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Token exchange (RFC 8693)',
  description:
    'Trading a broad token for a narrower one, and the actor claim for delegation. The standard the agent_checksum grant and intent tokens are built on top of.',
}

export default function TokenExchange() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">Token exchange (RFC 8693)</PageTitle>

      <Lead>
        If there&rsquo;s one existing standard that already had the right shape for agents, it&rsquo;s OAuth
        Token Exchange. It was written to take a token you hold and hand back a different, usually
        narrower one. That is the move an agent needs before every action.
      </Lead>

      <H2>Trading down</H2>
      <P>
        Token Exchange <SpecRef href="https://www.rfc-editor.org/rfc/rfc8693">(RFC 8693)</SpecRef>{' '}
        defines a grant type whose job is to accept a <em>subject token</em> a client already has
        and return a new token, optionally with a different audience, a different subject, and a{' '}
        <em>reduced</em> set of scopes. The canonical use is a service that holds a broad token and
        wants a tightly-scoped one to pass to a downstream service, shrinking the blast radius if
        that downstream token leaks.
      </P>
      <P>
        That &ldquo;shrink as you pass it along&rdquo; direction is what non-amplification is built on.
        Every intent token is a token exchange in this sense:
        the client presents what it&rsquo;s already authenticated with, and asks the authority to
        exchange it for a token good for exactly one action.
      </P>

      <H2>The actor claim: &ldquo;A acting for B&rdquo;</H2>
      <P>
        Token Exchange also introduced a structured way to record delegation. Its{' '}
        <code className="code-inline">act</code> (actor) claim captures when one party is acting on
        behalf of another, and those claims can nest, recording a chain such as &ldquo;C acting for B
        acting for A.&rdquo; This is the standards world&rsquo;s answer to representing a delegation path
        inside a token.
      </P>
      <P>
        It&rsquo;s also where the standard stops. RFC 8693 defines how to <em>record</em> a
        chain; it leaves to the implementer what to <em>enforce</em> about it. A resource server
        still receives a bearer token and must parse nested JSON to discover who really acted.
        auth51 takes the same idea and makes it enforceable: the delegation path is hashed into the
        token and validated at mint against the agents and workflow the authority actually knows.
      </P>

      <H2>How the agent_checksum grant sits on top</H2>
      <P>
        auth51&rsquo;s <code className="code-inline">agent_checksum</code> grant is token exchange with
        one addition: before the exchange happens, the authority verifies <em>which agent</em> is
        asking, by recomputing its checksum. The exchanged token narrows scope, and it
        narrows it <em>to a proven agent identity and a single workflow step</em>. The base
        standard supplies the trade-down and the delegation record; auth51 supplies the agent proof
        and the enforcement.
      </P>

      <Deep title="Why not just use RFC 8693 as-is">
        <P>
          You could implement a lot of the &ldquo;narrow the token per call&rdquo; behavior with vanilla token
          exchange. What you couldn&rsquo;t get is the two things agents specifically need: proof of{' '}
          <em>which</em> non-deterministic agent inside a shared client is making the request, and a
          binding of the token to <em>one concrete action</em> rather than a scope. Vanilla token
          exchange narrows scope but still treats the client application as the subject and leaves
          intent implicit.
        </P>
        <P className="!mb-0">
          So auth51 uses token exchange as the substrate and adds the checksum-verified subject and
          the <code className="code-inline">intent</code> claim on top, staying wire-compatible with
          the OAuth token endpoint while restoring the one-token-per-intent semantics agents need.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §4</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/foundations/proof-of-possession', label: 'Proof-of-possession (DPoP & mTLS)' },
        { href: '/docs/concepts/non-amplification', label: 'Concept: Non-amplification' },
        { href: '/docs/concepts/intent-tokens', label: 'Concept: Intent tokens' },
      ]} />
    </article>
  )
}
