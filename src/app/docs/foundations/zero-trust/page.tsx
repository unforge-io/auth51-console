import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, SpecRef, Related } from '@/components/docs/prose'
import { ZeroTrustZonesDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Zero-Trust alignment',
  description:
    'NIST SP 800-207 in one page — policy decision vs enforcement points, implicit trust zones — and how auth51’s components map onto those roles one-to-one.',
}

export default function ZeroTrust() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">Zero-Trust alignment</PageTitle>

      <Lead>
        auth51 didn&rsquo;t invent its architecture — it adopted the reference model the industry already
        agrees on for &ldquo;never trust, always verify&rdquo; and dropped its components into the roles that
        model defines. If you know NIST&rsquo;s Zero-Trust vocabulary, you already know where every
        auth51 piece sits and why.
      </Lead>

      <H2>The model in one paragraph</H2>
      <P>
        Zero-Trust Architecture <SpecRef href="https://doi.org/10.6028/NIST.SP.800-207">(NIST SP 800-207)</SpecRef>{' '}
        formalizes &ldquo;never trust, always verify, assume breach.&rdquo; Its core split is between a{' '}
        <em>Policy Decision Point</em> (PDP) — the thing that evaluates each request against policy
        and decides — and one or more <em>Policy Enforcement Points</em> (PEPs) — the things that
        actually allow or block the traffic. Nothing is trusted because of where it sits on the
        network; every request is evaluated on its own.
      </P>

      <H2>auth51&rsquo;s components, mapped one-to-one</H2>
      <P>
        The mapping is exact, which is the point — auth51 restores Zero-Trust semantics for agents
        rather than bolting on a new paradigm:
      </P>
      <P>
        <strong>The Authority is the PDP.</strong> Every token request is evaluated against
        registered agent identities and approved workflows before anything is minted. It holds the
        keys and makes the decision; it enforces nothing directly.
      </P>
      <P>
        <strong>The client runtime is a PEP.</strong> Embedded in the agent process, it computes
        the identity proof and refuses to let a governed call leave without a valid token — the
        enforcement point closest to the action.
      </P>
      <P>
        <strong>The resource-server verifier is a second PEP.</strong> It cryptographically checks
        the token and its key binding before serving the request, statelessly, with no session
        state to hold or authority to call back to.
      </P>

      <Figure n={1} caption={<>The three Zero-Trust roles in one call. The Authority decides (PDP); the client runtime and the resource-server verifier enforce (PEPs) on either side. The protected resource sits in an implicit trust zone behind its PEP.</>}>
        <ZeroTrustZonesDiagram />
      </Figure>

      <H2>Shrinking the implicit trust zone</H2>
      <P>
        SP 800-207 talks about the <em>implicit trust zone</em>: the region behind an enforcement
        point where, once you&rsquo;re in, you&rsquo;re trusted. Classic session-based auth makes that zone
        large — one login buys broad, lasting access. auth51&rsquo;s per-action intent tokens make it
        nearly a point: a token authorizes one action for a few minutes, so the &ldquo;once you&rsquo;re in&rdquo;
        window barely exists. That&rsquo;s the same instinct behind CISA&rsquo;s Zero-Trust maturity guidance
        toward short-lived, just-enough access — applied at the granularity of a single agent call.
      </P>

      <Deep title="Why the mapping matters beyond tidiness">
        <P>
          It&rsquo;s not just that the roles line up — it&rsquo;s that having <em>two</em> PEPs on opposite sides
          of the call is what makes the model hold under agent non-determinism. The client-side PEP
          proves identity and intent at the source; the resource-side PEP re-verifies independently,
          trusting nothing the client asserted on its own. Neither has to trust the network between
          them, and the PDP never has to be on the data path.
        </P>
        <P className="!mb-0">
          This is why a leaked token or a subverted agent doesn&rsquo;t cascade: enforcement happens twice,
          by different parties, against a decision the trusted PDP already made and signed.
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/foundations/delegation-landscape', label: 'The delegation landscape' },
        { href: '/docs/concepts', label: 'Concepts — the components in depth' },
        { href: '/docs/foundations/proof-of-possession', label: 'Proof-of-possession' },
      ]} />
    </article>
  )
}
