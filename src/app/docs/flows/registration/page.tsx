import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { RegistrationFlowDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Registration flow',
  description:
    'How a client, its agents, and their workflows enter the Authority — the one-time step, automatable from CI/CD, that establishes every identity everything else checks against.',
}

export default function RegistrationFlow() {
  return (
    <article>
      <PageTitle eyebrow="Protocol flows">Registration</PageTitle>

      <Lead>
        Everything auth51 enforces at runtime is checked against something registered ahead of time.
        Registration is that one-time step: it establishes the client, each agent&rsquo;s identity, and the
        workflows they run, so that later a mint can be a <em>decision</em> rather than a guess. It&rsquo;s
        designed to be automated — run from a deploy step or CI/CD, not clicked through by hand.
      </Lead>

      <Figure n={1} caption={<>Registration in three exchanges: the client, then each agent (with its checksum and PoP public key), then any workflows. Requests are solid; the Authority&rsquo;s confirmations are dashed.</>}>
        <RegistrationFlowDiagram />
      </Figure>

      <H2>Client registration</H2>
      <P>
        First the application registers as a client. The shim computes a checksum of the client and
        sends a registration request; the Authority verifies the authorization grant, stores a record
        mapping the <code className="code-inline">client_id</code> to that checksum and its granted
        scopes, and returns the id. This is ordinary OAuth client onboarding — the agent-specific part
        comes next.
      </P>

      <H2>Agent registration</H2>
      <P>
        Then each agent registers as its own identity. The shim assembles the agent&rsquo;s signature — its
        prompt, tool interfaces, and configuration — computes the checksum, and sends it along with
        the agent id and the agent&rsquo;s <strong>proof-of-possession public key</strong>. The Authority{' '}
        <em>recomputes</em> the checksum from the submitted signature rather than trusting the client&rsquo;s
        value, stores the mapping of agent id, checksum, granted scopes, granted intents, and PoP key,
        and returns a <code className="code-inline">registration_id</code> — the handle used later to
        revoke the agent wholesale.
      </P>

      <Callout>
        The client checks its own shim&rsquo;s integrity before it registers anything. If the shim has been
        tampered with, registration is refused — a compromised enforcement point can&rsquo;t quietly
        enroll agents.
      </Callout>

      <H2>Workflow registration</H2>
      <P>
        Separately, workflows are registered: the plans agents run, each a set of steps with their
        scopes, dependencies, and approval gates. A workflow can be registered by hand or, more often,
        inferred from the agent&rsquo;s source and tools and registered from CI/CD. The Authority stores
        each workflow so a later run can be validated step by step.
      </P>

      <Deep title="Why registration is a governance boundary, not a formality">
        <P>
          Registration is the one sanctioned path by which an agent&rsquo;s identity enters the trusted
          core. Everything downstream — minting, verification, discovery — assumes that what&rsquo;s
          registered was deliberately approved. That&rsquo;s why an <em>un</em>registered agent doesn&rsquo;t just
          fail quietly: its content is routed to <a href="/docs/architecture/discovery">discovery</a>{' '}
          for review, and its mint is denied until a human approves it into the registry.
        </P>
        <P className="!mb-0">
          Re-registering the same agent id with a different checksum doesn&rsquo;t overwrite — it creates a
          new, versioned record, so a prompt or tool change is tracked rather than silently accepted.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §5.4 · §6.2</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/flows/minting', label: 'Next — token minting' },
        { href: '/docs/architecture/authority', label: 'Architecture — the Authority' },
        { href: '/docs/concepts/agent-identity', label: 'Concept — the checksum it stores' },
      ]} />
    </article>
  )
}
