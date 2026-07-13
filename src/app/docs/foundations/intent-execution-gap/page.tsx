import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, SpecRef, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'The intent–execution gap',
  description:
    'OAuth 2.0 assumes the client faithfully represents the user’s intent. An autonomous agent decides its own execution, and that gap is the problem auth51 exists to close.',
}

export default function IntentExecutionGap() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">The intent–execution gap</PageTitle>

      <Lead>
        Every authorization decision you make today rests on one quiet assumption: that the
        software holding a token is faithfully carrying out what its user asked for. For a web
        app with fixed code, that assumption is safe. For an autonomous agent, it no longer
        holds. Closing that gap is the reason auth51 exists.
      </Lead>

      <H2>The assumption, stated plainly</H2>
      <P>
        OAuth 2.0 <SpecRef href="https://www.rfc-editor.org/rfc/rfc6749">(RFC 6749)</SpecRef> is a
        delegation framework. A resource owner approves a client, the authorization server issues
        the client a token, and every call the client makes with that token is taken to be
        something the user authorized. The specification is explicit that the client is presumed
        to act on the resource owner&rsquo;s behalf. The token <em>represents</em> the user&rsquo;s intent.
      </P>
      <P>
        This held for a decade because &ldquo;the client&rdquo; was a program with fixed code paths. A
        billing app that has a <code className="code-inline">charge:card</code> scope charges
        cards; it cannot decide one morning to start deleting them. Intent and execution were the
        same thing, welded together at compile time.
      </P>

      <H2>Why an agent breaks it</H2>
      <P>
        An LLM-driven agent severs that weld. The user approves a goal (&ldquo;patch this
        dependency,&rdquo; &ldquo;reconcile these invoices&rdquo;) and the <em>agent</em> decides how: which
        tools to call, in what order, whether to spawn sub-agents, when to escalate. The plan is
        generated at runtime from a prompt that can be edited, injected into, or swapped. The
        token still says &ldquo;this client, acting for this user,&rdquo; but the thing holding it now
        writes its own execution.
      </P>
      <P>
        Three structural cracks open at once:
      </P>
      <P>
        There is no per-agent identity. An orchestrator, its five sub-agents, and a
        prompt-injected impostor all share one <code className="code-inline">client_id</code>. At
        the token layer they are indistinguishable, and the authority cannot tell which one is
        calling, or whether the caller is one it ever approved.
      </P>
      <P>
        Intent and execution are separated. The scope granted covers the goal;
        the execution is unbounded within it. A token minted to &ldquo;read the repo and open a PR&rdquo;
        carries no evidence of <em>which</em> concrete action is happening right now, so a hijacked
        plan spends the same scope on something the user never pictured.
      </P>
      <P>
        Bearer tokens are theft-ready. A standard OAuth token is a bearer token{' '}
        <SpecRef href="https://www.rfc-editor.org/rfc/rfc6750">(RFC 6750)</SpecRef>: whoever holds
        it, wins. One agent that leaks a token into a log hands an attacker everything that token
        can do, for as long as it lives.
      </P>

      <Deep title="&ldquo;Intent–execution separation,&rdquo; precisely">
        <P>
          The gap has a name in the protocol work behind auth51: the <em>intent–execution
          separation problem</em>. In the non-agentic world, deterministic code naturally enforced
          a fixed workflow, so &ldquo;what the user intended&rdquo; and &ldquo;what the client executed&rdquo; were the
          same object and never needed to be written down separately.
        </P>
        <P className="!mb-0">
          Autonomous agents make the two diverge at runtime, so intent has to become a
          first-class, verifiable thing in the token itself rather than an assumption about the
          client. Making intent explicit and cryptographic instead of assumed is what every other
          page in these Foundations serves.{' '}
          <SpecRef href="https://arxiv.org/abs/2509.13597">arXiv 2509.13597</SpecRef>
        </P>
      </Deep>

      <InTheWild title="One credential, many agents">
        The failure isn&rsquo;t hypothetical. Multi-agent systems routinely run an orchestrator and a
        fleet of workers under a single set of client credentials, because that is how OAuth&rsquo;s
        client-credentials model was built. The moment one of those agents is subverted, whether
        by a poisoned tool result or an injected instruction, its calls are authorized just like a
        legitimate one&rsquo;s, because nothing in the token distinguishes them.
      </InTheWild>

      <H2>What closing the gap requires</H2>
      <P>
        Stated as requirements, the fix needs three things the base standards don&rsquo;t provide on
        their own: a way to identify <em>which</em> agent is acting and prove it hasn&rsquo;t changed; a
        way to bind a token to <em>one</em> concrete action rather than a broad scope; and a way to
        make a stolen token useless to whoever stole it. The rest of the Foundations pages walk
        through the standards that supply the raw materials (token exchange, DPoP, Zero-Trust),
        and the Concepts section shows how auth51 assembles them.
      </P>

      <Related items={[
        { href: '/docs/foundations/oauth-and-jwt', label: 'OAuth 2.0 & JWT, quickly' },
        { href: '/docs/concepts/agent-identity', label: 'Concept: Agent identity' },
        { href: '/docs/foundations', label: 'Back to Foundations' },
      ]} />
    </article>
  )
}
