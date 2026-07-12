import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Concepts',
  description:
    'Understand how auth51 works: agent identity, intent tokens, proof-of-possession, non-amplification, discovery, and MCP governance.',
}

const CONCEPTS = [
  { href: '/docs/concepts/agent-identity', title: 'Agent identity',
    body: 'What makes an agent that agent — and why identity is a fingerprint of the code, not a secret it carries.' },
  { href: '/docs/concepts/intent-tokens', title: 'Intent tokens',
    body: 'One short-lived credential per action, bound to a key the agent can’t hand over. Why a stolen one is inert.' },
  { href: '/docs/concepts/proof-of-possession', title: 'Proof-of-possession (DPoP)',
    body: 'How auth51 binds a token to the process that minted it, so copying it out of a log gets you nowhere.' },
  { href: '/docs/concepts/capabilities', title: 'Capabilities & the surface',
    body: 'Where scopes come from: the installed tool surface, the resource-server catalog, and the two namespaces a grant draws on.' },
  { href: '/docs/concepts/grants-and-scopes', title: 'Grants & scopes',
    body: 'The ceiling on what an agent may mint — base scopes plus gated step-up scopes, derived at registration and enforced at mint.' },
  { href: '/docs/concepts/workflows', title: 'Workflows & steps',
    body: 'Ordered plans with per-step scopes, prerequisites, and approval gates — so a run can’t skip ahead.' },
  { href: '/docs/concepts/delegation', title: 'Delegation & chains',
    body: 'How a hand-off between agents is recorded, hashed into the token, and validated so the path can’t be forged.' },
  { href: '/docs/concepts/non-amplification', title: 'Non-amplification',
    body: 'Why a delegated or fanned-out call can never end up with more authority than the one it came from.' },
  { href: '/docs/concepts/discovery', title: 'Discovery & the trust boundary',
    body: 'How unregistered agents surface for review without their prompts ever entering the authority.' },
  { href: '/docs/concepts/mcp', title: 'MCP governance',
    body: 'Governing what an agent can do through third-party MCP servers, tool call by tool call.' },
]

export default function ConceptsIndex() {
  return (
    <div>
      <PageTitle eyebrow="Concepts">Concepts</PageTitle>
      <Lead>
        The pages here explain how auth51 works and why it&rsquo;s built the way it is. You
        don&rsquo;t need them to get started, but they&rsquo;re worth reading once — they&rsquo;re short,
        and each one starts from a problem you already have.
      </Lead>
      <P>Read them in order the first time; they build on each other.</P>

      <ul className="mt-8 space-y-3">
        {CONCEPTS.map((c) => (
          <li key={c.title}>
            {c.href ? (
              <Link href={c.href} className="group block rounded-xl border border-c-border bg-c-surface p-4 no-underline hover:border-c-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-c-text">{c.title}</span>
                  <span className="text-c-accent-2 transition-transform group-hover:translate-x-0.5">→</span>
                </div>
                <p className="mt-1 text-[13px] text-c-text-2 leading-relaxed">{c.body}</p>
              </Link>
            ) : (
              <div className="rounded-xl border border-dashed border-c-border p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-c-text-2">{c.title}</span>
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-c-text-3 border border-c-border rounded px-1">soon</span>
                </div>
                <p className="mt-1 text-[13px] text-c-text-3 leading-relaxed">{c.body}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
