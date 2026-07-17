import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, SpecRef, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'The intent–execution gap',
  description:
    'OAuth 2.0 assumes that the client faithfully represents the user’s intent. An autonomous agent determines its own execution, creating the gap Auth51 addresses.',
}

export default function IntentExecutionGap() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">The intent–execution gap</PageTitle>

      <Lead>
        Most authorization decisions assume that the software holding a token is carrying out
        what its user requested. That assumption generally holds for a web application with fixed
        code paths. An autonomous agent can determine its execution at runtime, so intent and
        execution must be evaluated separately. Auth51 is designed to address that gap.
      </Lead>

      <H2>The assumption, stated plainly</H2>
      <P>
        OAuth 2.0 <SpecRef href="https://www.rfc-editor.org/rfc/rfc6749">(RFC 6749)</SpecRef> is a
        delegation framework. A resource owner approves a client, and the authorization server
        issues that client a token. Requests made with the token are then treated as actions the
        user authorized. The specification presumes that the client acts on the resource
        owner&rsquo;s behalf, so the token <em>represents</em> the user&rsquo;s intent.
      </P>
      <P>
        This model worked well when &ldquo;the client&rdquo; was a program with fixed code paths. A
        billing application with the <code className="code-inline">charge:card</code> scope follows
        predefined logic for charging cards. Its intent and execution are linked by the code
        deployed with the application.
      </P>

      <H2>Why an agent breaks it</H2>
      <P>
        An LLM-driven agent changes that relationship. The user approves a goal such as
        &ldquo;patch this dependency&rdquo; or &ldquo;reconcile these invoices,&rdquo; while the agent determines
        which tools to call, in what order, whether to spawn sub-agents, and when to escalate.
        Its plan is generated at runtime from a prompt that can be edited, injected into, or
        replaced. The token still identifies the client acting for the user, but the client&rsquo;s
        execution is no longer fixed in advance.
      </P>
      <P>
        This introduces three structural problems:
      </P>
      <P>
        <strong>There is no per-agent identity.</strong> An orchestrator, its sub-agents, and a
        prompt-injected impostor may all share one <code className="code-inline">client_id</code>.
        They are indistinguishable at the token layer, so the authorization system cannot tell
        which agent is calling or whether that agent was approved.
      </P>
      <P>
        <strong>Intent and execution are separated.</strong> The granted scope covers the goal, but
        the token carries no evidence of the specific action occurring at a given moment. A
        hijacked plan can therefore use the same scope for an action the user did not anticipate.
      </P>
      <P>
        <strong>Bearer tokens can be replayed.</strong> A standard OAuth bearer token{' '}
        <SpecRef href="https://www.rfc-editor.org/rfc/rfc6750">(RFC 6750)</SpecRef> can be used by
        whoever possesses it. If an agent leaks a token into a log, an attacker can exercise that
        token&rsquo;s permissions until it expires or is revoked.
      </P>

      <Deep title="&ldquo;Intent–execution separation,&rdquo; precisely">
        <P>
          The protocol work behind Auth51 calls this the <em>intent–execution
          separation problem</em>. In the non-agentic world, deterministic code naturally enforced
          a fixed workflow. The user&rsquo;s intent and the client&rsquo;s execution were therefore closely
          connected and did not need to be represented separately.
        </P>
        <P className="!mb-0">
          Autonomous agents allow the two to diverge at runtime. Intent therefore becomes a
          first-class, verifiable value in the token rather than an assumption about the client.
          The remaining Foundations pages explain the standards and mechanisms used to make that
          intent explicit.{' '}
          <SpecRef href="https://arxiv.org/abs/2509.13597">arXiv 2509.13597</SpecRef>
        </P>
      </Deep>

      <InTheWild title="One credential, many agents">
        Multi-agent systems commonly run an orchestrator and several workers under one set of
        client credentials, which is consistent with OAuth&rsquo;s client-credentials model. If one of
        those agents is subverted by a poisoned tool result or an injected instruction, its calls
        carry the same client identity as the legitimate agents because the token does not
        distinguish between them.
      </InTheWild>

      <H2>What closing the gap requires</H2>
      <P>
        Closing the gap requires three capabilities that the base standards do not provide on
        their own: identifying <em>which</em> agent is acting and verifying that it has not changed;
        binding a token to <em>one</em> concrete action rather than a broad scope; and preventing a
        stolen token from being used by the party that copied it. The remaining Foundations pages
        cover the underlying standards, including token exchange, DPoP, and Zero-Trust. The
        Concepts section explains how Auth51 combines them.
      </P>

      <Related items={[
        { href: '/docs/foundations/oauth-and-jwt', label: 'OAuth 2.0 & JWT, quickly' },
        { href: '/docs/concepts/agent-identity', label: 'Concept: Agent identity' },
        { href: '/docs/foundations', label: 'Back to Foundations' },
      ]} />
    </article>
  )
}
