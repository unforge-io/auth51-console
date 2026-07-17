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
  { id: 'has-app', label: 'I have an agent app', blurb: 'A Python agent built with LangGraph, CrewAI, or your own framework', status: 'ready' },
  { id: 'mcp',     label: 'I call MCP servers',  blurb: 'Govern agent access to tools exposed by third-party MCP servers', status: 'preview' },
  { id: 'no-app',  label: "I'm just exploring",  blurb: 'See an end-to-end example before writing any code', status: 'soon' },
]

export function GettingStarted() {
  const [persona, setPersona] = useState<PersonaId>('has-app')

  return (
    <div>
      <PageTitle eyebrow="Get started">Give every agent action an identity you can verify</PageTitle>
      <Lead>
        Auth51 mints a scoped, single-use token for each outbound call your agent makes.
        The token is created at the source, bound to a key that remains in the process, and
        verified by the resource. Your tools do not need to implement this authorization logic.
        Choose the path that matches your starting point.
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
      {/* Introduce the authorization gap before the integration steps. */}
      <p className="text-[17px] text-c-text leading-relaxed">
        A typical tool or API request does not show{' '}
        <span className="text-c-text font-medium">which</span> agent produced it, whether the
        agent still matches its registered instructions, or whether another process is replaying
        a leaked token. Auth51 adds a verifiable agent identity to each action. For the default
        integration, you enable it with a single <code className="code-inline">import</code>.
      </p>

      <YouWillLearn items={[
        <>Why an agent&apos;s identity is a <em>fingerprint</em> of what it is rather than a password</>,
        <>How one import enables agent identification without changing your agent logic</>,
        <>How to review and approve an unregistered agent</>,
        <>Where to observe the authorization flow</>,
      ]} />

      {/* The one idea: the mental model before any mechanics. */}
      <SectionHeading>The one idea</SectionHeading>
      <p className="text-body text-c-text-2 leading-relaxed">
        An agent&apos;s identity is a fingerprint of{' '}
        <span className="text-c-text">what it is</span>: its system prompt and the tools it can
        call, rather than a secret it carries. The Auth51 client observes the model request,
        computes that fingerprint as a <code className="code-inline">checksum</code>, and compares
        it with the agents registered in your organization. A match identifies the agent without
        relying on a self-declared name. If no registration matches, Auth51 treats the agent as
        unregistered and sends it for review.
      </p>

      <BeforeAfter />

      {/* The zero-config quickstart. */}
      <SectionHeading>Quickstart</SectionHeading>

      <Step n={1} title="Create an API key">
        <p className="text-body text-c-text-2 leading-relaxed">
          Sign in to the <DocLink href="/console/onboarding">console</DocLink>. Auth51 creates an
          organization for you automatically. Create a key under{' '}
          <span className="text-c-text font-medium">Settings → API Keys</span>, then add it to your
          agent&apos;s environment. The client reads the credentials when it is imported.
        </p>
        <CodeBlock label="env">{`export AUTH51_CLIENT_ID=a51_live_...     # Settings → API Keys
export AUTH51_CLIENT_SECRET=...          # shown once`}</CodeBlock>
        <Callout kind="note">
          The key is limited to your organization and its permitted scope envelope. It cannot
          approve escalations or access another tenant. On AWS, you can avoid a client secret by
          using <DocLink href="/console/settings/workload-identities">keyless workload identity</DocLink>,
          which allows the agent to prove its IAM role.
        </Callout>
      </Step>

      <Step n={2} title="Install and import">
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          The import installs egress interception. On the agent&apos;s first model call, Auth51
          identifies it from the request on the wire. The default discovery path does not require{' '}
          <code className="code-inline">configure()</code>, a wrapper around your code, or declared
          audiences.
        </p>
        <CodeBlock label="shell">{`pip install auth51`}</CodeBlock>
        <div className="h-3" />
        <CodeBlock label="your_app.py">{`import auth51        # ← that's it

# ...run your agent as usual.
run_your_agent()`}</CodeBlock>
      </Step>

      <Step n={3} title="Approve it in the console" last>
        <p className="text-body text-c-text-2 leading-relaxed mb-3">
          The first time the agent runs, the client sends its observed identity—the system prompt,
          tools, and computed checksum—to your organization&apos;s Discovery inbox. Open{' '}
          <DocLink href="/console/agents/discovered">Agents → Discovered</DocLink>, review the
          identity, and select <span className="text-c-text font-medium">Register</span>. On the
          next run, Auth51 recognizes the registered agent and governs its actions.
        </p>
        <ConsolePreview />
        <Callout kind="note">
          The prompt and tools are sent to your Discovery inbox for review. They enter the
          Authority only after you approve the registration. Until then, the agent remains
          unregistered and the mint path fails closed.
        </Callout>
      </Step>

      {/* Recap. */}
      <div className="mt-14 rounded-xl border border-c-border bg-c-surface p-6">
        <p className="text-[13px] font-semibold text-c-text mb-3">Recap</p>
        <ul className="space-y-2">
          <RecapItem>Add the API key to the environment and <code className="code-inline">import auth51</code>.</RecapItem>
          <RecapItem>The client derives the agent identity from its model request rather than from a declared name.</RecapItem>
          <RecapItem>Review unregistered agents under <span className="text-c-text">Discovered</span>, then approve the identities you want to register.</RecapItem>
          <RecapItem>Auth51 recognizes and governs the registered agent on its next run.</RecapItem>
        </ul>
      </div>

      {/* Advanced: everything the zero-config path hides, for those who need it. */}
      <SectionHeading>Advanced &amp; self-host</SectionHeading>
      <p className="text-body text-c-text-2 leading-relaxed mb-4">
        The steps above use the managed SaaS defaults. Use the following options when you need
        explicit configuration or a self-hosted deployment.
      </p>

      <DeepDive summary="Configure in code instead of env (and self-host)">
        If you prefer explicit configuration or run your own Authority and Discovery services,
        call <code className="code-inline">configure()</code> once at startup. For an on-premises
        deployment, point the client to your servers. When you configure a custom Authority, the
        client does not fall back to SaaS Discovery.
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
        The client assigns a provisional name to a discovered agent from its prompt, and the
        console allows you to rename it during approval. To assign a name in code, wrap the run in{' '}
        <code className="code-inline">with auth51.agent(&quot;checkout-bot&quot;): ...</code>.
        To register agents before runtime, such as during deployment, POST their components to{' '}
        <code className="code-inline">/v1/intent/register/agent</code>. The console uses the same
        endpoint when you approve a discovered agent.
      </DeepDive>

      <div className="h-3" />
      <DeepDive summary="Enforce at your resource servers (audiences)">
        Discovery and identity use the default configuration. To <em>mint intent tokens</em>{' '}
        for calls to your resource servers, identify the Auth51-protected hosts through{' '}
        <code className="code-inline">audiences</code> or{' '}
        <code className="code-inline">AUTH51_AUDIENCES</code>. Install the Auth51 verifier on those
        services to validate the tokens.
      </DeepDive>

      <SectionHeading>Next steps</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NextCard href="/protocol" title="How it works" body="Learn how intent tokens, DPoP binding, and non-amplification fit together." />
        <NextCard href="/console/settings/workload-identities" title="Go keyless" body="Use an AWS IAM role to authenticate an agent without a client_secret." />
        <NextCard href="/walkthrough" title="See an attack blocked" body="Follow a live run and inspect the request that Auth51 refuses to authorize." />
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
          Calls made with the same long-lived credential have the same client identity. Anyone who
          obtains the token can present it until it expires or is rotated.
        </p>
      </div>
      <div className="rounded-xl border border-c-accent/30 bg-c-accent/[0.06] p-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-c-accent-2 mb-2">With Auth51</p>
        <p className="text-[13.5px] text-c-text-2 leading-relaxed">
          Each call carries a fresh token scoped to one action and bound to the agent&apos;s
          fingerprint and process-held key. Copying the token alone does not provide the key
          required to use it.
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
        If your agents access tools through MCP servers, Auth51 can govern those calls at the
        protocol boundary. A proxy in front of the MCP server evaluates each tool call, applies an
        allow or deny decision, and records the intent token and audit event.
      </p>
      <RoadmapCard
        title="Available as a proxy today"
        body={<>The <span className="font-mono text-[13px] text-c-text">auth51-mcp-proxy</span> is a
          zero-dependency stdio passthrough that enforces per-tool policy and mints intent tokens
          against the Authority. A managed setup from the console, with a one-line installation
          and policy configuration, is planned next.</>}
      />
      <p className="mt-6 text-body text-c-text-2">
        To request early access to the managed MCP path,{' '}
        <DocLink href="/console/settings">contact us from the console</DocLink>.
      </p>
    </div>
  )
}

function NoAppGuide() {
  return (
    <div>
      <p className="text-[17px] text-c-text leading-relaxed">
        If you do not have an agent application yet, the planned interactive builder will let you
        describe an agent, assign tools, and run it against a sandboxed service. The result will
        compare plain OAuth and Auth51 side by side.
      </p>
      <RoadmapCard
        title="Interactive builder, coming soon"
        body={<>Until the builder is available, use the guided walkthrough to see Auth51 work end
          to end. It follows a real agent run and the attack it blocks, one step at a time.</>}
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
