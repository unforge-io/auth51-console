import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { ZeroTrustZonesDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Zero-Trust enforcement zones',
  description:
    'Where the checks run: the Authority as the Policy Decision Point, the client runtime and resource verifier as Policy Enforcement Points, and why nothing is trusted by location.',
}

export default function EnforcementZones() {
  return (
    <article>
      <PageTitle eyebrow="Security model">Zero-Trust enforcement zones</PageTitle>

      <Lead>
        Anchors are principles; this page is about where they&rsquo;re enforced. Zero-Trust&rsquo;s core rule —
        never trust by location, always verify — means there is no &ldquo;inside&rdquo; that gets a pass. Every
        component either decides or enforces, and no request is trusted because of where it came from.
      </Lead>

      <H2>One decision point, several enforcement points</H2>
      <P>
        The model splits cleanly into the two Zero-Trust roles. The <strong>Authority</strong> is the
        Policy Decision Point (PDP): it holds the registries and keys and it decides — recomputing the
        checksum, checking scope and workflow — whether to mint. Everything else is a Policy
        Enforcement Point (PEP): it doesn&rsquo;t decide policy, it enforces what the PDP decided.
      </P>

      <Figure n={1} caption={<>The Authority decides (PDP); the client runtime and resource verifier enforce (PEP). Neither the agent process nor the resource host is a trusted zone.</>}>
        <ZeroTrustZonesDiagram />
      </Figure>

      <H2>The zones, and what each enforces</H2>
      <P>
        <strong>The agent process is an untrusted zone.</strong> It runs the model and the tools, and
        it&rsquo;s exactly where tampering and injection happen. The <em>client runtime</em> sits here as a
        PEP — it computes the live identity and requests tokens — but it&rsquo;s never the thing that
        decides whether a call is allowed. If it were compromised (threat T3), the resource-side check
        still stands.
      </P>
      <P>
        <strong>The Authority is the trust root.</strong> It&rsquo;s the one component that holds secrets
        and makes decisions, and it stays off the request path between an agent and a resource — it
        mints, then steps aside. That keeps the trusted surface small and auditable.
      </P>
      <P>
        <strong>The resource server is an implicit-trust zone that gets no implicit trust.</strong>{' '}
        The <em>verifier</em> sits in front of it as the decisive PEP: it validates the token&rsquo;s
        signature, its proof-of-possession, its scope, and — for a workflow — the step, before the
        resource does any work. This is the non-bypassable floor. Even if everything upstream is
        compromised, an action without a valid, bound, in-scope token doesn&rsquo;t execute.
      </P>
      <P>
        <strong>MCP servers get their own PEP.</strong> When an agent acts through a third-party MCP
        server, a proxy sits in front of it as a PEP, governing each tool call — the same PDP/PEP
        split, pushed out to the tool-call frontier.
      </P>

      <Callout kind="warning">
        The property that matters: enforcement is layered, and the decisive layer is farthest from
        the attacker. A compromised client runtime, a replayed token, an injected prompt — each is
        caught at a point the attacker doesn&rsquo;t control. Fail-closed is the default everywhere:
        anything unverified is refused, not waved through.
      </Callout>

      <Deep title="Why keep the PDP off the request path">
        <P className="!mb-0">
          Putting the decision point inline on every request would make it a bottleneck and a single
          point of failure, and would grow the trusted surface to the whole traffic path. Instead the
          Authority mints a short-lived, self-describing token once, and the verifier — which needs
          only the Authority&rsquo;s public keys (its JWKS), not a live call back — enforces it at the
          edge. Decision is centralized; enforcement is distributed and offline-checkable.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §9</SpecRef>
        </P>
      </Deep>

      <InTheWild title="Trust by location is the thing that failed">
        Flat networks and &ldquo;inside the perimeter is safe&rdquo; assumptions are what let one foothold
        become a breach. Zero-Trust was the industry&rsquo;s answer for users and services; extending it to
        agents means the reasoning engine gets no free pass either — its location in your stack earns
        it nothing, and every action it takes is verified at a point it can&rsquo;t tamper with.
      </InTheWild>

      <Related items={[
        { href: '/docs/architecture/authority', label: 'Architecture — the Authority (PDP)' },
        { href: '/docs/architecture/verifier', label: 'Architecture — the verifier (PEP)' },
        { href: '/docs/security/security-anchors', label: 'Security anchors — what gets enforced here' },
      ]} />
    </article>
  )
}
