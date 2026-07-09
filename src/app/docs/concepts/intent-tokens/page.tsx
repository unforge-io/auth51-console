import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { IntentTokenAnatomy } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Intent tokens',
  description:
    'auth51 mints a short-lived token for one action, bound to a key the agent can’t hand over. Why a stolen token is inert.',
}

export default function IntentTokens() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Intent tokens</PageTitle>

      <Lead>
        A normal access token says &ldquo;the bearer may act as this client.&rdquo; It&rsquo;s broad,
        it&rsquo;s reusable, and anyone who copies it can do everything the client can, for as
        long as it&rsquo;s valid. For an agent making dozens of calls a minute, that&rsquo;s a lot of
        standing power to leave lying around.
      </Lead>
      <P>
        auth51 replaces it with an <em>intent token</em>: a short-lived credential minted
        for one action, at the moment the agent takes it.
      </P>

      <H2>One token, one intent</H2>
      <P>
        When your agent is about to touch a resource — charge a card, read a repo, delete a
        row — the client mints a token scoped to exactly that: the agent&rsquo;s identity, the
        single action, and the audience it&rsquo;s for. It&rsquo;s good for minutes, not hours or
        days. The resource server verifies it and does the one thing it authorizes. There&rsquo;s
        no broad, long-lived session sitting around to steal.
      </P>

      <Foundations title="This is OAuth token exchange, applied per action">
        <p>
          Intent tokens aren&rsquo;t a new credential format — they&rsquo;re standard OAuth composed a
          particular way. Getting one is an <strong>OAuth 2.0 Token Exchange</strong>{' '}
          (<a href="https://www.rfc-editor.org/rfc/rfc8693" target="_blank" rel="noreferrer">RFC&nbsp;8693</a>):
          the client presents what it already has — a session or client token authenticated the
          normal way <a href="/docs/reference">(RFC&nbsp;6749)</a> — and asks the authority to
          exchange it for a narrower token scoped to one action.
        </p>
        <p>
          Token exchange was written for exactly this shape of problem: trading a broad token for a
          more constrained one, optionally naming a different subject and audience. auth51 defines
          an agent-specific grant, <code>agent_checksum</code>, on top of it — so the exchange also
          proves <em>which agent</em> is asking, by checksum, before the narrow token is issued.
          The result is an ordinary JWT <a href="https://www.rfc-editor.org/rfc/rfc7519" target="_blank" rel="noreferrer">(RFC&nbsp;7519)</a>{' '}
          your resource server verifies with nothing exotic.
        </p>
      </Foundations>

      <H2>Bound to a key the agent can&rsquo;t hand over</H2>
      <P>
        A stolen token is only useful if you can present it. Each intent token is bound to
        an ephemeral key held inside the agent&rsquo;s process — proof-of-possession, DPoP in the
        spec. To use the token you have to prove you hold that key. Copy the token out of a
        log and it&rsquo;s inert: you don&rsquo;t have the key, and it expires shortly anyway.
      </P>

      <H2>What the resource server actually sees</H2>
      <P>
        On the wire it&rsquo;s an ordinary JWT you can decode and inspect. It carries the agent&rsquo;s
        identity, the single scope and audience, a tight expiry, the key binding, and — nested
        under <code className="code-inline">intent</code> and{' '}
        <code className="code-inline">agent_proof</code> — the evidence that ties this action to a
        verified agent and an unbroken delegation path.
      </P>

      <Figure n={1} caption={<>The claims in an intent token, grouped. Everything a resource server needs to answer &ldquo;who is acting, for what, and can they prove it&rdquo; — in one short-lived JWT.</>}>
        <IntentTokenAnatomy />
      </Figure>

      <Deep title="The claims, one by one">
        <P>
          The standard JWT claims do the ordinary work: <code className="code-inline">iss</code>{' '}
          (the authority), <code className="code-inline">aud</code> (the one resource this token is
          for), <code className="code-inline">sub</code> (the agent), and{' '}
          <code className="code-inline">scope</code> (the single permission). Two matter especially
          for agents: <code className="code-inline">exp</code> is <code className="code-inline">iat + 300s</code>{' '}
          — five minutes — and <code className="code-inline">jti</code> is a unique id a resource
          server can remember to reject a replay.
        </P>
        <P>
          <code className="code-inline">cnf.jkt</code> is the DPoP key binding — the thumbprint the
          caller must prove it holds (see proof-of-possession).
        </P>
        <P>
          The <code className="code-inline">intent</code> object carries the action itself:
          <code className="code-inline">workflow_step</code> (the one step being executed),
          <code className="code-inline">executed_by</code>, and two integrity hashes —
          <code className="code-inline">delegation_chain</code> and{' '}
          <code className="code-inline">step_sequence_hash</code>.
        </P>
        <P className="!mb-0">
          The <code className="code-inline">agent_proof</code> object carries{' '}
          <code className="code-inline">agent_checksum</code> — the verified identity fingerprint —
          and <code className="code-inline">registration_id</code>, the handle used to revoke a
          compromised agent&rsquo;s registration wholesale. <SpecRef>draft-goswami-agentic-jwt §4.4.2</SpecRef>
        </P>
      </Deep>

      <InTheWild title="Session-token replay">
        A recurring pattern in real breaches: a session token is lifted — from a log, a
        browser, a compromised host — and replayed from the attacker&rsquo;s own machine. A
        plain bearer token doesn&rsquo;t care who presents it. A sender-constrained one does,
        which is the whole point of binding the token to a key.
      </InTheWild>

      <H2>It can&rsquo;t grant more than it was given</H2>
      <P>
        When one agent hands work to another, or a single call fans out into several, the
        token can&rsquo;t quietly widen along the way. A derived token is always a subset of the
        one it came from, never a superset. auth51 calls this non-amplification, and it&rsquo;s
        enforced when the token is minted, not checked after the fact.
      </P>

      <Deep title="How the token proves the path wasn&rsquo;t tampered with">
        <P>
          Two claims make the execution path self-verifying. When an agent delegates, the chain of
          agent ids is joined with pipes and hashed —
          <code className="code-inline">SHA-256(&quot;supervisor|planner|patcher&quot;)</code>, truncated
          to 16 hex chars — and carried as <code className="code-inline">delegation_chain</code>.
          Completed workflow steps are hashed the same way into{' '}
          <code className="code-inline">step_sequence_hash</code>.
        </P>
        <P className="!mb-0">
          The authority rejects a request whose chain or step sequence doesn&rsquo;t match what the
          workflow permits — so a bad path never gets a token. Carrying the hashes <em>in</em> the
          token means a resource server can independently detect a skipped step or an altered
          delegation chain too, without calling back to the authority.{' '}
          <SpecRef>draft-goswami-agentic-jwt §4.4.4</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/agent-identity', label: 'Agent identity' },
        { href: '/docs/concepts/proof-of-possession', label: 'Proof-of-possession' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/reference', label: 'Reference — token claims & standards' },
      ]} />
    </article>
  )
}
