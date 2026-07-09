import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, InTheWild, Related } from '@/components/docs/prose'

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

      <H2>Bound to a key the agent can&rsquo;t hand over</H2>
      <P>
        A stolen token is only useful if you can present it. Each intent token is bound to
        an ephemeral key held inside the agent&rsquo;s process — proof-of-possession, DPoP in the
        spec. To use the token you have to prove you hold that key. Copy the token out of a
        log and it&rsquo;s inert: you don&rsquo;t have the key, and it expires shortly anyway.
      </P>

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

      <H2>What the resource server actually sees</H2>
      <P>
        On the wire it&rsquo;s an ordinary JWT you can decode and inspect: the agent&rsquo;s identity
        (its checksum), the scope, the audience, an expiry, and the key binding. Your
        resource server verifies the signature against the authority&rsquo;s public keys and
        checks the binding. None of this is exotic — it&rsquo;s standard OAuth machinery
        (token exchange, JWT, JWK, DPoP) applied once per action instead of once per
        session. The reference lists the exact claims and the RFCs behind each.
      </P>

      <Related items={[
        { href: '/docs/concepts/agent-identity', label: 'Agent identity' },
        { href: '/docs/reference', label: 'Reference — token claims & standards' },
        { href: '/walkthrough', label: 'Walkthrough — watch a replayed token get refused' },
      ]} />
    </article>
  )
}
