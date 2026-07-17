import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { ChecksumDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Agent identity',
  description:
    "An agent's identity in Auth51 is a fingerprint of what it is: its prompt and tools, rather than a secret it carries. Learn how that fingerprint is computed and used.",
}

export default function AgentIdentity() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Agent identity</PageTitle>

      <Lead>
        To a receiving service, requests made with the same bearer token have the same identity.
        A shopping agent, an unrelated script, and a replayed request can all present the same
        authorization header. The service cannot distinguish which agent produced the request or
        determine whether that agent still matches the version that was approved.
      </Lead>
      <P>Auth51 adds that distinction through an agent fingerprint.</P>

      <H2>Identity is what the agent is, not a secret it holds</H2>
      <P>
        API keys and passwords are credentials an agent <em>has</em>. They can be copied, leaked,
        or passed to another process. The credential itself does not indicate whether the code or
        configuration using it has changed.
      </P>
      <P>
        An Auth51 agent identity is instead derived from the properties that define the agent:
        its system prompt, the tools it can call, and its model configuration. Auth51 calls the
        resulting hash a <code className="code-inline">checksum</code>. Editing the prompt or adding
        a tool changes that checksum. Rather than presenting a stored identity value, the runtime
        recomputes the identity from the agent that is running.
      </P>
      <P>
        As a result, an agent with an edited prompt or a replaced tool no longer matches its
        registered fingerprint. It is treated as a different identity rather than inheriting the
        trust assigned to the registered agent.
      </P>

      <Foundations title="Why OAuth needs this at all">
        <p>
          OAuth 2.0 <a href="/docs/reference">(RFC&nbsp;6749)</a> assumes that the client
          application faithfully represents the user&rsquo;s intent. Once a user authorizes an
          application, requests made with its token are treated as authorized actions. That model
          works for a web application with fixed code paths.
        </p>
        <p>
          Autonomous agents weaken that assumption because they generate plans, spawn sub-agents,
          and select tools at runtime. Their behavior is driven by a prompt that can be edited,
          injected into, or replaced. The token still identifies the application acting for the
          user, but the agent using it is no longer fixed. The draft calls this the{' '}
          <em>intent-execution separation problem</em>. The checksum addresses it by including the
          running agent&rsquo;s identity in each authorization decision.
        </p>
      </Foundations>

      <InTheWild title="SolarWinds, 2020">
        Attackers inserted malicious code into a trusted, signed software build. Downstream
        systems continued to trust the build because its signature remained valid. An identity
        derived from <em>what the code is</em>, rather than only from a key it carries, changes when
        the code changes.
      </InTheWild>

      <H2>How the fingerprint is computed</H2>
      <P>
        The checksum is a one-way SHA3-512 hash over the agent&rsquo;s identity inputs. Before hashing,
        Auth51 converts those inputs into a canonical form. Changes that do not affect behavior,
        such as formatting or key order, therefore leave the identity unchanged, while behavioral
        changes produce a different checksum.
      </P>

      <Figure n={1} caption={<>Identity inputs are canonicalized, then hashed once. The same logical agent yields the same checksum across frameworks and formatting.</>}>
        <ChecksumDiagram />
      </Figure>

      <Deep title="What canonicalization does, and why it matters across frameworks">
        <P>
          Without normalization, the same logical tool could produce different fingerprints in
          LangChain, CrewAI, or a custom loop because of wrapper parameters, whitespace, and key
          ordering. Auth51 normalizes these differences so the identity represents behavior rather
          than framework-specific packaging.
        </P>
        <P>
          Framework-injected wrapper parameters, including{' '}
          <code className="code-inline">*args</code> and{' '}
          <code className="code-inline">**kwargs</code> catch-alls, are removed from tool
          signatures before hashing. The same logical tool can therefore retain the same identity
          across wrappers.
        </P>
        <P>
          When tool source code is included, it is normalized through the Abstract Syntax Tree.
          Auth51 parses the source, removes comments and docstrings that are captured separately,
          and then converts the AST back to a canonical form. Reformatting does not change the
          checksum, while changing the logic does.
        </P>
        <P>
          Structured inputs, including configuration and tool metadata, are serialized with sorted
          keys. Map ordering therefore cannot produce different hashes for equivalent content.
        </P>
        <P className="!mb-0">
          <SpecRef>draft-goswami-agentic-jwt §5</SpecRef>{' '}specifies the normalization rules in full.
        </P>
      </Deep>

      <H2>How Auth51 identifies the running agent</H2>
      <P>
        Your application does not call{' '}
        <code className="code-inline">identify(&quot;shopping-agent&quot;)</code>. The client observes
        the agent&rsquo;s model request, reads the system prompt from that request, and recomputes the
        checksum against the agents registered in your organization. A match identifies the agent
        and verifies that it has not changed, without relying on a self-declared name.
      </P>
      <P>
        A request with no matching checksum represents an unregistered agent. Auth51 sends that
        identity to Discovery for review rather than treating it as a registered agent.
      </P>

      <H2>The checksum, in four flavors</H2>
      <P>
        Checksum versions are identified as v1 through v4. v3 hashes the agent id, system prompt,
        and model configuration. v4 also includes the interfaces of its in-process tools. v1 and
        v2 remain available for backward compatibility. The client and the Authority agree on the
        format, so applications rarely need to select it directly.
      </P>

      <Deep title="Exactly what goes into each version">
        <P>
          All four versions use SHA3-512 over canonicalized input. They differ in the fields
          included in that input.
        </P>
        <P>
          v1 and v2 are legacy identity hashes retained for agents registered under earlier
          releases. The Authority continues to validate them so those registrations remain usable
          after an upgrade.
        </P>
        <P>
          v3 is identity-only: agent id, system prompt, and model configuration. It is used when
          tool interfaces are not available at the point of computation.
        </P>
        <P>
          v4 extends v3 with the interfaces of the agent&rsquo;s in-process tools, including names,
          normalized signatures, and, where configured, AST-normalized source. It can detect a
          replaced tool as well as an edited prompt.
        </P>
        <P className="!mb-0">
          During registration, the Authority recomputes the checksum rather than trusting the
          submitted value. Registration succeeds only when the client and server independently
          produce the same fingerprint. Registering the same agent id with a different checksum
          creates a new versioned record, and the latest record is used for validation.{' '}
          <SpecRef>draft-goswami-agentic-jwt §5.2</SpecRef>
        </P>
      </Deep>

      <H2>Where identity shows up</H2>
      <P>
        Identity is used in two places. At the model call, it identifies the running agent and
        supports Discovery when no registered match exists. For each governed action, it is also
        included in the intent token so the resource server can verify which agent acted before
        processing the request.
      </P>

      <Related items={[
        { href: '/docs/concepts/intent-tokens', label: 'Intent tokens' },
        { href: '/docs/start', label: 'Quickstart: see it identify an agent' },
        { href: '/docs/reference', label: 'Reference: the protocol draft & RFCs' },
      ]} />
    </article>
  )
}
