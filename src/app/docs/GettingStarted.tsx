'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageTitle, Lead } from '@/components/docs/prose'

/**
 * Getting Started, written as a *lesson* (react.dev-style):
 * hook with the outcome → teach the one mental model → motivate each step
 * before its code → interleave prose/code with Note/Pitfall/Deep-dive callouts
 * → show the result → recap + next steps.
 *
 * IMPORTANT (theming): this page lives on the dark marketing canvas. The
 * editorial `text-ink` / `bg-bg-subtle` tokens are LIGHT-mode values that the
 * `.dark` class never overrides, so using them here renders dark-on-dark. We use
 * the theme-aware `--c-*` console tokens (text-c-text / c-text-2 / c-text-3,
 * bg-c-surface, border-c-border, text-c-accent) which are tuned for contrast.
 */

type PersonaId = 'has-app' | 'mcp' | 'no-app'

const PERSONAS: { id: PersonaId; label: string; blurb: string; status: 'ready' | 'preview' | 'soon' }[] = [
  { id: 'has-app', label: 'I have an agent app', blurb: 'A Python agent making outbound calls: LangGraph, CrewAI, or your own', status: 'ready' },
  { id: 'mcp',     label: 'I call MCP servers',  blurb: 'Govern what your agents can do through third-party MCP tools', status: 'preview' },
  { id: 'no-app',  label: "I'm just exploring",  blurb: 'See it work end to end before you write any code', status: 'soon' },
]

export function GettingStarted() {
  const [persona, setPersona] = useState<PersonaId>('has-app')

  return (
    <div>
      <PageTitle eyebrow="Get started">Give every agent action an identity you can verify</PageTitle>
      <Lead>
        auth51 mints a scoped, single-use token for every outbound call your agent
        makes. It&apos;s created at the source, bound to a key that never leaves the process,
        and verified at the resource. No auth code in your tools. Pick where you&apos;re
        starting from.
      </Lead>

      <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PERSONAS.map((p) => {
          const active = p.id === persona
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={[
                'text-left rounded-xl border p-4 transition-colors',
                active
                  ? 'border-c-accent bg-c-accent/[0.08]'
                  : 'border-c-border bg-c-surface hover:border-c-accent/50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-c-text">{p.label}</span>
                <StatusPill status={p.status} />
              </div>
              <p className="mt-1.5 text-[12.5px] text-c-text-3 leading-snug">{p.blurb}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-14">
        {persona === 'has-app' && <HasAppLesson />}
        {persona === 'mcp' && <McpGuide />}
        {persona === 'no-app' && <NoAppGuide />}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: 'ready' | 'preview' | 'soon' }) {
  const map = {
    ready:   { t: 'Ready',   c: 'text-c-success border-c-success/30 bg-c-success/10' },
    preview: { t: 'Preview', c: 'text-c-accent-2 border-c-accent/30 bg-c-accent/10' },
    soon:    { t: 'Soon',    c: 'text-c-text-3 border-c-border bg-c-surface-2' },
  }[status]
  return (
    <span className={`shrink-0 text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${map.c}`}>
      {map.t}
    </span>
  )
}

// ── Persona A: the guided lesson (shippable today) ──────────────────────────

function HasAppLesson() {
  return (
    <div>
      {/* Constructive scare: make the invisible risk visible, then the fix. */}
      <p className="text-[17px] text-c-text leading-relaxed">
        Right now, when your agent calls a tool or an API, nothing proves{' '}
        <span className="text-c-text font-medium">which</span> agent made the call,
        that its instructions weren&apos;t tampered with, or that a leaked token isn&apos;t
        being replayed by something else. That risk is invisible until it isn&apos;t.
        auth51 makes every agent action carry a verifiable identity, and turning it
        on is a single <code className="code-inline">import</code>.
      </p>

      <YouWillLearn items={[
        <>Why an agent&apos;s identity is a <em>fingerprint</em> of what it is, not a password</>,
        <>How one import makes your agents identify themselves, with no code changes</>,
        <>How an unregistered agent shows up for you to approve</>,
        <>Where to watch it happen, live</>,
      ]} />

      {/* The one idea: the mental model before any mechanics. */}
      <SectionHeading>The one idea</SectionHeading>
      <p className="text-body text-c-text-2 leading-relaxed">
        An agent&apos;s identity is a fingerprint of{' '}
        <span className="text-c-text">what it is</span>: its system prompt and the tools
        it can call, not a secret it carries. The auth51 client watches your agent talk to its model, computes
        that fingerprint (a <code className="code-inline">checksum</code>), and matches it
        against the agents your org has registered. A match <span className="text-c-text">
        identifies</span> the agent with no self-declaration; no match means it&apos;s
        unregistered, a signal in itself. You never tell auth51 which agent is running;
        it derives it.
      </p>

      <BeforeAfter />

      {/* The zero-config quickstart. */}
      <SectionHeading>Quickstart</SectionHeading>

      <Step n={1} title="Create an API key">
        <p className="text-body text-c-text-2 leading-relaxed">
          Sign in to the <DocLink href="/console/onboarding">console</DocLink> (you get
          an org automatically) and create a key under{' '}
          <span className="text-c-text font-medium">Settings → API Keys</span>. Set it in
          your agent&apos;s environment; the client reads it on import.
        </p>
        <CodeBlock label="env">{`export AUTH51_CLIENT_ID=a51_live_...     # Settings → API Keys
export AUTH51_CLIENT_SECRET=...          # shown once`}</CodeBlock>
        <Callout kind="note">
          The key is clamped to your org and a safe scope envelope, so even if it leaks it
          can&apos;t approve escalations or reach another tenant. On AWS you can skip the
          secret entirely with <DocLink href="/console/settings/workload-identities">keyless
          workload identity</DocLink> (the agent proves its IAM role).
        </Callout>
      </Step>

      <Step n={2} title="Install and import">
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          That&apos;s the whole integration. One import installs egress interception and,
          on your agent&apos;s first model call, identifies it from the wire. No{' '}
          <code className="code-inline">configure()</code>, no wrapping your code, no
          audiences to declare.
        </p>
        <CodeBlock label="shell">{`pip install auth51`}</CodeBlock>
        <div className="h-3" />
        <CodeBlock label="your_app.py">{`import auth51        # ← that's it

# ...run your agent exactly as you already do.
run_your_agent()`}</CodeBlock>
      </Step>

      <Step n={3} title="Approve it in the console" last>
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          The first time your agent runs, the client sends its observed identity
          (system prompt, tools, computed checksum) to your org&apos;s discovery inbox. It
          appears under <DocLink href="/console/agents/discovered">Agents → Discovered</DocLink>.
          Review what it computed and click <span className="text-c-text font-medium">Register</span>.
          From the next run on, that agent is recognized and its actions are governed.
        </p>
        <ConsolePreview />
        <Callout kind="note">
          The prompt and tools travel only to your discovery inbox for your review. They
          enter the Authority only when you approve. Nothing an unregistered agent does is
          silently trusted (fail-closed).
        </Callout>
      </Step>

      {/* Recap. */}
      <div className="mt-14 rounded-xl border border-c-border bg-c-surface p-6">
        <p className="text-[13px] font-semibold text-c-text mb-3">Recap</p>
        <ul className="space-y-2">
          <RecapItem>API key in the environment plus <code className="code-inline">import auth51</code>: the entire integration.</RecapItem>
          <RecapItem>The client derives each agent&apos;s identity from its model call; you don&apos;t declare anything.</RecapItem>
          <RecapItem>Unregistered agents surface in <span className="text-c-text">Discovered</span> with the identity they computed. Approve to register.</RecapItem>
          <RecapItem>Registered agents are recognized and governed automatically on the next run.</RecapItem>
        </ul>
      </div>

      {/* Advanced: everything the zero-config path hides, for those who need it. */}
      <SectionHeading>Advanced &amp; self-host</SectionHeading>
      <p className="text-body text-c-text-2 leading-relaxed mb-4">
        The defaults above cover the managed (SaaS) path. Reach for these only when you
        need to.
      </p>

      <DeepDive summary="Configure in code instead of env (and self-host)">
        Prefer explicit config, or running your own authority/discovery? Call{' '}
        <code className="code-inline">configure()</code> once at startup. On-prem, point it
        at your own servers. It never falls back to the SaaS discovery for a custom
        authority.
        <div className="mt-3">
          <CodeBlock label="startup.py">{`import auth51

auth51.configure(
    client_id="a51_live_...", client_secret="...",
    # self-host only — SaaS is the default:
    authority_url="https://authority.your-co.internal",
    discovery_url="https://discovery.your-co.internal",
)`}</CodeBlock>
        </div>
      </DeepDive>

      <div className="h-3" />
      <DeepDive summary="Name an agent explicitly, or register from CI/CD">
        The client names discovered agents provisionally from their prompt; the console
        lets you rename on approval. To pin a name yourself, wrap the run in{' '}
        <code className="code-inline">with auth51.agent(&quot;checkout-bot&quot;): ...</code>.
        To register agents ahead of time (e.g. a deploy step) rather than discover them at
        runtime, POST their components to{' '}
        <code className="code-inline">/v1/intent/register/agent</code>, the same call the
        Approve button makes.
      </DeepDive>

      <div className="h-3" />
      <DeepDive summary="Enforce at your resource servers (audiences)">
        Discovery and identity need no configuration. To also <em>mint intent tokens</em>{' '}
        on the calls your agents make to your resource servers, tell the client which
        hosts are auth51-protected via <code className="code-inline">audiences</code> (or{' '}
        <code className="code-inline">AUTH51_AUDIENCES</code>) and verify them with the
        auth51 verifier on those services.
      </DeepDive>

      <SectionHeading>Next steps</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NextCard href="/protocol" title="How it works" body="The intent token, DPoP binding, and non-amplification: the model underneath." />
        <NextCard href="/console/settings/workload-identities" title="Go keyless" body="On AWS, agents authenticate by their IAM role, with no client_secret at all." />
        <NextCard href="/walkthrough" title="See an attack blocked" body="A real run and the exact call auth51 refuses to mint." />
      </div>
    </div>
  )
}

// ── mental-model visual: before / after ─────────────────────────────────────

function BeforeAfter() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-c-danger/25 bg-c-danger/[0.04] p-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-c-danger mb-2">Shared API key</p>
        <p className="text-[13.5px] text-c-text-2 leading-relaxed">
          One long-lived secret. Every call looks identical. A leaked token replays
          anywhere, as anyone, until someone notices and rotates it.
        </p>
      </div>
      <div className="rounded-xl border border-c-accent/30 bg-c-accent/[0.06] p-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-c-accent-2 mb-2">With auth51</p>
        <p className="text-[13.5px] text-c-text-2 leading-relaxed">
          Each call carries a fresh token, scoped to one action, bound to this
          agent&apos;s fingerprint and a key that never leaves the process. A stolen token
          is inert.
        </p>
      </div>
    </div>
  )
}

// ── the "see it happen" payoff mock ─────────────────────────────────────────

function ConsolePreview() {
  return (
    <div className="rounded-xl border border-c-border bg-c-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-c-border flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-c-success animate-pulse" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-c-text-3">console · your org</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-c-border bg-c-bg px-3 py-2.5">
          <div className="min-w-0">
            <div className="font-mono text-[13px] text-c-text truncate">checkout-bot</div>
            <div className="font-mono text-[11px] text-c-text-3 truncate">checksum 3f9a…c21e · 2 tools</div>
          </div>
          <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-c-success border border-c-success/30 bg-c-success/10 px-1.5 py-0.5 rounded">live</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-c-border bg-c-bg px-3 py-2.5">
          <div className="min-w-0">
            <div className="font-mono text-[12.5px] text-c-text truncate">mint · payment:execute → api.acme.com</div>
            <div className="font-mono text-[11px] text-c-text-3 truncate">dpop-bound · exp 60s · agent checkout-bot</div>
          </div>
          <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-c-accent-2 border border-c-accent/30 bg-c-accent/10 px-1.5 py-0.5 rounded">allowed</span>
        </div>
      </div>
    </div>
  )
}

// ── other personas (concise, honest roadmap) ────────────────────────────────

function McpGuide() {
  return (
    <div>
      <p className="text-[17px] text-c-text leading-relaxed">
        If your agents reach tools through MCP servers, auth51 governs them at the
        protocol boundary: a proxy sits in front of the MCP server and turns each tool
        call into an allow/deny decision, with the same intent-token and audit trail.
      </p>
      <RoadmapCard
        title="Available as a proxy today"
        body={<>The <span className="font-mono text-[13px] text-c-text">auth51-mcp-proxy</span> is a
          zero-dependency stdio passthrough that enforces per-tool policy and mints
          intent tokens against the authority. Managed setup from the console
          (one-line install plus policy) is what we&apos;re wiring next.</>}
      />
      <p className="mt-6 text-body text-c-text-2">
        Want the managed MCP path early?{' '}
        <DocLink href="/console/settings">Tell us from the console</DocLink> and
        we&apos;ll turn it on for your org.
      </p>
    </div>
  )
}

function NoAppGuide() {
  return (
    <div>
      <p className="text-[17px] text-c-text leading-relaxed">
        No agent app yet? You&apos;ll be able to build one right here: describe an agent,
        give it a couple of tools, and watch a governed run against a sandboxed
        service, with the plain-OAuth vs. auth51 difference side by side.
      </p>
      <RoadmapCard
        title="Interactive builder, coming soon"
        body={<>Until it ships, the fastest way to see auth51 work end to end is the
          guided walkthrough: a real agent run and the exact attack it blocks, narrated
          step by step.</>}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/walkthrough"
          className="inline-flex items-center rounded-lg bg-c-accent px-4 py-2 text-[13px] font-semibold text-white no-underline hover:bg-c-accent-2">
          See the walkthrough →
        </Link>
        <Link href="/protocol"
          className="inline-flex items-center rounded-lg border border-c-border px-4 py-2 text-[13px] font-semibold text-c-text no-underline hover:border-c-accent/50">
          Read how it works
        </Link>
      </div>
    </div>
  )
}

// ── shared bits ──────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[22px] font-semibold text-c-text mt-14 mb-4 tracking-tight">{children}</h2>
}

function YouWillLearn({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="mt-8 rounded-xl border border-c-border bg-c-surface p-5">
      <p className="text-[11px] font-mono uppercase tracking-wider text-c-text-3 mb-3">You will learn</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px] text-c-text-2 leading-snug">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-c-accent shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Step({ n, title, children, last }: {
  n: number; title: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <div className="relative pl-12 pb-10">
      {!last && <div className="absolute left-[17px] top-10 bottom-0 w-px bg-c-border" />}
      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-c-accent/40 bg-c-accent/10 text-[14px] font-semibold text-c-accent-2">
        {n}
      </div>
      <h3 className="text-[18px] font-semibold text-c-text mb-3 leading-9">{title}</h3>
      {children}
    </div>
  )
}

function Callout({ kind, children }: { kind: 'note' | 'pitfall'; children: React.ReactNode }) {
  const cfg = {
    note:    { label: 'Note',    c: 'border-c-accent/25 bg-c-accent/[0.05]',   dot: 'text-c-accent-2' },
    pitfall: { label: 'Pitfall', c: 'border-c-warning/25 bg-c-warning/[0.05]', dot: 'text-c-warning' },
  }[kind]
  return (
    <div className={`mt-4 rounded-lg border ${cfg.c} px-4 py-3`}>
      <p className={`text-[10.5px] font-mono uppercase tracking-wider mb-1.5 ${cfg.dot}`}>{cfg.label}</p>
      <div className="text-[13.5px] text-c-text-2 leading-relaxed">{children}</div>
    </div>
  )
}

function DeepDive({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="mt-4 group rounded-lg border border-c-border bg-c-surface open:bg-c-surface">
      <summary className="cursor-pointer list-none px-4 py-2.5 flex items-center gap-2 text-[13px] font-medium text-c-text select-none">
        <span className="text-c-accent-2 transition-transform group-open:rotate-90">▸</span>
        Deep dive · {summary}
      </summary>
      <div className="px-4 pb-4 pt-0.5 text-[13.5px] text-c-text-2 leading-relaxed">{children}</div>
    </details>
  )
}

function RecapItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] text-c-text-2 leading-snug">
      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-c-success shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function RoadmapCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-c-border bg-c-surface p-6">
      <p className="text-[14px] font-semibold text-c-text mb-1.5">{title}</p>
      <p className="text-[13.5px] text-c-text-2 leading-relaxed">{body}</p>
    </div>
  )
}

function NextCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href}
      className="group rounded-xl border border-c-border bg-c-surface p-4 no-underline hover:border-c-accent/50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-c-text">{title}</span>
        <span className="text-c-accent-2 transition-transform group-hover:translate-x-0.5">→</span>
      </div>
      <p className="mt-1.5 text-[12.5px] text-c-text-3 leading-snug">{body}</p>
    </Link>
  )
}

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="text-c-accent-2 hover:underline">{children}</Link>
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative rounded-xl border border-c-border bg-c-bg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-c-border flex items-center justify-between">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3">{label}</span>
        <button onClick={copy} className="text-[11px] font-mono text-c-accent-2 hover:underline">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="px-4 py-4 text-[12.5px] font-mono text-c-text overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}
