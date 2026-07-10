import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Callout, SpecRef, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Security anchors',
  description:
    'The design principles that mitigate the threat model — checksum verification, PoP key binding, scope and step authorization, delegation and intent binding, input hygiene — and which threats each closes.',
}

export default function SecurityAnchors() {
  return (
    <article>
      <PageTitle eyebrow="Security model">Security anchors</PageTitle>

      <Lead>
        An anchor is a design principle that the protocol leans on to close one or more threats.
        Read the other way, every threat on the previous page is covered by at least one anchor — the
        set is chosen so nothing is left un-mitigated. Grouped by what they assure, they fall into six
        families.
      </Lead>

      <H2>Identity integrity</H2>
      <P>
        The root of everything: proving the agent is who it claims and hasn&rsquo;t changed. The{' '}
        <strong>checksum-verification</strong> anchor recomputes the agent&rsquo;s fingerprint at runtime
        and compares it to the registered value, and <strong>client-library integrity</strong> makes
        sure the component doing that check is itself the genuine one. Together they answer the
        spoofing and runtime-tampering threats — a cloned, modified, or impersonated agent no longer
        matches.
      </P>

      <H2>Token integrity</H2>
      <P>
        A minted token has to be useless to anyone but its holder. <strong>Proof-of-possession key
        binding</strong> ties each token to a per-agent key, so an intercepted or dumped token can&rsquo;t
        be replayed by another agent — and can&rsquo;t be spliced into a different delegation chain.
      </P>

      <H2>Authorization &amp; scope</H2>
      <P>
        Authority has to match the task, not exceed it. <strong>Scope binding</strong> ties the
        authorized scopes to the specific workflow step, and <strong>step authorization</strong>{' '}
        re-checks each step at the resource server. These bound the escalation and scope-inflation
        threats at the point where a token would otherwise be over-issued.
      </P>

      <H2>Workflow &amp; delegation integrity</H2>
      <P>
        Multi-step, multi-agent runs need their structure protected. <strong>Workflow-state
        tracking</strong> keeps the authoritative record of where a run is, <strong>delegation-context
        validation</strong> checks that a hand-off is authentic and bounded, and <strong>access
        control on workflow definitions</strong> stops the plan itself from being rewritten. Together
        they answer step-bypass, definition-tampering, and cross-agent escalation.
      </P>

      <H2>Accountability</H2>
      <P>
        The link between intent and action must be provable after the fact. <strong>Intent-hash
        binding</strong> carries a cryptographic tie between the originating user intent and the
        token lifecycle, which is what removes the deniability behind the repudiation threats.
      </P>

      <H2>Input hygiene</H2>
      <P>
        The model&rsquo;s inputs and outputs are an attack surface of their own. <strong>Input validation
        and sanitization</strong> is the anchor against prompt injection and injected runtime
        modification — necessary, though never sufficient alone, which is why it&rsquo;s backed by the
        grant ceiling rather than relied on by itself.
      </P>

      <Callout>
        No single anchor is load-bearing on its own. The design is defense-in-depth: identity
        integrity makes spoofing hard, token integrity makes a stolen token inert, scope and workflow
        anchors bound what any single token can do, and accountability makes the whole thing
        auditable. An attacker has to defeat several at once.
      </Callout>

      <Deep title="The anchors, and the threats each closes">
        <P><strong>A1 · Agent-checksum verification</strong> — runtime checksum computation compared against the registered value. Closes T1, T3, T4, T12.</P>
        <P><strong>A2 · Client-library integrity</strong> — cryptographic validation that the shim/runtime is authentic. Closes T1, T3, T12.</P>
        <P><strong>A3 · Scope binding</strong> — scopes cryptographically bound to a specific workflow step. Closes T7, T9.</P>
        <P><strong>A6 · Proof-of-possession key binding</strong> — per-agent keys bound to tokens (sender-constraint). Closes T2, T11.</P>
        <P><strong>A7 · Delegation-context validation</strong> — verification that a delegation chain is authentic and bounded. Closes T7, T9.</P>
        <P><strong>A8 · Workflow-state tracking</strong> — the authorization server maintains the authoritative execution state. Closes T6, T7, T8.</P>
        <P><strong>A9 · Intent-hash binding</strong> — a cryptographic tie between user intent and the token lifecycle. Closes T10, T11.</P>
        <P><strong>A10 · Step authorization</strong> — per-step authorization re-checked at resource servers. Closes T8, T10.</P>
        <P><strong>A11 · Authorization-server access control</strong> — protection of the stored workflow definitions. Closes T6.</P>
        <P className="!mb-0"><strong>A12 · Input validation &amp; sanitization</strong> — validation of agent inputs and LLM outputs. Closes T4, T5. <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §9.7</SpecRef></P>
      </Deep>

      <Related items={[
        { href: '/docs/security/threat-model', label: 'Threat model — the threats these close' },
        { href: '/docs/security/enforcement-zones', label: 'Enforcement zones — where anchors are applied' },
        { href: '/docs/concepts/non-amplification', label: 'Concept — the grant ceiling behind the scope anchors' },
      ]} />
    </article>
  )
}
