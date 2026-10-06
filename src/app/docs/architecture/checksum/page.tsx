import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PageTitle, Lead, H2, P, Deep, Figure, Callout, SpecRef, Related } from '@/components/docs/prose'
import { ChecksumDiagram } from '@/components/docs/diagrams'

export const metadata: Metadata = {
  title: 'Checksum engine',
  description:
    'The single, byte-identical agent-identity algorithm run on both sides of the trust boundary. The reason a client can verify an agent without it self-declaring its identity.',
}

function VersionRow({
  version,
  status,
  title,
  body,
}: {
  version: string
  status: 'active' | 'legacy'
  title: string
  body: ReactNode
}) {
  const pill =
    status === 'active'
      ? 'text-c-success border-c-success/30 bg-c-success/10'
      : 'text-c-text-3 border-c-border bg-c-surface-2'
  return (
    <li className="rounded-lg border border-c-border bg-c-surface/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-[13px] font-semibold text-c-text font-mono">{version}</span>
        <span className={`text-[10px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 ${pill}`}>
          {status === 'active' ? 'In use' : 'Legacy'}
        </span>
        <span className="text-[13px] font-medium text-c-text">{title}</span>
      </div>
      <p className="text-[13.5px] text-c-text-2 leading-relaxed [&_code]:font-mono [&_code]:text-[12.5px]">
        {body}
      </p>
    </li>
  )
}

export default function ChecksumEngine() {
  return (
    <article>
      <PageTitle eyebrow="Architecture">Checksum engine</PageTitle>

      <Lead>
        The checksum engine is simply Auth51's hashing infrastructure and is an important piece of code that has to run identically
        everywhere. The client computes an agent&rsquo;s fingerprint at runtime, while the Authority independently
        recomputes it <em>at registration</em> (rejecting a submitted checksum that doesn&rsquo;t match) and
        at mint, where it checks the presented fingerprint against the stored value. Since both sides run the
        same bytes, a client can prove &ldquo;this is the registered, unmodified agent&rdquo; without the agent
        ever declaring who it is.
      </Lead>

      <H2>What it hashes</H2>
      <P>
        The checksum is a one-way hash over what makes an agent unique. This includes its id, system prompt,
        model configuration and, the interfaces of its tools. Most of the work
        happens <em>before</em> the hash. First, inputs must be put into a canonical form, so changes that don&rsquo;t
        affect behavior (formatting, key order, framework wrappers) don&rsquo;t move the fingerprint, while
        any change that does is always caught.
      </P>

      <Figure n={1} caption={<>Identity inputs are canonicalized, then hashed once. The same logical agent yields the same checksum across frameworks and formatting.</>}>
        <ChecksumDiagram />
      </Figure>

      <H2>Versions</H2>
      <P>
        The Authority can compute and store five different checksum formats at registration. Mint accepts a match
        against any stored value, so older clients keep working. For new integrations, use{' '}
        <strong>v3 or v4 at runtime</strong> (depending on whether in-process tool interfaces are
        available) and <strong>v5 at registration</strong> (for the CI/CD path that seals the tool source).
      </P>

      <ul className="my-5 space-y-4">
        <VersionRow
          version="v3"
          status="active"
          title="Identity-only"
          body={<>SHA3-512 over agent id, prompt, and config, with <em>no tools</em>. The default at runtime when tool interfaces aren&rsquo;t available (provider-egress observation, prompt-only agents).</>}
        />
        <VersionRow
          version="v4"
          status="active"
          title="Identity + in-process tools"
          body={<>Extends v3 with normalized interfaces of in-process tools (names, descriptions, parameter schemas). Used at runtime when the embed captures those tools. Detects a swapped tool, not only an edited prompt.</>}
        />
        <VersionRow
          version="v5"
          status="active"
          title="Registration seal"
          body={<>Extends v4 with AST-normalized source for in-process tools. Computed at build/CI registration (<code className="code-inline">auth51 register</code>), stored as <code className="code-inline">checksum_v5</code>, and verified on read-back. Not used for wire-derived runtime matching; it is the strongest registration-time integrity check.</>}
        />
      </ul>

      <Deep title="Legacy checksum versions (v1 and v2)">
        <P>
          These are still computed and stored on every registration, and mint still accepts them, so
          agents registered under Patchet or earlier Auth51 releases aren&rsquo;t orphaned. New work should
          not target them.
        </P>
        <ul className="space-y-4 mb-0">
          <VersionRow
            version="v1"
            status="legacy"
            title="Patchet-compatible"
            body={<>SHA-256, bare hex, whitespace-collapsed prompt, no Unicode NFC folding. The registration ack still returns v1 for Patchet clients that echo it at mint. Legacy only.</>}
          />
          <VersionRow
            version="v2"
            status="legacy"
            title="Full-component (canonical stored)"
            body={<>SHA3-512, self-describing (<code className="code-inline">sha3-512:…</code>), over prompt, config, <em>and</em> tools, with Unicode NFC folding. Stored as the canonical <code className="code-inline">checksum</code> column and used for duplicate detection at registration. Superseded by v3+ for runtime identity.</>}
          />
        </ul>
      </Deep>

      <Callout kind="warning">
        This is a wire and registration <em>contract</em>. Changing the algorithm changes the
        fingerprint of every already-registered agent. That is a breaking change. It&rsquo;s pinned to golden
        vectors; a single differing output byte is a release blocker, and a new behavior means a new
        version, never an edit to an existing one.
      </Callout>

      <Deep title="How the same bytes run in two places">
        <P>
          The hashing layer is shared verbatim between the client and the Authority. The client&rsquo;s
          copy is byte-identical to the Authority&rsquo;s, and parity is proven by a conformance test that
          pins both to the same golden vectors. Only the <em>extraction</em> layer differs: turning a
          live agent (in LangGraph, CrewAI, or a hand-rolled loop) into the canonical identity inputs
          is framework-aware and client-side; the hashing over those inputs is not.
        </P>
        <P className="!mb-0">
          Canonicalization is what makes that portable: tool signatures are stripped of framework
          wrapper parameters, source is normalized through the AST (docstrings and comments removed),
          and structured inputs are serialized with sorted keys. An independent Go implementation even
          uses a different hash (BLAKE2b-256). The protocol only requires a collision-resistant hash,
          which is why the spec keeps the primitive separate from the logic.{' '}
          <SpecRef href="/docs/reference">draft-goswami-agentic-jwt §5</SpecRef>
        </P>
      </Deep>

      <Related items={[
        { href: '/docs/concepts/agent-identity', label: 'Concept: agent identity' },
        { href: '/docs/architecture/authority', label: 'Authority: recomputes at registration, verifies at mint' },
        { href: '/docs/architecture/client-runtime', label: 'Client runtime: recomputes it at runtime' },
      ]} />
    </article>
  )
}
