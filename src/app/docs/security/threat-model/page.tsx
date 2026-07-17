import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Threat model',
  description:
    'The agent-specific attacks Auth51 is designed to address, including identity spoofing, token replay, runtime tampering, cross-agent escalation, and forged intent.',
}

export default function ThreatModel() {
  return (
    <article>
      <PageTitle eyebrow="Security model">Threat model</PageTitle>

      <Lead>
        A conventional OAuth threat model assumes a client with fixed behavior. An agent can instead
        select tools, generate plans, and spawn sub-agents at runtime based on its prompt and inputs.
        The protocol&rsquo;s threat analysis uses STRIDE to organize twelve attacks that arise from this
        execution model.
      </Lead>
      <P>
        These threats explain why each Auth51 mechanism exists. The security anchors on the next
        page each address one or more of them.
      </P>

      <H2>Where the risk concentrates</H2>
      <P>
        STRIDE defines six categories, and the agent-specific threats in this model fall into five
        of them. Denial of service remains relevant but is not specific to agents. Auth51 treats it
        as an availability concern through measures such as rate limiting the mint path and bounding
        checksum work. The remaining categories cover the identity-driven threats below.
      </P>
      <P>
        <strong>Spoofing</strong> covers three threats: cloning a trusted agent&rsquo;s identity,
        replaying one of its tokens, and replacing the client library with a compromised version.
        Each attacks the system&rsquo;s ability to verify who is acting.
      </P>
      <P>
        <strong>Tampering</strong> covers changes made after an agent or workflow has been trusted:
        modifying the agent&rsquo;s prompt or tools at runtime, injecting instructions through its
        inputs, or rewriting its workflow definition.
      </P>
      <P>
        <strong>Elevation of privilege</strong> covers an agent gaining more authority than intended.
        This includes steering a more privileged agent, skipping a required approval, or minting a
        broader scope than the current step requires.
      </P>
      <P>
        <strong>Repudiation</strong> covers failures in the link between a user&rsquo;s intent and an
        agent&rsquo;s action, including forged intent origins and manipulated delegation chains that hide
        which agent acted.
      </P>
      <P>
        <strong>Information disclosure</strong> covers exposure of an agent&rsquo;s configuration,
        prompts, and tools. That information is sensitive on its own and can also support the
        spoofing attacks described above.
      </P>

      <Callout>
        These threats also map to familiar OWASP categories. The traditional Top 10 includes broken
        access control, cryptographic failures, injection, and insecure design; the LLM Top 10 adds
        concerns such as prompt injection and excessive agency. The failure modes are familiar, but
        the agent introduces a dynamic actor inside the client boundary.
      </Callout>

      <Deep title="All twelve threats, one by one">
        <P><strong>T1 · Agent identity spoofing.</strong> A malicious agent reproduces a legitimate agent&rsquo;s id, prompt, and tool set to present the same fingerprint. This can follow source or configuration exfiltration, including a repository compromise. Checksum verification and client-library integrity address this threat.</P>
        <P><strong>T2 · Token replay.</strong> Another party intercepts a valid intent token from the wire or a memory dump and replays it before it expires. Proof-of-possession binds the token to the key holder that minted it.</P>
        <P><strong>T3 · Client-library impersonation.</strong> A compromised build replaces the trusted client shim and skips its checks. This can result from a supply-chain compromise or local privilege escalation. Library-integrity validation and checksum verification address this threat.</P>
        <P><strong>T4 · Runtime code modification.</strong> An agent&rsquo;s prompt, tools, or configuration are altered <em>after</em> registration through memory injection, a debugger, or reflection. Runtime checksum re-verification and input validation address this threat.</P>
        <P><strong>T5 · Prompt injection.</strong> Crafted inputs or poisoned external data steer the model toward an action that violates policy. Input and output validation reduce this risk, while the per-action grant ceiling still requires the injected action to have an allowed scope.</P>
        <P><strong>T6 · Workflow-definition tampering.</strong> The workflow stored at the authorization server is modified to permit an invalid transition. Compromised administrative credentials or an authorization-server vulnerability can provide the attack vector. Access control on workflow definitions and workflow-state tracking address it.</P>
        <P><strong>T7 · Cross-agent privilege escalation.</strong> A lower-privileged agent manipulates a higher-privileged agent into acting for it, creating a confused-deputy problem. Binding scope to the acting agent&rsquo;s grant and validating the delegation context address this threat.</P>
        <P><strong>T8 · Workflow-step bypass.</strong> An agent skips a required approval or executes steps out of order, for example by calling an API directly instead of using the workflow engine. Workflow-state tracking and per-step authorization at the resource address this threat.</P>
        <P><strong>T9 · Scope inflation.</strong> An agent requests or reuses broader scopes than the current step requires. Scope binding and delegation-context validation enforce the permitted scope at mint.</P>
        <P><strong>T10 · Intent-origin forgery.</strong> The system cannot prove cryptographically which user intent led to an action, allowing its origin to be disputed. Binding a hash of the user&rsquo;s intent into the token lifecycle and applying per-step authorization address this threat.</P>
        <P><strong>T11 · Delegation-chain manipulation.</strong> A delegation path is forged or replayed in another context to conceal the origin of an action. Proof-of-possession key binding and including the intent hash in the chain address this threat.</P>
        <P className="!mb-0"><strong>T12 · Agent-configuration exposure.</strong> Prompts, tools, or configuration are exposed through an API or memory dump. The data is sensitive and can also support T1 and T3. Checksum verification, client-library integrity, and limiting configuration exposure address this threat. <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §9.5–9.6</SpecRef></P>
      </Deep>

      <InTheWild title="These aren't hypothetical">
        <P>
          <strong>SolarWinds (2020)</strong> illustrates the T3 and T4 pattern: downstream systems
          trusted a signed build that contained modified code. Prompt-injection incidents involving
          production assistants illustrate T5. The confused-deputy problem behind T7 is also a
          long-established access-control failure, now applied to agents that delegate work to one
          another programmatically.
        </P>
      </InTheWild>

      <Related items={[
        { href: '/docs/security/security-anchors', label: 'Security anchors: how each threat is answered' },
        { href: '/docs/security/enforcement-zones', label: 'Enforcement zones: where the checks run' },
        { href: '/docs/concepts/agent-identity', label: 'Concept: the identity spoofing attacks target' },
      ]} />
    </article>
  )
}
