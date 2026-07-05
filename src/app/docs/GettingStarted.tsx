'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Getting Started — written as a *lesson*, not a checklist (react.dev-style):
 * hook with the outcome → teach the one mental model → motivate each step
 * before its code → interleave prose/code with Note/Pitfall/Deep-dive callouts
 * → show the result → recap + next steps.
 *
 * IMPORTANT (theming): this page lives on the dark marketing canvas. The
 * editorial `text-ink` / `bg-bg-subtle` tokens are LIGHT-mode values that the
 * `.dark` class never overrides — using them here renders dark-on-dark. We use
 * the theme-aware `--c-*` console tokens (text-c-text / c-text-2 / c-text-3,
 * bg-c-surface, border-c-border, text-c-accent) which are tuned for contrast.
 */

type PersonaId = 'has-app' | 'mcp' | 'no-app'

const PERSONAS: { id: PersonaId; label: string; blurb: string; status: 'ready' | 'preview' | 'soon' }[] = [
  { id: 'has-app', label: 'I have an agent app', blurb: 'A Python agent making outbound calls — LangGraph, CrewAI, or your own', status: 'ready' },
  { id: 'mcp',     label: 'I call MCP servers',  blurb: 'Govern what your agents can do through third-party MCP tools', status: 'preview' },
  { id: 'no-app',  label: "I'm just exploring",  blurb: 'See it work end to end before you write any code', status: 'soon' },
]

export function GettingStarted() {
  const [persona, setPersona] = useState<PersonaId>('has-app')

  return (
    <div className="py-section">
      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-c-accent mb-3">Getting started</p>
      <h1 className="text-display-lg text-c-text text-balance">
        Give every agent action an identity you can verify
      </h1>
      <p className="mt-5 text-body-lg text-c-text-2 leading-relaxed">
        auth51 mints a scoped, single-use token for every outbound call your agent
        makes — created at the source, bound to a key that never leaves the process,
        and verified at the resource. No auth code in your tools. Pick where you&apos;re
        starting from.
      </p>

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
      {/* Hook — lead with the outcome, not the setup. */}
      <p className="text-[17px] text-c-text leading-relaxed">
        In about five minutes, every call your agent makes to a service you choose
        will carry its own verifiable identity — scoped to the one thing it&apos;s
        allowed to do, tied to a key only that process holds, and visible in your
        console the instant it happens. Your tool code doesn&apos;t change. Let&apos;s wire
        it up.
      </p>

      <YouWillLearn items={[
        <>Why an agent&apos;s identity is a <em>fingerprint</em>, not a password</>,
        <>How to install the embed and point it at your org</>,
        <>How to register an agent and govern a real run</>,
        <>Where to watch it happen, live</>,
      ]} />

      {/* The one idea — teach the mental model before any mechanics. */}
      <SectionHeading>The one idea</SectionHeading>
      <p className="text-body text-c-text-2 leading-relaxed">
        An agent&apos;s identity isn&apos;t a secret it carries — it&apos;s a fingerprint of{' '}
        <span className="text-c-text">what it is</span>: its prompt and the tools it
        can call. auth51 hashes that into a <code className="code-inline">checksum</code>.
        Then, for every outbound call, it mints an <span className="text-c-text">intent
        token</span> right at the source: good for one action, bound to a key that
        never leaves the process (DPoP), and written to your audit log. Steal the
        token and it&apos;s inert — it isn&apos;t the key, and it expires in seconds. That&apos;s
        the whole model. Everything below is just wiring it in.
      </p>

      <BeforeAfter />

      {/* Steps — each opens with WHY, then the code, then what matters in it. */}
      <SectionHeading>Wire it up</SectionHeading>

      <Step n={1} title="Get credentials that belong to you">
        <p className="text-body text-c-text-2 leading-relaxed">
          Your agent should authenticate as <span className="text-c-text">your org</span>,
          not a secret shared across a team. In the{' '}
          <DocLink href="/console/onboarding">console</DocLink> you get an org
          automatically; create a key under{' '}
          <span className="text-c-text font-medium">Settings → API Keys</span>. You&apos;ll
          get a <code className="code-inline">client_id</code> and a{' '}
          <code className="code-inline">client_secret</code>.
        </p>
        <Callout kind="note">
          The secret is shown <span className="text-c-text font-medium">once</span>.
          It&apos;s clamped to your org and to a safe scope envelope
          (<span className="font-mono text-[12px]">register:intent</span>,{' '}
          <span className="font-mono text-[12px]">generate:intent-token</span>,{' '}
          <span className="font-mono text-[12px]">read:agents</span>) — so even if it
          leaks, it can&apos;t approve escalations or reach another tenant.
        </Callout>
      </Step>

      <Step n={2} title="Install the embed and point it at your org">
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          One import installs egress interception. One{' '}
          <code className="code-inline">configure()</code> call, at process startup,
          tells it who you are and which hosts to govern.
        </p>
        <CodeBlock label="shell">{`pip install auth51`}</CodeBlock>
        <div className="h-3" />
        <CodeBlock label="startup.py">{`import auth51

auth51.configure(
    app_id="acme",
    client_id="a51_live_...",           # Settings → API Keys
    client_secret="...",                # shown once
    audiences={"api.acme.com"},         # hosts whose egress to govern
)`}</CodeBlock>
        <p className="text-body text-c-text-2 leading-relaxed mt-3">
          <code className="code-inline">audiences</code> is the list of hosts you want
          governed — your resource server, an internal API, a payment gateway. Calls to
          anything else pass through untouched. (<code className="code-inline">authority_url</code>{' '}
          already defaults to <span className="font-mono text-[12px] text-c-text">https://authority.auth51.com</span>.)
        </p>
        <Callout kind="pitfall">
          <code className="code-inline">fail_open</code> defaults to{' '}
          <span className="text-c-text font-medium">False</span>. If the authority is
          ever unreachable, governed egress is <span className="text-c-text">denied</span>,
          not waved through. That&apos;s the safe default — just know it&apos;s there before you
          go to production.
        </Callout>
      </Step>

      <Step n={3} title="Register the agent's identity">
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          Remember the one idea: identity = prompt + tools. Register them once to get
          the <code className="code-inline">checksum</code> you&apos;ll bind runs to. (The
          onboarding wizard does this for you interactively — here&apos;s the same call in
          code.)
        </p>
        <CodeBlock label="register.py">{`import httpx

AUTHORITY = "https://authority.auth51.com"

def register_agent(app_id, agent_id, prompt, tools, client_id, client_secret):
    # Exchange your API key for a short-lived registration token.
    tok = httpx.post(f"{AUTHORITY}/v1/oauth/token", data={
        "grant_type": "client_credentials",
        "client_id": client_id, "client_secret": client_secret,
        "scope": "register:intent",
    }).json()["access_token"]

    # Register the agent's prompt + tools → returns its checksum.
    r = httpx.post(f"{AUTHORITY}/v1/intent/register/agent",
        headers={"authorization": f"Bearer {tok}"},
        json={"app_id": app_id, "agent_components": {
            "agent_id": agent_id,
            "prompt_template": prompt,
            "tools": tools,   # [{"name","description","parameters"}, ...]
        }})
    r.raise_for_status()
    return r.json()["checksum"]`}</CodeBlock>
        <DeepDive summary="What's actually in the checksum?">
          A SHA3-512 over the agent&apos;s prompt template and the JSON schema of each
          in-process tool. Change the prompt or add a tool and the checksum changes —
          which is exactly the point: a tampered or impersonating agent has a{' '}
          <span className="text-c-text">different identity</span>, so it doesn&apos;t inherit
          the grants you approved for the real one.
        </DeepDive>
      </Step>

      <Step n={4} title="Govern a run" last>
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          Bind a run to that identity. Inside the <code className="code-inline">with</code>{' '}
          block, every outbound call your agent makes is intercepted, minted, signed,
          and logged — <span className="text-c-text">your tool code is untouched</span>.
        </p>
        <CodeBlock label="run.py">{`cs = register_agent(
    "acme", "checkout-bot", SYSTEM_PROMPT, TOOLS,
    client_id="a51_live_...", client_secret="...",
)

with auth51.agent("checkout-bot", checksum=cs,
                  scope="payment:execute", audience="api.acme.com"):
    run_agent()   # every call inside is now governed`}</CodeBlock>
        <p className="text-body text-c-text-2 leading-relaxed mt-3">
          <code className="code-inline">scope</code> is the single action this run is
          allowed to mint for; <code className="code-inline">audience</code> is the host
          it&apos;s allowed to reach. Ask for anything outside that and the mint is denied
          before a byte leaves your process.
        </p>
      </Step>

      {/* The payoff — SHOW the result, don't just link to it. */}
      <SectionHeading>See it happen</SectionHeading>
      <p className="text-body text-c-text-2 leading-relaxed mb-5">
        Within a second or two of that run, your agent and its calls appear in the
        console — scoped to your org:
      </p>
      <ConsolePreview />
      <p className="text-[13px] text-c-text-3 leading-relaxed mt-4">
        Live views:{' '}
        <DocLink href="/console/agents/registered">Agents</DocLink>,{' '}
        <DocLink href="/console/agents/grants">Grants</DocLink>, and{' '}
        <DocLink href="/console/security/audit">Security → Audit</DocLink>.
      </p>

      {/* Recap — react.dev signature close. */}
      <div className="mt-14 rounded-xl border border-c-border bg-c-surface p-6">
        <p className="text-[13px] font-semibold text-c-text mb-3">Recap</p>
        <ul className="space-y-2">
          <RecapItem><code className="code-inline">import auth51</code> + <code className="code-inline">configure()</code> turns on egress interception.</RecapItem>
          <RecapItem>Registering a prompt + tools once gives you a <span className="text-c-text">checksum</span> — the agent&apos;s identity.</RecapItem>
          <RecapItem><code className="code-inline">with auth51.agent(...)</code> makes a run governed: scoped, key-bound, audited.</RecapItem>
          <RecapItem>The console is your live proof — no extra instrumentation.</RecapItem>
        </ul>
      </div>

      <SectionHeading>Next steps</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NextCard href="/protocol" title="How it works" body="The intent token, DPoP binding, and non-amplification — the model underneath." />
        <NextCard href="/console/settings/workload-identities" title="Go keyless" body="On AWS, agents authenticate by their IAM role — no client_secret at all." />
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
          Each call carries a fresh token — scoped to one action, bound to this
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
        call into an allow/deny decision — with the same intent-token and audit trail.
      </p>
      <RoadmapCard
        title="Available as a proxy today"
        body={<>The <span className="font-mono text-[13px] text-c-text">auth51-mcp-proxy</span> is a
          zero-dependency stdio passthrough that enforces per-tool policy and mints
          intent tokens against the authority. Managed setup from the console —
          one-line install + policy — is what we&apos;re wiring next.</>}
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
        No agent app yet? You&apos;ll be able to build one right here — describe an agent,
        give it a couple of tools, and watch a governed run against a sandboxed
        service, with the plain-OAuth vs. auth51 difference side by side.
      </p>
      <RoadmapCard
        title="Interactive builder — coming soon"
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
