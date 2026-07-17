import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Foundations, Figure, SpecRef, InTheWild, Related } from '@/components/docs/prose'
import { IntentTokenAnatomy } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Intent tokens',
  description:
    'Auth51 mints a short-lived token for one action and binds it to a key held by the agent. Learn why copying the token alone is not enough to use it.',
}

export default function IntentTokens() {
  return (
    <article>
      <PageTitle eyebrow="Concepts">Intent tokens</PageTitle>

      <Lead>
        A conventional access token allows its bearer to act as a client. The token may be broad,
        reusable, and valid for an extended period. Anyone who copies it can exercise its
        permissions while it remains valid. For an agent making frequent calls, that creates
        persistent authority that must be carefully protected.
      </Lead>
      <P>
        Auth51 exchanges that credential for an <em>intent token</em>: a short-lived token minted
        for one action when the agent is ready to perform it.
      </P>

      <H2>One token, one intent</H2>
      <P>
        Before an agent accesses a resource, such as charging a card, reading a repository, or
        deleting a row, the client mints a token for that specific operation. The token identifies
        the agent, carries the action&rsquo;s scope, and names the intended audience. It remains valid
        for minutes rather than hours or days, and the resource server verifies it before
        performing the authorized action.
      </P>

      <Foundations title="This is OAuth token exchange, applied per action">
        <p>
          Intent tokens are not a new credential format. They compose existing OAuth mechanisms in
          a specific way. An intent token is obtained through an{' '}
          <strong>OAuth 2.0 Token Exchange</strong>{' '}
          (<a href="https://www.rfc-editor.org/rfc/rfc8693" target="_blank" rel="noreferrer">RFC&nbsp;8693</a>):
          the client presents its existing session or client token, authenticated through the
          normal OAuth flow <a href="/docs/reference">(RFC&nbsp;6749)</a>, and asks the Authority
          to exchange it for a narrower token scoped to one action.
        </p>
        <p>
          Token exchange supports trading a broad token for a more constrained one and can name a
          different subject and audience. Auth51 adds an agent-specific{' '}
          <code>agent_checksum</code> grant so the Authority also verifies which agent is asking
          before issuing the narrower token. The result is a standard JWT{' '}
          <a href="https://www.rfc-editor.org/rfc/rfc7519" target="_blank" rel="noreferrer">(RFC&nbsp;7519)</a>{' '}
          that a resource server can verify using familiar mechanisms.
        </p>
      </Foundations>

      <H2>Bound to a key the agent can&rsquo;t hand over</H2>
      <P>
        Each intent token is bound to an ephemeral key held inside the agent&rsquo;s process through
        proof-of-possession, implemented with DPoP in the specification. A caller must prove that
        it holds the corresponding key when it presents the token. Copying the token from a log is
        therefore not sufficient to use it, and the token also expires shortly afterward.
      </P>

      <H2>What the resource server actually sees</H2>
      <P>
        On the wire, the intent token is an inspectable JWT. It carries the agent identity, one
        scope, the intended audience, a short expiry, and the key binding. The nested{' '}
        <code className="code-inline">intent</code> and{' '}
        <code className="code-inline">agent_proof</code> objects contain the evidence that connects
        the action to a verified agent and its delegation path.
      </P>

      <Figure n={1} caption={<>The claims in an intent token, grouped. Everything a resource server needs to answer &ldquo;who is acting, for what, and can they prove it,&rdquo; in one short-lived JWT.</>}>
        <IntentTokenAnatomy />
      </Figure>

      <Deep title="The claims, one by one">
        <P>
          Standard JWT claims provide the common token semantics: <code className="code-inline">iss</code>{' '}
          (the Authority), <code className="code-inline">aud</code> (the one resource this token is
          for), <code className="code-inline">sub</code> (the agent), and{' '}
          <code className="code-inline">scope</code> (the single permission). Two are especially
          relevant to agent requests: <code className="code-inline">exp</code> is{' '}
          <code className="code-inline">iat + 300s</code> (five minutes), and{' '}
          <code className="code-inline">jti</code> is a unique identifier a resource server can
          remember in order to reject a replay.
        </P>
        <P>
          <code className="code-inline">cnf.jkt</code> contains the DPoP key binding: the thumbprint
          of the key the caller must prove it holds. See proof-of-possession for the verification
          flow.
        </P>
        <P>
          The <code className="code-inline">intent</code> object carries the action itself:
          <code className="code-inline">workflow_step</code> (the one step being executed),
          <code className="code-inline">executed_by</code>, and two integrity hashes,
          <code className="code-inline">delegation_chain</code> and{' '}
          <code className="code-inline">step_sequence_hash</code>.
        </P>
        <P className="!mb-0">
          The <code className="code-inline">agent_proof</code> object carries{' '}
          <code className="code-inline">agent_checksum</code> (the verified identity fingerprint)
          and <code className="code-inline">registration_id</code>, the handle used to revoke a
          compromised agent&rsquo;s registration wholesale. <SpecRef>draft-goswami-agentic-jwt §4.4.2</SpecRef>
        </P>
      </Deep>

      <InTheWild title="Session-token replay">
        In a common replay scenario, an attacker copies a session token from a log, browser, or
        compromised host and presents it from another machine. A bearer token does not identify
        the presenter. A sender-constrained token also requires proof of the bound key, which is
        why Auth51 binds the intent token to that key.
      </InTheWild>

      <H2>It can&rsquo;t grant more than it was given</H2>
      <P>
        When one agent delegates work to another, or one call fans out into several, a derived
        token remains a subset of the token from which it was created. It cannot become a superset.
        Auth51 calls this property non-amplification and enforces it when the token is minted.
      </P>

      <Deep title="How the token proves the path wasn&rsquo;t tampered with">
        <P>
          Two claims make the execution path independently verifiable. When an agent delegates, the
          chain of agent ids is joined with pipes and hashed:{' '}
          <code className="code-inline">SHA-256(&quot;supervisor|planner|patcher&quot;)</code>, truncated
          to 16 hex chars, carried as <code className="code-inline">delegation_chain</code>.
          Completed workflow steps are hashed the same way into{' '}
          <code className="code-inline">step_sequence_hash</code>.
        </P>
        <P className="!mb-0">
          The Authority rejects a request when its chain or step sequence does not match the
          workflow. Including the hashes in the token allows a resource server to detect a skipped
          step or an altered delegation chain without calling back to the Authority.{' '}
          <SpecRef>draft-goswami-agentic-jwt §4.4.4</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/agent-identity', label: 'Agent identity' },
        { href: '/docs/concepts/proof-of-possession', label: 'Proof-of-possession' },
        { href: '/docs/concepts/non-amplification', label: 'Non-amplification' },
        { href: '/docs/reference', label: 'Reference: token claims & standards' },
      ]} />
    </article>
  )
}
