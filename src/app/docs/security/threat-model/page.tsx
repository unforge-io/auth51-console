import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Threat model',
  description:
    'The agent-specific attacks auth51 is built to stop: spoofed identity, token replay, runtime tampering, cross-agent escalation, forged intent. Organized by STRIDE, with real-world precedents.',
}

export default function ThreatModel() {
  return (
    <article>
      <PageTitle eyebrow="Security model">Threat model</PageTitle>

      <Lead>
        A conventional OAuth threat model assumes a fixed client. An agent is not fixed. Its behavior
        is driven by a prompt, it spawns sub-agents, and it picks tools at runtime. That opens up a set
        of attacks the classic model doesn&rsquo;t name. The protocol&rsquo;s threat analysis enumerates twelve
        of them, using STRIDE as the frame.
      </Lead>
      <P>
        Read them as the reason each mechanism exists, not as a checklist. Every anchor on the next
        page traces back to one or more of these.
      </P>

      <H2>Where the risk concentrates</H2>
      <P>
        STRIDE has six categories; the agent-specific threats cluster in five of them. Denial of
        service is real but not agent-specific. It&rsquo;s handled as an availability concern
        (rate-limiting the mint path, bounding checksum work) rather than as a distinct agent threat.
        The other five are where identity-driven controls earn their place:
      </P>
      <P>
        Spoofing covers three. Pretending to be a trusted agent by cloning its identity, replaying a
        token it was issued, or swapping in a compromised client library. All three attack the question
        &ldquo;is this really who it claims to be?&rdquo;
      </P>
      <P>
        Tampering covers three. Changing what the agent is or does after it was trusted: modifying its
        prompt or tools at runtime, injecting instructions through its inputs, or rewriting the workflow
        definition it&rsquo;s supposed to follow.
      </P>
      <P>
        Elevation of privilege covers three. Ending up able to do more than intended: one agent
        steering a higher-privileged one, skipping an approval step, or minting a broader scope than
        the step calls for.
      </P>
      <P>
        Repudiation covers two. Breaking the link between a user&rsquo;s intent and an agent&rsquo;s action:
        forging the origin of an intent, or manipulating a delegation chain to hide who actually acted.
      </P>
      <P>
        Information disclosure covers one. Leaking the agent&rsquo;s own configuration, its prompts and
        tools, which is both sensitive and a map for the spoofing attacks above.
      </P>

      <Callout>
        This maps cleanly onto the OWASP frames a security audience already knows: the classic Top 10
        (broken access control, cryptographic failures, injection, insecure design) plus the LLM Top
        10 (prompt injection, excessive agency). The agent threats are familiar failure modes with a
        new actor in the client seat.
      </Callout>

      <Deep title="All twelve threats, one by one">
        <P><strong>T1 · Agent identity spoofing.</strong> A malicious agent reproduces a legitimate one&rsquo;s id, prompt, and tool set to present an identical fingerprint. Vector: source or config is exfiltrated (a repo compromise) and cloned. Answered by checksum verification and client-library integrity.</P>
        <P><strong>T2 · Token replay.</strong> A valid intent token is intercepted (off the wire or from a memory dump) and replayed by another party before it expires. Answered by proof-of-possession: the token only works for the key-holder that minted it.</P>
        <P><strong>T3 · Client-library impersonation.</strong> The trusted client shim is replaced with a compromised build that quietly skips the checks. Vector: supply-chain compromise or local privilege escalation. Answered by integrity validation of the library and checksum verification.</P>
        <P><strong>T4 · Runtime code modification.</strong> An agent&rsquo;s prompt, tools, or config are altered <em>after</em> it registered cleanly, via memory injection, a debugger, or reflection. Answered by runtime checksum re-verification and input validation.</P>
        <P><strong>T5 · Prompt injection.</strong> Crafted inputs or poisoned external data steer the model into actions that violate policy. Answered by input/output validation combined with the per-action grant ceiling: the injected action still needs a scope it doesn&rsquo;t have.</P>
        <P><strong>T6 · Workflow-definition tampering.</strong> The workflow stored at the authorization server is rewritten to permit transitions it shouldn&rsquo;t. Vector: compromised admin credentials or an AS vulnerability. Answered by access control on workflow definitions and workflow-state tracking.</P>
        <P><strong>T7 · Cross-agent privilege escalation.</strong> A low-privilege agent manipulates a higher-privilege one into acting for it, the confused deputy. Answered by binding scope to the acting agent&rsquo;s own grant and validating the delegation context.</P>
        <P><strong>T8 · Workflow-step bypass.</strong> An agent skips a required approval or runs steps out of order. Vector: direct API calls that dodge the workflow engine. Answered by workflow-state tracking and per-step authorization at the resource.</P>
        <P><strong>T9 · Scope inflation.</strong> An agent requests or reuses broader scopes than the current step needs: excessive agency. Answered by scope binding and delegation-context validation, enforced at mint.</P>
        <P><strong>T10 · Intent-origin forgery.</strong> It can&rsquo;t be proven cryptographically which user intent led to a given action, enabling deniability. Answered by binding a hash of the user&rsquo;s intent into the token lifecycle and per-step authorization.</P>
        <P><strong>T11 · Delegation-chain manipulation.</strong> The delegation path is forged or replayed in a different context to hide the true origin of an action. Answered by PoP key binding and binding the intent hash into the chain.</P>
        <P className="!mb-0"><strong>T12 · Agent-configuration exposure.</strong> Prompts, tools, and configuration leak through an over-exposed API or memory dump, sensitive in itself and fuel for T1/T3. Answered by checksum verification and client-library integrity, and by not exposing configuration in the first place. <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §9.5–9.6</SpecRef></P>
      </Deep>

      <InTheWild title="These aren't hypothetical">
        <P>
          <strong>SolarWinds (2020)</strong> is T3/T4 in the physical world: a trusted, signed build
          carrying modified code that everything downstream kept trusting. <strong>Prompt-injection</strong>{' '}
          incidents against production assistants are T5, already routine. And the{' '}
          <strong>confused-deputy</strong> pattern behind T7 is one of the oldest results in access
          control. It just arrives now at machine speed, between agents that delegate to each other
          thousands of times an hour.
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
