import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'OAuth 2.0 & JWT, quickly',
  description:
    'Grants, access tokens, bearer semantics, JWT and JWK — the OAuth machinery auth51 keeps, and the exact point where it stops being enough for agents.',
}

export default function OAuthAndJwt() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">OAuth 2.0 &amp; JWT, quickly</PageTitle>

      <Lead>
        auth51 doesn&rsquo;t replace OAuth — it extends it. So it&rsquo;s worth being precise about the parts
        it keeps unchanged, because if you know these four things already, you know most of how an
        intent token is issued and verified.
      </Lead>

      <H2>Grants: how a client gets a token</H2>
      <P>
        OAuth 2.0 <SpecRef href="https://www.rfc-editor.org/rfc/rfc6749">(RFC 6749)</SpecRef> is, at
        heart, a set of <em>grants</em> — procedures by which a client proves it&rsquo;s allowed
        something and receives an access token in return. The authorization-code grant is the one
        behind &ldquo;Sign in with…&rdquo;; the client-credentials grant is how a backend service authenticates
        as itself with no user present. Each grant ends the same way: the authorization server
        issues a token scoped to what was approved.
      </P>
      <P>
        auth51 adds one grant to this family — <code className="code-inline">agent_checksum</code> —
        for the case OAuth never anticipated: a client that needs to prove <em>which registered
        agent</em> is asking, not just which application. Everything about how that grant is
        requested and answered follows the ordinary OAuth token-endpoint shape.
      </P>

      <H2>Access tokens are bearer tokens</H2>
      <P>
        The token a grant produces is, by default, a <em>bearer</em> token{' '}
        <SpecRef href="https://www.rfc-editor.org/rfc/rfc6750">(RFC 6750)</SpecRef>: the spec
        defines it as a token that &ldquo;any party in possession of&rdquo; it can use. That property is a
        feature — it makes tokens trivial to pass between services — and a liability: the token{' '}
        <em>is</em> the credential, so a copy is a working key. Holding onto that observation is the
        whole motivation for proof-of-possession, two pages on.
      </P>

      <H2>JWT: what a token is made of</H2>
      <P>
        A JSON Web Token <SpecRef href="https://www.rfc-editor.org/rfc/rfc7519">(RFC 7519)</SpecRef>{' '}
        is the format most access tokens take: a header, a set of JSON <em>claims</em>, and a
        signature, base64url-encoded and dot-separated. Standard claims carry the issuer
        (<code className="code-inline">iss</code>), audience (<code className="code-inline">aud</code>),
        subject (<code className="code-inline">sub</code>), expiry (<code className="code-inline">exp</code>),
        and scope. A resource server verifies the signature and reads the claims — no call back to
        the issuer required.
      </P>
      <P>
        An intent token is an ordinary JWT. It adds claims — a key binding, an{' '}
        <code className="code-inline">intent</code> object, an <code className="code-inline">agent_proof</code>{' '}
        — that servers which understand auth51 act on, and servers that don&rsquo;t simply ignore. That
        backward compatibility is deliberate and it&rsquo;s a property of JWT, not something auth51 invents.
      </P>

      <H2>JWK: how the signature is checked</H2>
      <P>
        To verify a JWT&rsquo;s signature, a resource server needs the issuer&rsquo;s public key. JSON Web Key{' '}
        <SpecRef href="https://www.rfc-editor.org/rfc/rfc7517">(RFC 7517)</SpecRef> is the format for
        those keys, and a JWKS endpoint is where an authority publishes them. The same standard
        gives us the <em>thumbprint</em> of a key — a compact hash of its public parameters — which
        turns out to be exactly what proof-of-possession needs to name a key without carrying the
        whole thing.
      </P>

      <Callout>
        The one-line version: auth51 keeps OAuth&rsquo;s grants, keeps the JWT/JWK formats, keeps
        backward compatibility with plain resource servers — and changes only what a token{' '}
        <em>claims</em> and how tightly it&rsquo;s bound. If you already run OAuth, you already run most
        of this.
      </Callout>

      <Deep title="Where the base standards run out for agents">
        <P>
          Nothing above knows about agents. A JWT&rsquo;s <code className="code-inline">sub</code> names
          the application, not the specific agent inside it; the <code className="code-inline">scope</code>{' '}
          names a broad capability, not the one action being taken; and the bearer property means a
          leaked token is a usable one. These aren&rsquo;t bugs — they&rsquo;re the correct design for
          deterministic clients.
        </P>
        <P className="!mb-0">
          What auth51 does is add exactly three things on top, each borrowed from another standard:
          a per-agent identity (the checksum), per-action intent (via token exchange), and sender
          constraint (via DPoP). The next three pages take those in turn.
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/foundations/token-exchange', label: 'Token exchange (RFC 8693)' },
        { href: '/docs/concepts/intent-tokens', label: 'Concept — Intent tokens' },
        { href: '/docs/reference', label: 'Reference — the full standards list' },
      ]} />
    </article>
  )
}
