import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle, Lead, P } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Security model',
  description:
    "The threats auth51 is built to stop, the design anchors that stop them, and where each check is enforced — the Zero-Trust reasoning behind the protocol.",
}

const PAGES = [
  { href: '/docs/security/threat-model', title: 'Threat model', n: '1',
    body: 'The agent-specific attacks — spoofed identities, replayed tokens, runtime tampering, privilege escalation across agents — organized by STRIDE, with the real-world precedents behind each.' },
  { href: '/docs/security/security-anchors', title: 'Security anchors', n: '2',
    body: 'The design principles that mitigate the threats: checksum verification, PoP key binding, scope and step authorization, delegation and intent binding, input hygiene — and which threats each one closes.' },
  { href: '/docs/security/enforcement-zones', title: 'Zero-Trust enforcement zones', n: '3',
    body: 'Where the checks actually run: the Authority as the decision point, the client runtime and resource verifier as enforcement points, and why nothing is trusted by location.' },
]

export default function SecurityIndex() {
  return (
    <div>
      <PageTitle eyebrow="Security model">Security model</PageTitle>
      <Lead>
        Everything else in these docs describes how auth51 works. This section describes what it&rsquo;s
        defending against, and why the design holds. It&rsquo;s the part a security reviewer reads first:
        the threats, the anchors that mitigate them, and where enforcement lives.
      </Lead>
      <P>
        The analysis here is re-derived from the protocol&rsquo;s threat model — a STRIDE enumeration of
        the attacks that become possible once the client is a non-deterministic agent, and the
        mechanisms the protocol introduces to answer each one.
      </P>

      <ul className="mt-8 space-y-3">
        {PAGES.map((f) => (
          <li key={f.href}>
            <Link href={f.href} className="group block rounded-xl border border-c-border bg-c-surface p-4 no-underline hover:border-c-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-c-text-3 border border-c-border rounded px-1.5 py-0.5 shrink-0">{f.n}</span>
                <span className="text-[15px] font-semibold text-c-text">{f.title}</span>
                <span className="ml-auto text-c-accent-2 transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-1.5 text-[13px] text-c-text-2 leading-relaxed">{f.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
