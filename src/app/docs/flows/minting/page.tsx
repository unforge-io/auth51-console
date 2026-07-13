import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { ProtocolFlowDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Token minting flow',
  description:
    'The request-time sequence: the client runtime asks for an intent token, the Authority validates and mints, and the token is attached to the call and verified at the resource.',
}

export default function MintingFlow() {
  return (
    <article>
      <PageTitle eyebrow="Protocol flows">Token minting</PageTitle>

      <Lead>
        This is the sequence that runs on every governed call. The agent is about to touch a resource;
        between the intent and the request, the runtime mints an intent token and the Authority decides
        whether to grant it. It&rsquo;s the hot path, and it adds a handful of milliseconds to a step that
        already takes an LLM hundreds.
      </Lead>

      <Figure n={1} caption={<>The request-time flow. The client asks the Authority to mint (control plane); the Authority returns a short-lived, DPoP-bound intent token; the client presents it to the resource, which verifies it (data plane).</>}>
        <ProtocolFlowDiagram />
      </Figure>

      <H2>The request</H2>
      <P>
        When the agent is about to call a resource, the runtime pauses the egress and assembles a mint
        request against the <code className="code-inline">agent_checksum</code> grant: the agent id, the
        checksum it just computed from the live agent, the requested scope and audience, and (if the
        run is following a plan) the workflow, step, and delegation context. This request is itself
        authenticated with the client&rsquo;s ordinary OAuth token; minting an intent token is a privileged
        operation.
      </P>

      <H2>The validation</H2>
      <P>
        The Authority runs a decision, in order: the grant type must be{' '}
        <code className="code-inline">agent_checksum</code>; the agent must be registered; the submitted
        checksum must match the registered one (recomputed, not trusted); the requested scope must fall
        inside the grant; and, if a workflow is in play, the step, its prerequisites, and the delegation
        chain must all check out. Any failure returns a specific error and no token.
      </P>

      <Callout>
        The checksum comparison here <em>is</em> the runtime identity check. Because the Authority
        recomputes it, a mint request from an agent whose prompt or tools changed since registration
        fails at this step. The same request that worked before the change is now denied.
      </Callout>

      <H2>The mint and the attach</H2>
      <P>
        On success the Authority issues an intent token: an ordinary JWT carrying the identity, the
        single scope and audience, a tight expiry, the <code className="code-inline">cnf.jkt</code> key
        binding, and the <code className="code-inline">intent</code> and{' '}
        <code className="code-inline">agent_proof</code> claims. The runtime attaches it to the outbound
        request, adds the DPoP proof signed with the agent&rsquo;s private key, and lets the call proceed. At
        the resource, the <a href="/docs/architecture/verifier">verifier</a> checks the signature and the
        binding before doing any work.
      </P>

      <Deep title="What it costs, and why the total can go down">
        <P>
          The security work here is small: token minting adds on the order of ~18 ms, and the checksum
          computation is a fraction of a millisecond, negligible against an LLM reasoning step that
          runs hundreds to thousands of milliseconds.
        </P>
        <P className="!mb-0">
          Counter-intuitively, end-to-end workflow time can <em>drop</em>: because a mint is denied
          <em> before</em> a disallowed action runs, the system skips the wasted LLM and tool calls that
          a bad path would otherwise have spent. Blocking early saves more than verification costs.{' '}
          <SpecRef href="https://arxiv.org/abs/2509.13597">arXiv 2509.13597</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/flows/workflow-tracking', label: 'Next: workflow tracking' },
        { href: '/docs/concepts/intent-tokens', label: 'Concept: the token that’s minted' },
        { href: '/docs/architecture/authority', label: 'Architecture: the Authority' },
      ]} />
    </article>
  )
}
