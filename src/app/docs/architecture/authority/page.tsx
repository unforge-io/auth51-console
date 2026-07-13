import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Authority',
  description:
    'The auth51 Authority is the adaptive IDP and Zero-Trust Policy Decision Point: agent and workflow registries, intent-token minting, key publication, and checksum re-verification at mint.',
}

export default function Authority() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Authority</PageTitle>

      <Lead>
        The Authority is the trust root. It decides who every agent is, what each may do, and mints
        the short-lived tokens that carry those decisions. It never sits on the request path
        between an agent and a resource. In Zero-Trust terms it is the Policy Decision Point: every
        other component defers to it and enforces what it decides.
      </Lead>

      <H2>What it holds</H2>
      <P>
        The Authority is the one place the system&rsquo;s state of record lives. It keeps the{' '}
        <strong>agent registry</strong> (each registered agent&rsquo;s id, checksum, granted scopes, and
        registration id) and the <strong>workflow registry</strong> (the multi-step plans agents
        run, with their per-step scopes, dependencies, and approval gates). It also holds the signing
        keys and publishes their public halves as a JWKS for resource servers to verify against.
      </P>

      <H2>What it does on a mint</H2>
      <P>
        When a client asks for an intent token, the Authority runs a decision, not a lookup. It
        confirms the agent is registered, <em>recomputes</em> the agent&rsquo;s checksum and compares it
        to the registered one, validates the requested scope falls inside the agent&rsquo;s grant, and,
        if the run follows a workflow, checks the step, its prerequisites, and the delegation chain.
        Only if all of that holds does it mint. The token it returns carries the identity, the single
        intent, the key binding, and the proof claims.
      </P>

      <Callout>
        The Authority re-verifies the checksum itself rather than trusting the one the client
        submitted. Client and Authority independently arrive at the same fingerprint, or the mint
        fails. There is no self-declared identity for an impostor to assert.
      </Callout>

      <H2>The surfaces it exposes</H2>
      <P>
        Its API is organized by responsibility: an <code className="code-inline">/intent</code>{' '}
        surface for token minting, a <code className="code-inline">/grants</code> surface for the
        scope envelopes that bound each agent, a <code className="code-inline">/decisions</code>{' '}
        surface reflecting its role as the decision point, an{' '}
        <code className="code-inline">/oauth</code> surface (including the JWKS the verifier reads),
        and registration surfaces for clients and workload identities. The exact request and
        response shapes are generated into{' '}
        <a href="/docs/architecture/contracts">contracts</a>, so clients never hand-guess them.
      </P>

      <Deep title="Why “adaptive” IDP">
        <P>
          A conventional IDP issues a token once a client authenticates and moves on. The Authority
          adapts its decision to <em>what the agent currently is</em>: because identity is a
          recomputed checksum rather than a stored secret, an agent whose prompt or tools changed
          since registration no longer matches, and the same request that succeeded yesterday fails
          today. The decision tracks the running code, not a credential issued in the past.
        </P>
        <P className="!mb-0">
          It is a reference implementation kept light. The trust and verification logic
          matters more than scale here, and it is designed to be fronted by, or ported into, existing
          enterprise IDPs (Okta, Auth0, Azure AD) via plugins rather than replacing them.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §4</SpecRef>
        </P>
      </Deep>

      <InTheWild title="Fail-closed by construction">
        Because minting is a decision and not a lookup, the default for anything unrecognized is
        refusal. An unregistered agent&rsquo;s mint is denied and recorded as a reference for review (see
        discovery); a checksum mismatch is denied; a step out of workflow order is denied. Nothing
        gets a token by being merely plausible.
      </InTheWild>

      <Related items={[
        { href: '/docs/architecture/client-runtime', label: 'Client runtime: the other half' },
        { href: '/docs/architecture/verifier', label: 'Verifier: who checks the mint' },
        { href: '/docs/concepts/agent-identity', label: 'Concept: the checksum it verifies' },
      ]} />
    </article>
  )
}
