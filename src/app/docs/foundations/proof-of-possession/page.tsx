import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, SpecRef, InTheWild, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Proof-of-possession (DPoP & mTLS)',
  description:
    'Sender-constraining a token so a stolen copy is inert. The two standard ways to do it — DPoP and mTLS — and why auth51 chose DPoP, bound per action.',
}

export default function ProofOfPossessionFoundations() {
  return (
    <article>
      <PageTitle eyebrow="Foundations">Proof-of-possession (DPoP &amp; mTLS)</PageTitle>

      <Lead>
        A bearer token&rsquo;s weakness is in its name. <em>Sender-constrained</em> tokens fix it: the
        token is bound to a key, and using it requires proving you hold that key. Two standards do
        this; auth51 uses one of them, and applies it at a finer grain than either was originally
        aimed at.
      </Lead>

      <H2>The idea: bind the token to a key</H2>
      <P>
        Proof-of-possession (PoP) turns a token from &ldquo;anyone holding this string wins&rdquo; into
        &ldquo;anyone holding this string <em>and</em> the matching private key wins.&rdquo; The token carries
        a commitment to a public key; the caller proves possession of the corresponding private
        key at request time. A token copied out of a log is now a dead artifact — the attacker has
        the string but not the key.
      </P>

      <H2>Two standard ways to do it</H2>
      <P>
        <strong>mTLS</strong> binds the token to a client TLS certificate: strong, but it operates
        at the transport layer, needs certificate provisioning and management, and binds at the
        connection rather than the request. It says nothing about application-level intent or which
        agent inside a process is calling.
      </P>
      <P>
        <strong>DPoP</strong> — Demonstrating Proof-of-Possession{' '}
        <SpecRef href="https://www.rfc-editor.org/rfc/rfc9449">(RFC 9449)</SpecRef> — does it at the
        application layer with no PKI. The client holds an ephemeral keypair; the issued token
        carries a <code className="code-inline">cnf</code> (confirmation) claim naming the public
        key&rsquo;s thumbprint, <code className="code-inline">jkt</code>. Each request carries a small
        signed <em>DPoP proof</em>. A resource server checks the proof&rsquo;s key hashes to the token&rsquo;s{' '}
        <code className="code-inline">cnf.jkt</code>, statelessly, with no callback.
      </P>

      <H2>Why auth51 chose DPoP</H2>
      <P>
        Agents don&rsquo;t have stable client certificates; they have short-lived processes that come
        and go, sometimes many to a host. DPoP fits that: a keypair is generated in the agent
        process, lives only as long as it&rsquo;s needed, and never touches disk or the wire. Because the
        binding is application-layer, it composes cleanly with everything else in the token — the
        checksum, the intent claim — rather than living off to the side at the transport.
      </P>
      <P>
        There&rsquo;s a note in the protocol work worth surfacing: DPoP by itself doesn&rsquo;t close the
        intent–execution gap. It proves the <em>client application</em> holds a key; it says nothing
        about <em>which agent</em> is acting or <em>what</em> the action is. PoP is one of three
        ingredients, not the whole answer — which is why auth51 pairs it with agent identity and
        intent binding rather than treating sender-constraint as sufficient on its own.
      </P>

      <H2>Bound per action, not per session</H2>
      <P>
        The other shift is grain. Classic PoP binds a long-lived session token to a key. auth51
        binds a token that&rsquo;s good for one action and a few minutes. The key still never leaves the
        process, but the window in which any single token matters is tiny — so even a momentary key
        compromise buys an attacker almost nothing.
      </P>

      <InTheWild title="The replay that DPoP kills">
        Token replay is the boring, common breach: lift a valid token from a log, a memory dump, or
        an intercepted response, and present it from your own machine. Against a bearer token it
        just works. Against a sender-constrained one it fails at the first check — the attacker
        can&rsquo;t produce a proof for a key they don&rsquo;t hold, and the token&rsquo;s <code className="code-inline">cnf.jkt</code>{' '}
        won&rsquo;t match anything they can sign.
      </InTheWild>

      <Deep title="How this looks inside an intent token">
        <P>
          In auth51, the <code className="code-inline">cnf.jkt</code> lives right in the intent token
          alongside the identity and intent claims, and the DPoP proof is generated fresh per
          request. The Concepts page walks the exact mint-then-prove sequence with a diagram; this
          page is about the standard the sequence is built from.
        </P>
        <P className="!mb-0">
          One deliberate exception: tokens handed to an MCP server carry no{' '}
          <code className="code-inline">cnf</code>, because the server — not the agent — makes the
          downstream call, so the binding moves to the token the server mints. That&rsquo;s covered under
          MCP governance. <SpecRef href="https://www.rfc-editor.org/rfc/rfc9449">RFC 9449</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/proof-of-possession', label: 'Concept — how auth51 applies PoP' },
        { href: '/docs/foundations/zero-trust', label: 'Zero-Trust alignment' },
        { href: '/docs/concepts/mcp', label: 'Concept — MCP governance' },
      ]} />
    </article>
  )
}
