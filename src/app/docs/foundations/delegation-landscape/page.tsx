import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'The delegation landscape',
  description:
    'What GNAP, SPIFFE/SPIRE, cloud IAM, and actor chains each solve for identity and delegation — and the agent-level, intent-bound gap none of them close.',
}

export default function DelegationLandscape() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">The delegation landscape</PageTitle>

      <Lead>
        auth51 isn&rsquo;t the only work on identity and delegation — it stands in a crowded, capable
        field. Being honest about what the neighbors do well is the fastest way to see the one gap
        they share: none of them bind a token to <em>which agent</em> is acting and <em>what</em>{' '}
        single action it&rsquo;s taking.
      </Lead>

      <H2>Scope-limited consent</H2>
      <P>
        The authorization-code grant already narrows blast radius: a user approves a set of scopes,
        and a leaked token is limited to them. But scopes are predefined and static — they express
        a capability, not <em>which</em> agent invoked it or <em>why</em> this action is happening
        now. For a deterministic app that&rsquo;s enough; for an agent choosing its own path at runtime,
        a coarse scope can&rsquo;t represent intent.
      </P>

      <H2>Machine-to-machine credentials</H2>
      <P>
        The client-credentials grant lets a non-human client obtain a token for its own identity —
        the backbone of backend service auth. Its limit is accountability: when one client
        application houses an orchestrator and many autonomous agents sharing one credential set,
        the token identifies the <em>application</em>, and the agents inside it are
        indistinguishable. That&rsquo;s the &ldquo;no per-agent identity&rdquo; crack from the first Foundations page.
      </P>

      <H2>Actor chains via token exchange</H2>
      <P>
        Token Exchange <SpecRef href="https://www.rfc-editor.org/rfc/rfc8693">(RFC 8693)</SpecRef>{' '}
        adds the <code className="code-inline">act</code> claim to record &ldquo;A acting for B,&rdquo; nested
        for longer chains — the closest standard analogue to what auth51 does. The difference is
        enforcement: RFC 8693 records the chain and leaves semantics to the implementer, so a
        resource server still receives a bearer token and must parse the chain itself. auth51 hashes
        the delegation path into the token and validates it at mint. (Covered in depth in{' '}
        <a href="/docs/foundations/token-exchange">Token exchange</a>.)
      </P>

      <H2>GNAP&rsquo;s richer negotiation</H2>
      <P>
        The Grant Negotiation and Authorization Protocol proposes fine-grained, dynamically
        negotiated access and first-class sub-grant objects for onward delegation — genuinely more
        expressive than OAuth here. It&rsquo;s also early and not yet widely deployed, and like the
        others it models delegation between <em>clients</em>, not between non-deterministic agents
        with per-action intent.
      </P>

      <H2>Workload identity: SPIFFE/SPIRE and cloud IAM</H2>
      <P>
        SPIFFE/SPIRE issues cryptographically verifiable identities to <em>workloads</em> (an
        X.509 SVID bound to a specific service), and cloud IAM systems — AWS IAM Roles, Azure
        Managed Identity, GCP Service Accounts — issue service-level credentials. Both are excellent
        at &ldquo;which service is this,&rdquo; and both stop at the service boundary: they can&rsquo;t distinguish
        multiple agents running inside one workload, and they verify identity, not the intent of a
        non-deterministic action.
      </P>

      <Callout>
        The pattern across all of these: they answer <em>who</em> is making a request (a client, a
        service, a workload) — and for agents the unanswered question is <em>what</em> the request
        represents, tied to <em>which</em> agent, provably. That&rsquo;s the seam auth51 fills, by
        composing these standards rather than competing with them.
      </Callout>

      <Deep title="Zero-Trust and AI-security work, briefly">
        <P>
          Two adjacent bodies of work are worth placing. <strong>Zero-Trust architectures</strong>{' '}
          (NIST SP 800-207, BeyondCorp, CISA&rsquo;s maturity model) give the right principles —
          per-request evaluation, short-lived access — but their current implementations verify{' '}
          <em>who</em> is calling (client identity), not <em>what</em> the request intends. auth51
          slots into that model rather than replacing it; see{' '}
          <a href="/docs/foundations/zero-trust">Zero-Trust alignment</a>.
        </P>
        <P className="!mb-0">
          <strong>AI-security approaches</strong> — prompt-injection guards, output validators — harden
          the model side and are complementary, not competing: they reduce how often an agent is
          subverted, while auth51 bounds what a subverted agent can do. Defense in depth wants both.
          The full comparison and threat analysis live in{' '}
          <SpecRef href="https://arxiv.org/abs/2509.13597">arXiv 2509.13597</SpecRef>.
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/foundations', label: 'Back to Foundations' },
        { href: '/docs/concepts', label: 'Concepts — how auth51 works' },
        { href: '/docs/reference', label: 'Reference — standards & research' },
      ]} />
    </article>
  )
}
