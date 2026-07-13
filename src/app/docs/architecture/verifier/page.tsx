import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Verifier',
  description:
    'Resource-server middleware, the second enforcement point. It verifies the token signature and DPoP binding statelessly, and is backward-compatible with plain OAuth resource servers.',
}

export default function Verifier() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Verifier</PageTitle>

      <Lead>
        The verifier is the enforcement point on the far side of the call. It is the middleware a resource
        server runs to check an intent token before it does any work. It is the second, independent
        Policy Enforcement Point: it re-verifies everything at the resource, trusting nothing the
        client asserted and never calling back to the Authority on the request path.
      </Lead>

      <H2>What it checks</H2>
      <P>
        Two things, both cryptographic and both stateless. First, the <strong>token itself</strong>:
        the verifier fetches the Authority&rsquo;s public keys from its JWKS and confirms the signature,
        issuer, audience, and expiry. Second, the <strong>binding</strong>: if the token carries a{' '}
        <code className="code-inline">cnf.jkt</code>, the caller must present a matching DPoP proof.
        The verifier hashes the proof&rsquo;s key, checks it equals the token&rsquo;s thumbprint, and verifies
        the proof&rsquo;s signature and that it matches the request it actually received.
      </P>

      <Callout>
        A token with no <code className="code-inline">cnf</code> is treated as a plain bearer token; a
        token with a <code className="code-inline">cnf.jkt</code> always has its DPoP proof verified.
        So a stolen intent token can&rsquo;t be replayed. The attacker has the string but not the key.
      </Callout>

      <H2>Backward compatible</H2>
      <P>
        The verifier keeps a resource server&rsquo;s existing shape. Each endpoint keeps its original{' '}
        <code className="code-inline">require_auth(scopes=…, audience=…)</code> declaration; the
        verifier is a thin middleware swapped in where the old bearer-token check used to be. A
        resource server that doesn&rsquo;t understand the agentic claims simply ignores them and treats the
        token as an ordinary JWT. That is a property of the token format, not something the verifier
        has to special-case.
      </P>

      <Deep title="A swap-in-place enforcement point">
        <P>
          In the reference deployment, the verifier replaces a legacy RSA proof-of-possession
          middleware with DPoP-based sender-constraint (<code className="code-inline">cnf.jkt</code>,
          RFC 9449) without touching the endpoints themselves. Audiences stay per-domain, matching
          what the agents already mint for and what the service already expected. It is a
          swap-in-place that keeps both the agents and existing callers working.
        </P>
        <P className="!mb-0">
          Statelessness is the scaling property that makes this practical: the verifier holds no
          session and calls nothing on the hot path (it caches the JWKS), so adding it imposes
          negligible overhead and scales horizontally with the resource server.{' '}
          <SpecRef href="https://www.rfc-editor.org/rfc/rfc9449">RFC 9449</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/architecture/authority', label: 'Authority: whose keys it trusts' },
        { href: '/docs/concepts/proof-of-possession', label: 'Concept: proof-of-possession' },
        { href: '/docs/concepts/intent-tokens', label: 'Concept: what it’s verifying' },
      ]} />
    </article>
  )
}
