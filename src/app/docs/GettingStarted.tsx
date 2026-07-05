'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Getting Started — persona-first. We lead with the path that is shippable
 * today (a customer who already has an agent app: `pip install auth51`), and
 * scaffold the two other personas so the shape is visible without overclaiming.
 *
 * The Python snippets here are the REAL embed API (configure → register →
 * `auth51.agent(...)` context) — they mirror the in-console onboarding wizard
 * and the reference runner, not an aspirational surface.
 */

type PersonaId = 'has-app' | 'mcp' | 'no-app'

const PERSONAS: { id: PersonaId; label: string; blurb: string; status: 'ready' | 'preview' | 'soon' }[] = [
  { id: 'has-app', label: 'I have an agent app', blurb: 'Python agent (LangGraph, CrewAI, custom) making outbound calls', status: 'ready' },
  { id: 'mcp',     label: 'I call third-party MCP servers', blurb: 'Govern what your agents can do through MCP tools', status: 'preview' },
  { id: 'no-app',  label: "I don't have an app yet", blurb: 'See it working before you write any code', status: 'soon' },
]

export function GettingStarted() {
  const [persona, setPersona] = useState<PersonaId>('has-app')

  return (
    <div className="py-section">
      <p className="eyebrow font-mono mb-3">GETTING STARTED</p>
      <h1 className="text-display-lg text-ink text-balance">
        Give every agent action a verifiable identity
      </h1>
      <p className="mt-4 text-body-lg text-ink-secondary">
        auth51 mints a scoped, DPoP-bound intent token for every outbound call
        an agent makes — at the source, verified at the resource. Pick where
        you&apos;re starting from.
      </p>

      {/* Persona picker */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PERSONAS.map((p) => {
          const active = p.id === persona
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={[
                'text-left rounded-xl border p-4 transition-colors',
                active
                  ? 'border-[#6366f1] bg-[#6366f1]/[0.06]'
                  : 'border-line bg-bg-subtle hover:border-[#6366f1]/40',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-ink">{p.label}</span>
                <StatusPill status={p.status} />
              </div>
              <p className="mt-1.5 text-[12.5px] text-ink-tertiary leading-snug">{p.blurb}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-12">
        {persona === 'has-app' && <HasAppGuide />}
        {persona === 'mcp' && <McpGuide />}
        {persona === 'no-app' && <NoAppGuide />}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: 'ready' | 'preview' | 'soon' }) {
  const map = {
    ready:   { t: 'Available', c: 'text-[#34d399] border-[#34d399]/30 bg-[#34d399]/10' },
    preview: { t: 'Preview',   c: 'text-[#a5b4fc] border-[#818cf8]/30 bg-[#818cf8]/10' },
    soon:    { t: 'Soon',      c: 'text-ink-tertiary border-line bg-bg-subtle' },
  }[status]
  return (
    <span className={`shrink-0 text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${map.c}`}>
      {map.t}
    </span>
  )
}

// ── Persona A: has an agent app (shippable today) ───────────────────────────

function HasAppGuide() {
  return (
    <div>
      <IntroLine>
        Three steps: create an API key, register your agent&apos;s identity, then
        wrap the work you already run. No auth code goes into your tools — the
        embed intercepts outbound <code className="code-inline">httpx</code>/
        <code className="code-inline">requests</code> egress transparently and
        attaches the token.
      </IntroLine>

      <Step n={1} title="Create an org and an API key">
        <p className="text-body text-ink-secondary">
          Sign in to the{' '}
          <Link href="/console/onboarding" className="text-[#818cf8] hover:underline">console</Link>.
          You get an org automatically. Create a key under{' '}
          <span className="font-mono text-[13px] text-ink">Settings → API Keys</span> —
          you&apos;ll get a <code className="code-inline">client_id</code> and a{' '}
          <code className="code-inline">client_secret</code> (shown once). The key
          is clamped to your org and to a safe scope envelope
          (<span className="font-mono text-[12px]">register:intent</span>,{' '}
          <span className="font-mono text-[12px]">generate:intent-token</span>,{' '}
          <span className="font-mono text-[12px]">read:agents</span>).
        </p>
      </Step>

      <Step n={2} title="Install and configure the embed">
        <p className="text-body text-ink-secondary mb-3">
          Call <code className="code-inline">configure(...)</code> once at process
          startup. <code className="code-inline">audiences</code> lists the hosts
          whose outbound calls you want governed.
        </p>
        <CodeBlock label="quickstart.py">{`pip install auth51`}</CodeBlock>
        <div className="h-3" />
        <CodeBlock label="startup.py">{`import auth51

auth51.configure(
    app_id="acme",                      # your app, as shown in the console
    client_id="a51_live_...",           # Settings → API Keys
    client_secret="...",                # shown once when you create the key
    audiences={"api.acme.com"},         # hosts whose egress to govern
    # authority_url defaults to https://authority.auth51.com
    # fail_open defaults to False — deny egress if the authority is unreachable
)`}</CodeBlock>
      </Step>

      <Step n={3} title="Register the agent's identity → checksum">
        <p className="text-body text-ink-secondary mb-3">
          An agent&apos;s identity is a fingerprint of its prompt and tools.
          Register it once to get the <code className="code-inline">checksum</code>{' '}
          the embed binds each mint to. (The console onboarding wizard does this
          interactively; here&apos;s the same call in code.)
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
      </Step>

      <Step n={4} title="Wrap the work — every call is now governed" last>
        <p className="text-body text-ink-secondary mb-3">
          Bind a run to the registered identity. Inside the context, the agent&apos;s
          outbound calls each get a fresh intent token, scoped to what you declared,
          DPoP-signed in-process, and recorded in your audit trail.
        </p>
        <CodeBlock label="run.py">{`cs = register_agent(
    "acme", "checkout-bot", SYSTEM_PROMPT, TOOLS,
    client_id="a51_live_...", client_secret="...",
)

with auth51.agent("checkout-bot", checksum=cs,
                  scope="payment:execute", audience="api.acme.com"):
    run_agent()   # outbound HTTP is intent-bound, DPoP-signed, audited`}</CodeBlock>
        <div className="mt-6 rounded-lg border border-line bg-bg-subtle p-4">
          <p className="text-[13px] text-ink-secondary">
            <span className="text-ink font-semibold">What you&apos;ll see. </span>
            Within seconds the console shows your agent under{' '}
            <Link href="/console/agents/registered" className="text-[#818cf8] hover:underline">Agents</Link>,
            its derived grant under Grants, and every mint/deny under{' '}
            <Link href="/console/security/audit" className="text-[#818cf8] hover:underline">Security → Audit</Link> —
            all scoped to your org.
          </p>
        </div>
      </Step>
    </div>
  )
}

// ── Persona B: third-party MCP servers (preview) ─────────────────────────────

function McpGuide() {
  return (
    <div>
      <IntroLine>
        If your agents reach tools through MCP servers, auth51 governs them at the
        protocol boundary — a proxy sits in front of the MCP server and turns each
        tool call into an authorization decision (allow/deny per tool), with the
        same intent-token + audit trail.
      </IntroLine>
      <RoadmapCard
        title="Available as a proxy today"
        body={<>The <span className="font-mono text-[13px]">auth51-mcp-proxy</span> is a
          zero-dependency stdio passthrough that enforces per-tool policy and mints
          intent tokens against the authority. Self-serve setup from the console
          (managed policy + one-line install) is what we&apos;re wiring next.</>}
      />
      <p className="mt-6 text-body text-ink-secondary">
        Want early access to the managed MCP path?{' '}
        <Link href="/console/settings" className="text-[#818cf8] hover:underline">Tell us from the console</Link>{' '}
        and we&apos;ll turn it on for your org.
      </p>
    </div>
  )
}

// ── Persona C: no app yet (soon) ─────────────────────────────────────────────

function NoAppGuide() {
  return (
    <div>
      <IntroLine>
        No agent app yet? You&apos;ll be able to build one right here — describe an
        agent, give it a couple of tools, and watch a governed run happen against a
        sandboxed resource, with the plain-OAuth vs. auth51 difference side by side.
      </IntroLine>
      <RoadmapCard
        title="Interactive agent builder — coming soon"
        body={<>Until it ships, the fastest way to see auth51 work end to end is the
          guided walkthrough — a real agent run with the attack it blocks, narrated
          step by step.</>}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/walkthrough"
          className="inline-flex items-center rounded-lg bg-[#6366f1] px-4 py-2 text-[13px] font-semibold text-white no-underline hover:bg-[#5457e5]">
          See the walkthrough →
        </Link>
        <Link href="/protocol"
          className="inline-flex items-center rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink no-underline hover:border-[#6366f1]/40">
          Read the protocol
        </Link>
      </div>
    </div>
  )
}

// ── shared bits ──────────────────────────────────────────────────────────────

function IntroLine({ children }: { children: React.ReactNode }) {
  return <p className="text-body-lg text-ink-secondary leading-relaxed mb-10">{children}</p>
}

function Step({ n, title, children, last }: {
  n: number; title: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <div className="relative pl-11 pb-10">
      {!last && <div className="absolute left-[15px] top-9 bottom-0 w-px bg-line" />}
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 text-[13px] font-semibold text-[#a5b4fc]">
        {n}
      </div>
      <h2 className="text-[18px] font-semibold text-ink mb-3 leading-8">{title}</h2>
      {children}
    </div>
  )
}

function RoadmapCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-bg-subtle p-6">
      <p className="text-[14px] font-semibold text-ink mb-1.5">{title}</p>
      <p className="text-[13.5px] text-ink-secondary leading-relaxed">{body}</p>
    </div>
  )
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative rounded-xl border border-[rgb(46_48_54)] bg-gradient-to-b from-[rgb(14_15_18)] to-[rgb(10_11_13)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[rgb(38_39_43)] flex items-center justify-between">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">{label}</span>
        <button onClick={copy} className="text-[11px] font-mono text-[#818cf8] hover:underline">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="px-4 py-4 text-[12.5px] font-mono text-[#ececed] overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}
