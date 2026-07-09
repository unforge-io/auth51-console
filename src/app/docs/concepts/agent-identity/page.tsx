import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Agent identity',
  description:
    "An agent's identity in auth51 is a fingerprint of what it is — its prompt and tools — not a secret it carries. Here's why that matters.",
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
        that make the agent that agent: its system prompt and the tools it can call. We
        call that hash a <code className="code-inline">checksum</code>. Edit the prompt or
        add a tool, and the checksum moves with it. Nothing is stored inside the agent and
        handed over on request — the identity is recomputed from what the agent actually
        is, every time it runs.
      </P>
      <P>
        That has a useful side effect. An agent whose prompt was quietly edited, or that
        had a tool swapped in, no longer matches its registered fingerprint. It doesn&rsquo;t
        inherit the trust you gave the original. It shows up as something new.
      </P>

      <InTheWild title="SolarWinds, 2020">
        Attackers slipped malicious code into a trusted, signed software build. Everything
        downstream kept trusting it, because the signature still checked out. Identity tied
        to <em>what the code is</em>, rather than to a key it carries, is the property that
        breaks that chain: change the code, and the fingerprint changes with it.
      </InTheWild>

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
        client and the authority agree on which format to use, so you rarely touch this
        directly. The exact inputs to each are in the reference.
      </P>

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
        { href: '/docs/reference', label: 'Reference — checksum inputs (v1–v4)' },
      ]} />
    </article>
  )
}
