import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { ChecksumDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Checksum engine',
  description:
    'The single, byte-identical agent-identity algorithm run on both sides of the trust boundary. The reason a client can verify an agent without it self-declaring its identity.',
}

export default function ChecksumEngine() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Checksum engine</PageTitle>

      <Lead>
        The checksum engine isn&rsquo;t a service — it&rsquo;s the one piece of code that has to run identically
        everywhere. The client computes an agent&rsquo;s fingerprint at runtime; the Authority computed it
        at registration and recomputes it at mint. Because both sides run the same bytes, a client can
        prove &ldquo;this is the registered, unmodified agent&rdquo; without the agent ever declaring who it is.
      </Lead>

      <H2>What it hashes</H2>
      <P>
        The checksum is a one-way hash over what makes an agent that agent: its id, system prompt,
        model configuration, and — where included — the interfaces of its tools. The important work
        happens <em>before</em> the hash: inputs are put into a canonical form, so changes that don&rsquo;t
        affect behavior (formatting, key order, framework wrappers) don&rsquo;t move the fingerprint, while
        any change that does is always caught.
      </P>

      <Figure n={1} caption={<>Identity inputs are canonicalized, then hashed once. The same logical agent yields the same checksum across frameworks and formatting.</>}>
        <ChecksumDiagram />
      </Figure>

      <H2>The versions, precisely</H2>
      <P>
        You&rsquo;ll see four checksum versions, and the Authority accepts the relevant one at mint:
      </P>
      <P>
        <strong>v1</strong> — patchet-compatible: <code className="code-inline">SHA-256</code>, bare
        hex, whitespace-collapsed prompt with no Unicode NFC folding. Retained so agents registered
        under earlier releases aren&rsquo;t orphaned.
      </P>
      <P>
        <strong>v2</strong> — auth51 native: <code className="code-inline">SHA3-512</code>,
        self-describing (<code className="code-inline">sha3-512:…</code>), over prompt, config,{' '}
        <em>and</em> tools, with Unicode NFC folding.
      </P>
      <P>
        <strong>v3</strong> — identity-only: <code className="code-inline">SHA3-512</code> over id,
        prompt, and config, <em>no tools</em>. The baseline when tool interfaces aren&rsquo;t available at
        the point of computation.
      </P>
      <P>
        <strong>v4</strong> — v3 plus the interfaces of the agent&rsquo;s in-process tools (names,
        normalized signatures, and where configured, AST-normalized source). The strongest form: it
        detects a swapped tool, not just an edited prompt.
      </P>

      <Callout kind="warning">
        This is a wire and registration <em>contract</em>. Changing the algorithm changes the
        fingerprint of every already-registered agent — a breaking change. It&rsquo;s pinned to golden
        vectors; a single differing output byte is a release blocker, and a new behavior means a new
        version, never an edit to an existing one.
      </Callout>

      <Deep title="How the same bytes run in two places">
        <P>
          The hashing layer is shared verbatim between the client and the Authority — the client&rsquo;s
          copy is byte-identical to the Authority&rsquo;s, and parity is proven by a conformance test that
          pins both to the same golden vectors. Only the <em>extraction</em> layer differs: turning a
          live agent (in LangGraph, CrewAI, or a hand-rolled loop) into the canonical identity inputs
          is framework-aware and client-side; the hashing over those inputs is not.
        </P>
        <P className="!mb-0">
          Canonicalization is what makes that portable: tool signatures are stripped of framework
          wrapper parameters, source is normalized through the AST (docstrings and comments removed),
          and structured inputs are serialized with sorted keys. An independent Go implementation even
          uses a different hash (BLAKE2b-256) — the protocol only requires a collision-resistant hash,
          which is why the spec keeps the primitive separate from the logic.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §5</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/agent-identity', label: 'Concept — agent identity' },
        { href: '/docs/architecture/authority', label: 'Authority — recomputes it at mint' },
        { href: '/docs/architecture/client-runtime', label: 'Client runtime — recomputes it at runtime' },
      ]} />
    </article>
  )
}
