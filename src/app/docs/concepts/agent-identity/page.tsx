import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { ChecksumDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Agent identity',
  description:
    "An agent's identity in auth51 is a fingerprint of what it is — its prompt and tools — not a secret it carries. Here's why that matters, and how the fingerprint is computed.",
}

export default function AgentIdentity() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Agent identity</PageTitle>

      <Lead>
        Every request an agent makes looks the same to the service on the other end. A
        shopping agent, a stray script, a token replayed from last week — same bearer
        header, same shape. The service can&rsquo;t tell them apart, so it can&rsquo;t ask the one
        question that matters: who is really calling, and are they still who they were?
      </Lead>
      <P>auth51 answers that with a fingerprint.</P>

      <H2>Identity is what the agent is, not a secret it holds</H2>
      <P>
        API keys and passwords are things an agent <em>has</em>. They get copied, leaked,
        or handed to the wrong process, and the credential itself tells you nothing about
        whether the code behind it changed.
      </P>
      <P>
        An auth51 agent&rsquo;s identity works the other way around. It&rsquo;s a hash of the things
        that make the agent that agent: its system prompt, the tools it can call, and its
        model configuration. We call that hash a <code className="code-inline">checksum</code>.
        Edit the prompt or add a tool, and the checksum moves with it. Nothing is stored
        inside the agent and handed over on request — the identity is recomputed from what
        the agent actually is, every time it runs.
      </P>
      <P>
        That has a useful side effect. An agent whose prompt was quietly edited, or that
        had a tool swapped in, no longer matches its registered fingerprint. It doesn&rsquo;t
        inherit the trust you gave the original. It shows up as something new.
      </P>

      <Foundations title="Why OAuth needs this at all">
        <p>
          OAuth 2.0 <a href="/docs/reference">(RFC&nbsp;6749)</a> was built on an assumption:
          the client application faithfully represents the user&rsquo;s intent. You authorize an
          app once, it gets a token, and every call it makes with that token is taken to be
          something you asked for. For a web app with fixed code, that holds.
        </p>
        <p>
          Autonomous agents break the assumption. They generate their own plans, spawn
          sub-agents, and decide which tools to call without a human in the loop — and their
          behavior is driven by a prompt that can be edited, injected into, or swapped. The
          token still says &ldquo;this app, acting for this user,&rdquo; but the <em>thing</em> holding
          the token is no longer fixed. The draft calls this gap the{' '}
          <em>intent-execution separation problem</em>. A checksum closes it by making the
          running agent&rsquo;s exact identity part of every authorization decision.
        </p>
      </Foundations>

      <InTheWild title="SolarWinds, 2020">
        Attackers slipped malicious code into a trusted, signed software build. Everything
        downstream kept trusting it, because the signature still checked out. Identity tied
        to <em>what the code is</em>, rather than to a key it carries, is the property that
        breaks that chain: change the code, and the fingerprint changes with it.
      </InTheWild>

      <H2>How the fingerprint is computed</H2>
      <P>
        The checksum is a one-way hash (SHA3-512) over the agent&rsquo;s identity inputs. The
        important design choice is what happens <em>before</em> the hash: the inputs are put
        into a canonical form first, so that changes which don&rsquo;t affect behavior don&rsquo;t
        change the identity, while any change that does is always caught.
      </P>

      <Figure n={1} caption={<>Identity inputs are canonicalized, then hashed once. The same logical agent yields the same checksum across frameworks and formatting.</>}>
        <ChecksumDiagram />
      </Figure>

      <Deep title="What canonicalization does — and why it matters across frameworks">
        <P>
          Without normalization, the same logical tool would fingerprint differently in
          LangChain, CrewAI, or a hand-rolled loop — different wrapper parameters, different
          whitespace, different key ordering. The checksum would be brittle and framework-specific.
          auth51 normalizes so the identity tracks meaning, not packaging:
        </P>
        <P>
          <strong>Tool signatures</strong> are stripped of framework wrapper parameters
          (the <code className="code-inline">*args</code>/<code className="code-inline">**kwargs</code>{' '}
          catch-alls a framework injects) before hashing, so a tool means the same thing
          regardless of who wraps it.
        </P>
        <P>
          <strong>Tool source code</strong>, when included, is normalized through the
          Abstract Syntax Tree: parse to AST, remove docstrings (captured separately) and
          comments, then unparse to a canonical form. Reformatting the code doesn&rsquo;t move the
          checksum; changing the logic always does.
        </P>
        <P>
          <strong>Structured inputs</strong> (config, tool metadata) are serialized with
          sorted keys, so map ordering can&rsquo;t produce two different hashes for the same content.
        </P>
        <P className="!mb-0">
          <SpecRef>draft-goswami-agentic-jwt §5</SpecRef>{' '}specifies the normalization rules in full.
        </P>
      </Deep>

      <H2>You don&rsquo;t tell auth51 which agent is running</H2>
      <P>
        Here&rsquo;s the part people don&rsquo;t expect. You never call{' '}
        <code className="code-inline">identify(&quot;shopping-agent&quot;)</code>. The client
        watches your agent talk to its model, reads the system prompt off that request, and
        recomputes the checksum against the agents your org has registered. A match
        identifies the agent <em>and</em> proves it hasn&rsquo;t changed, in a single step.
        There&rsquo;s no self-declaration for an impostor to fake.
      </P>
      <P>
        No match is information too. It means an agent is running that you haven&rsquo;t
        registered — worth a look. auth51 surfaces it for you to review instead of trusting
        it quietly. That&rsquo;s what Discovery is for.
      </P>

      <H2>The checksum, in four flavors</H2>
      <P>
        You&rsquo;ll see checksum versions referenced as v1 through v4. The short version: v3
        hashes the agent&rsquo;s identity — its id, prompt, and config; v4 also folds in the
        interface of its in-process tools. v1 and v2 exist for backward compatibility. The
        client and the authority agree on which format to use, so you rarely touch this directly.
      </P>

      <Deep title="Exactly what goes into each version">
        <P>
          All four are SHA3-512 over a canonicalized input; they differ in what that input includes.
        </P>
        <P>
          <strong>v1 / v2</strong> — legacy identity hashes retained for compatibility with
          agents registered under earlier releases. The authority still validates them so an
          upgrade never orphans a registered agent.
        </P>
        <P>
          <strong>v3</strong> — identity-only: agent id, system prompt, and model
          configuration. This is the baseline used when tool interfaces aren&rsquo;t available at
          the point of computation.
        </P>
        <P>
          <strong>v4</strong> — v3 plus the interfaces of the agent&rsquo;s in-process tools
          (names, normalized signatures, and where configured, AST-normalized source). This
          is the strongest form: it detects a swapped tool, not just an edited prompt.
        </P>
        <P className="!mb-0">
          When an agent registers, the authority recomputes the checksum itself rather than
          trusting the one submitted — client and server independently arrive at the same
          fingerprint, or registration fails. Re-registering the same agent id with a
          different checksum creates a new, versioned record; the latest is used for
          validation. <SpecRef>draft-goswami-agentic-jwt §5.2</SpecRef>
        </P>
      </Deep>

      <H2>Where identity shows up</H2>
      <P>
        In two places. At the model call, to work out which agent is running — that&rsquo;s
        Discovery. And on every governed action, folded into the intent token so the
        resource server can check who acted before it does the work — that&rsquo;s intent
        tokens, next.
      </P>

      <Related items={[
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
        { href: '/docs/start', label: 'Quickstart — see it identify an agent' },
        { href: '/docs/reference', label: 'Reference — the protocol draft & RFCs' },
      ]} />
    </article>
  )
}
