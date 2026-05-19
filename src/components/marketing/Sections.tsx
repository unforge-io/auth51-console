'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { THREATS, ANCHORS, severityColorClass } from '@/lib/console/threats-data'
import { ControlPlaneDiagram } from './ControlPlaneDiagram'
import { classifyAgents } from '@/lib/agent-classification'
import { DEMO_AGENTS } from '@/lib/marketing/demoSnapshot'
import { cn } from '@/lib/utils'

// ── Section frame helpers ────────────────────────────────────────────────

function SectionFrame({
  children, className, eyebrow, title, kicker, id,
}: {
  children: React.ReactNode
  className?: string
  eyebrow?: string
  title?: React.ReactNode
  kicker?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('relative border-t border-[rgb(38_39_43_/_0.6)]', className)}>
      {/* Soft gradient at top of section */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-[rgb(99_102_241_/_0.05)] to-transparent" />
      <Container>
        <div className="relative py-20 sm:py-28">
          {(eyebrow || title) && (
            <div className="max-w-[760px] mb-14">
              {eyebrow && (
                <p className="text-[11px] font-mono tracking-wider uppercase text-[#818cf8] mb-3">{eyebrow}</p>
              )}
              {title && (
                <h2 className="text-[32px] sm:text-[42px] font-semibold text-white tracking-tight leading-[1.06]">
                  {title}
                </h2>
              )}
              {kicker && (
                <p className="mt-4 text-[16px] sm:text-[17px] text-[#b6bbc5] leading-relaxed max-w-[640px]">
                  {kicker}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </Container>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Control Plane — the centerpiece
// ────────────────────────────────────────────────────────────────────────

export function ControlPlaneSection() {
  const k8sRows = [
    { k8s: 'API server / etcd',     auth51: 'Auth51 Authority' },
    { k8s: 'kubelet (per node)',    auth51: 'Auth51 Runtime' },
    { k8s: 'Admission / sidecar',   auth51: 'Auth51 Verifier' },
    { k8s: 'K8s Dashboard',         auth51: 'Auth51 Console' },
    { k8s: 'kubectl',               auth51: 'a51 CLI' },
    { k8s: 'kubeconfig',            auth51: 'a51 config' },
    { k8s: 'Workload / Pod',        auth51: 'Agentic application' },
    { k8s: 'kubectl apply -f',      auth51: 'a51 apply -f' },
  ]
  return (
    <SectionFrame
      id="control-plane"
      eyebrow="The Control Plane"
      title={<>It&apos;s <span className="text-[#818cf8]">kubectl for AI agents</span>. Same primitives. New domain.</>}
      kicker="Authority at the top, Runtimes embedded in your agents, Verifiers at every resource boundary, Console and CLI as your view. If you can deploy a Kubernetes cluster, you already know how to deploy Auth51."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
        <div className="rounded-2xl border border-[rgb(38_39_43)] bg-[rgb(10_11_13)] p-6 sm:p-8">
          <ControlPlaneDiagram />
        </div>

        <div className="rounded-2xl border border-[rgb(38_39_43)] bg-[rgb(19_20_26)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[rgb(38_39_43)]">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">If you know K8s</p>
            <p className="text-[13px] text-white mt-0.5">Translation table</p>
          </div>
          <table className="w-full text-[12.5px]">
            <tbody className="divide-y divide-[rgb(38_39_43_/_0.6)]">
              {k8sRows.map((r) => (
                <tr key={r.k8s}>
                  <td className="px-5 py-3 text-[#8a8f98]">{r.k8s}</td>
                  <td className="px-5 py-3 font-mono text-[#a5b4fc] text-right">{r.auth51}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionFrame>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Live Agent Registry
// ────────────────────────────────────────────────────────────────────────

export function LiveRegistrySection() {
  const classified = useMemo(() => classifyAgents(DEMO_AGENTS), [])
  const bullets = [
    { title: 'Cryptographic fingerprinting',  body: 'Every agent\'s prompt, tools, and configuration are hashed into a checksum at registration. If anything changes, the next token mint fails.' },
    { title: 'Five-dimensional classification', body: 'Role, reasoning pattern, autonomy level, capability surface, provenance — all derived from observable data. The system interprets agents; agents don\'t self-declare.' },
    { title: 'Live updates',                  body: 'New registrations appear within seconds. Versioning detects drift. Revocation propagates immediately.' },
  ]
  return (
    <SectionFrame
      id="registry"
      eyebrow="Feature · Live Registry"
      title={<>Every agent. <span className="text-[#34d399]">Verified.</span> Continuously.</>}
      kicker="The Auth51 Console gives you a real-time view of every agent registered with the Authority — fingerprinted at runtime, classified by behaviour, observable from one pane."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-xl border border-[rgb(38_39_43)] bg-[rgb(10_11_13)] overflow-hidden shadow-2xl">
          <div className="px-3.5 py-2.5 border-b border-[rgb(38_39_43)] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5c6168]">/console/agents/registered</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#5c6168]">
              <span className="h-1 w-1 rounded-full bg-[#34d399]" />
              live
            </span>
          </div>
          <table className="w-full text-[11.5px]">
            <thead className="bg-[rgb(10_11_13)] border-b border-[rgb(38_39_43)]">
              <tr>
                <th className="px-3 py-2 text-left text-[9px] font-semibold tracking-wider uppercase text-[#5c6168]">Agent</th>
                <th className="px-3 py-2 text-left text-[9px] font-semibold tracking-wider uppercase text-[#5c6168]">Role</th>
                <th className="px-3 py-2 text-left text-[9px] font-semibold tracking-wider uppercase text-[#5c6168]">Reasoning</th>
                <th className="px-3 py-2 text-left text-[9px] font-semibold tracking-wider uppercase text-[#5c6168]">Tools</th>
              </tr>
            </thead>
            <tbody>
              {classified.slice(0, 5).map((a) => {
                const c = a.classification
                return (
                  <tr key={a.agent_id} className="border-b border-[rgb(38_39_43_/_0.5)]">
                    <td className="px-3 py-2.5 font-mono text-white text-[11.5px]">{a.agent_id}</td>
                    <td className="px-3 py-2.5 text-[#b6bbc5]">{c.labels.role}</td>
                    <td className="px-3 py-2.5 text-[#b6bbc5]">{c.labels.reasoning}</td>
                    <td className="px-3 py-2.5 text-[#b6bbc5]">{a.tools.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ul className="space-y-6">
          {bullets.map((b) => (
            <li key={b.title} className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#818cf8] shrink-0" />
              <div>
                <div className="text-[15px] font-semibold text-white mb-1">{b.title}</div>
                <div className="text-[13.5px] text-[#b6bbc5] leading-relaxed">{b.body}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SectionFrame>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Agent Discovery
// ────────────────────────────────────────────────────────────────────────

export function DiscoverySection() {
  const discovered = [
    { id: 'PrChecker', host: 'agents-prod-02', detected: '12s ago', checksum: '9e1a7b8c4d2f', risk: 'unknown' },
    { id: 'IssueRouter-v2', host: 'agents-prod-01', detected: '2m ago', checksum: 'a4b5c6d7e8f9', risk: 'unknown' },
    { id: 'CodeReviewer', host: 'agents-stage-01', detected: '7m ago', checksum: 'f3e2d1c0b9a8', risk: 'unknown' },
  ]
  return (
    <SectionFrame
      id="discovery"
      eyebrow="Feature · Discovery"
      title={<>Agents appear. <span className="text-[#facc15]">We catch them.</span></>}
      kicker="The Runtime watches every host it's installed on. Any unfamiliar process that loads the shim shows up in your Discovered inbox — before it can mint a single token."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div className="rounded-xl border border-[rgb(38_39_43)] bg-[rgb(10_11_13)] overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 border-b border-[rgb(38_39_43)] flex items-center justify-between">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">/console/agents/discovered</span>
            <span className="inline-flex items-center gap-2 text-[10.5px] text-[#facc15]">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#facc15] animate-pulse" />
              {discovered.length} unregistered
            </span>
          </div>
          <ul className="divide-y divide-[rgb(38_39_43_/_0.5)]">
            {discovered.map((d) => (
              <li key={d.id} className="px-4 py-3.5 flex items-center gap-4 hover:bg-[rgb(19_20_26)] transition-colors">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#facc15]/15 text-[#facc15] font-mono text-[10px] shrink-0">!</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[13px] text-white">{d.id}</span>
                    <span className="text-[10.5px] text-[#5c6168]">on {d.host}</span>
                  </div>
                  <div className="text-[10.5px] text-[#8a8f98] mt-0.5 font-mono">
                    checksum {d.checksum}… · detected {d.detected}
                  </div>
                </div>
                <button className="text-[11px] text-[#818cf8] hover:text-white px-3 py-1.5 rounded border border-[#1f2127] hover:border-[#6366f1]/60 transition-colors">
                  Review →
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[18px] font-semibold text-white mb-3">Zero-trust by default</h3>
          <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed mb-4">
            An unregistered agent has no identity in the Authority. It can&apos;t mint tokens, can&apos;t access resources, can&apos;t be impersonated by another agent — because it doesn&apos;t exist yet.
          </p>
          <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed">
            Review the discovery. If the fingerprint matches your release artifact, register with one click. If it doesn&apos;t, you&apos;ve just caught a rogue deployment before it could act.
          </p>
        </div>
      </div>
    </SectionFrame>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Workflows (tabs)
// ────────────────────────────────────────────────────────────────────────

export function WorkflowsSection() {
  const [tab, setTab] = useState<'inferred' | 'registered' | 'runtime'>('inferred')
  const tabs: Array<{ id: typeof tab; label: string; sub: string }> = [
    { id: 'inferred',   label: 'Inferred',   sub: 'derived from tool graph' },
    { id: 'registered', label: 'Registered', sub: 'declared with Authority' },
    { id: 'runtime',    label: 'Runtime',    sub: 'actual executions · soon' },
  ]
  return (
    <SectionFrame
      id="workflows"
      eyebrow="Feature · Workflows"
      title={<>From inferred topology to <span className="text-[#818cf8]">live execution.</span></>}
      kicker="Three lenses on the same multi-agent system. The Console derives orchestration from the tool graph automatically, surfaces declared WorkflowDefinitions, and (soon) replays actual runtime traces against them."
    >
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-4 py-2 text-[12.5px] font-medium border transition-colors',
              tab === t.id
                ? 'bg-[#6366f1] text-white border-[#6366f1]'
                : 'bg-transparent text-[#b6bbc5] border-[rgb(46_48_54)] hover:border-[#6366f1] hover:text-white',
            )}
          >
            {t.label} <span className="text-[10.5px] opacity-70 ml-1">· {t.sub}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[rgb(38_39_43)] bg-[rgb(10_11_13)] overflow-hidden">
        {tab === 'inferred' && <InferredPanel />}
        {tab === 'registered' && <RegisteredPanel />}
        {tab === 'runtime' && <RuntimePanel />}
      </div>
    </SectionFrame>
  )
}

function InferredPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
      <div className="border-r border-[rgb(38_39_43)] p-6">
        <div className="font-mono text-[11px] text-[#5c6168] mb-2">/console/workflows/inferred</div>
        <pre className="text-[12px] font-mono text-[#ececed] leading-relaxed">
{`▾ Supervisor                       Orchestrator · Plan
  ├ ▸ Planner                      Tool-agent · ReAct
  ├ ▸ Classifier                   Tool-agent · Direct
  └ ▸ Patcher                      Tool-agent · Direct

▾ T7Supervisor                     Orchestrator · Plan      threat T7
  ├ ▸ T7Planner                    Tool-agent · Direct      threat T7
  └ ▸ T7Patcher                    Tool-agent · Direct      threat T7`}
        </pre>
      </div>
      <div className="p-6 lg:p-8">
        <h3 className="text-[17px] font-semibold text-white mb-2">Inferred from the tool graph</h3>
        <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed mb-4">
          Every orchestrator agent — one whose tools include other agents — becomes a workflow root.
          Children are traced recursively. No declaration needed. As soon as agents register, their delegation
          structure is visible.
        </p>
        <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed">
          Useful for: understanding what you actually deployed, debugging &ldquo;why does this agent have this access,&rdquo; catching scope creep.
        </p>
      </div>
    </div>
  )
}

function RegisteredPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
      <div className="border-r border-[rgb(38_39_43)] p-6">
        <div className="font-mono text-[11px] text-[#5c6168] mb-2">/console/workflows/registered</div>
        <pre className="text-[12px] font-mono text-[#ececed] leading-relaxed">
{`▾ secure_deploy_v1.0                       4 steps · HITL
  ├ ▸ generate_release                     write:deployment
  ├ ▸ verify_sbom                          read:sbom
  └ ▾ approval_gate                        ⚠ human-in-loop
       └ deploy_to_prod                    write:deployment

▾ payment_v1.0                              3 steps
  ├ ▸ verify_balance                       read:account
  └ ▸ initiate_payment                     payment:initiate`}
        </pre>
      </div>
      <div className="p-6 lg:p-8">
        <h3 className="text-[17px] font-semibold text-white mb-2">Declared with the Authority</h3>
        <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed mb-4">
          A registered workflow is a signed declaration: which steps run, in what order, with what scopes,
          gated by what approvals. Token mints validate against it — drift is impossible.
        </p>
        <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed">
          Approval gates (⚠ HITL) require explicit human sign-off before the next step proceeds.
        </p>
      </div>
    </div>
  )
}

function RuntimePanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
      <div className="border-r border-[rgb(38_39_43)] p-6">
        <div className="font-mono text-[11px] text-[#5c6168] mb-2">/console/workflows/runtime · coming soon</div>
        <pre className="text-[12px] font-mono text-[#ececed] leading-relaxed opacity-80">
{`▾ secure_deploy_v1.0  ·  run_a47…   312ms total
  ├ ✓ generate_release                  84ms
  ├ ✓ verify_sbom                      102ms
  ├ ⏸ approval_gate           waiting 4m
  └ — deploy_to_prod          pending

▾ payment_v1.0       ·  run_a48…  ✗ scope_violation
  ├ ✓ verify_balance                    71ms
  └ ✗ initiate_payment       blocked  A7,A8
       missing scope: payment:initiate`}
        </pre>
      </div>
      <div className="p-6 lg:p-8">
        <h3 className="text-[17px] font-semibold text-white mb-2">Real executions, real outcomes</h3>
        <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed mb-4">
          Each workflow run gets a unique trace ID. The Console renders the actual step sequence with timings,
          status, and — for blocked runs — exactly which anchor caught the violation.
        </p>
        <p className="text-[13.5px] text-[#b6bbc5] leading-relaxed">
          Comparative view (registered vs runtime) coming with the analyzer agent in the next release.
        </p>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Threats catalog
// ────────────────────────────────────────────────────────────────────────

export function ThreatsSection() {
  return (
    <SectionFrame
      id="threats"
      eyebrow="Empirical evaluation"
      title={<>12 known agentic attacks. <span className="text-[#34d399]">All 12 blocked.</span></>}
      kicker="Every threat below is implemented as a runnable scenario, executed against both an OAuth-only baseline and an Auth51-protected configuration. OAuth succeeded on every attack. Auth51 blocked every attack."
    >
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-[640px]">
        <Mini eyebrow="OAuth"    value="0/12"   tag="blocked"        tone="danger" />
        <Mini eyebrow="Auth51"   value="12/12"  tag="blocked"        tone="success" />
        <Mini eyebrow="Overhead" value="+2.1ms" tag="per token mint" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THREATS.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-[rgb(38_39_43)] bg-[rgb(19_20_26)] px-4 py-3.5 hover:border-[#6366f1]/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded border border-[rgb(46_48_54)] bg-[rgb(10_11_13)]',
              )}>
                {t.id}
              </span>
              <span className="text-[12.5px] font-semibold text-white truncate">{t.name}</span>
              <span className={cn('ml-auto text-[9.5px] uppercase tracking-wider font-medium', severityColorClass(t.severity))}>
                {t.severity}
              </span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#5c6168] mb-2">{t.category}</div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div className="text-[10.5px] px-1.5 py-1 rounded border border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]">
                <span className="font-mono mr-1">✗</span>OAuth
              </div>
              <div className="text-[10.5px] px-1.5 py-1 rounded border border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]">
                <span className="font-mono mr-1">✓</span>Auth51
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.detectedBy.map((aid) => (
                <span
                  key={aid}
                  title={ANCHORS[aid]?.name ?? aid}
                  className="text-[9.5px] font-mono text-[#a5b4fc] border border-[#818cf8]/30 bg-[#818cf8]/10 px-1.5 py-0.5 rounded"
                >
                  {aid}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}

function Mini({ eyebrow, value, tag, tone }: { eyebrow: string; value: string; tag: string; tone: 'success' | 'danger' | 'neutral' }) {
  const color =
    tone === 'success' ? 'text-[#34d399]' :
    tone === 'danger'  ? 'text-[#f87171]' :
                         'text-white'
  return (
    <div className="rounded-xl border border-[rgb(38_39_43)] px-3 py-3 text-center bg-[rgb(19_20_26)]">
      <div className="text-[10px] font-mono tracking-wider uppercase text-[#5c6168]">{eyebrow}</div>
      <div className={cn('text-[22px] font-semibold tracking-tight mt-1', color)}>{value}</div>
      <div className="text-[10px] text-[#8a8f98] mt-0.5">{tag}</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Federation
// ────────────────────────────────────────────────────────────────────────

export function FederationSection() {
  return (
    <SectionFrame
      id="federation"
      eyebrow="Identity Federation"
      title={<>Identity federated. <span className="text-[#a5b4fc]">Secrets never seen.</span></>}
      kicker="The Console signs short-lived JWTs asserting who you are. Each Authority verifies them and issues its own tokens, bound to your user. Your browser never holds client_secrets, refresh tokens, or anything else dangerous. Built on RFC 8693 Token Exchange."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <div className="rounded-2xl border border-[rgb(38_39_43)] bg-[rgb(10_11_13)] p-6 sm:p-8">
          <FederationFlow />
        </div>
        <ul className="space-y-5">
          <Bullet title="One sign-in. Many control planes.">
            Sign into the Console once via Clerk / SSO. Switch between dev, staging, and prod Authorities like kubectl context-switches between clusters. Each one issues its own short-lived token.
          </Bullet>
          <Bullet title="Audit per-human, not per-client.">
            Every action carries your actual identity in the token, not a shared service-account. Audit logs answer who, not just what.
          </Bullet>
          <Bullet title="Standards-based.">
            RFC 8693 token exchange. RFC 9440 message signatures. Agentic JWT IETF draft. No proprietary protocol — your existing JWT libraries already understand the tokens.
          </Bullet>
        </ul>
      </div>
    </SectionFrame>
  )
}

function FederationFlow() {
  return (
    <svg viewBox="0 0 640 280" className="w-full h-auto">
      <defs>
        <linearGradient id="fed-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(165,180,252,0.7)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0.2)" />
        </linearGradient>
        <marker id="fed-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(165,180,252,0.7)" />
        </marker>
      </defs>

      {/* Boxes */}
      <FBox x={20}  y={110} w={150} h={60} title="Browser" sub="Clerk session" />
      <FBox x={245} y={20}  w={150} h={60} title="Console" sub="server-side" />
      <FBox x={245} y={200} w={150} h={60} title="Authority" sub="customer-owned" />
      <FBox x={470} y={110} w={150} h={60} title="Resource" sub="OpenAI / GitHub / API" />

      {/* Edges */}
      {/* 1: Browser → Console (signed user session) */}
      <path d="M 170 130 Q 200 130, 245 60"  fill="none" stroke="url(#fed-edge)" strokeWidth="1.6" strokeDasharray="5 5" markerEnd="url(#fed-arr)" className="fed-edge" />
      {/* 2: Console → Authority (RFC 8693 exchange) */}
      <path d="M 320 80  Q 320 140, 320 200"  fill="none" stroke="url(#fed-edge)" strokeWidth="1.6" strokeDasharray="5 5" markerEnd="url(#fed-arr)" className="fed-edge" />
      {/* 3: Authority → Browser (issued token) */}
      <path d="M 245 230 Q 170 230, 130 170" fill="none" stroke="url(#fed-edge)" strokeWidth="1.6" strokeDasharray="5 5" markerEnd="url(#fed-arr)" className="fed-edge" />
      {/* 4: Browser → Resource (direct call) */}
      <path d="M 170 150 Q 320 280, 470 150" fill="none" stroke="url(#fed-edge)" strokeWidth="1.6" strokeDasharray="5 5" markerEnd="url(#fed-arr)" className="fed-edge" />

      <FLabel x={210} y={88}  text="1. subject_token" />
      <FLabel x={345} y={138} text="2. token exchange" />
      <FLabel x={194} y={210} text="3. access_token" />
      <FLabel x={350} y={260} text="4. direct API call · Bearer ..." />

      <style jsx>{`
        @keyframes fedflow { to { stroke-dashoffset: -16; } }
        :global(.fed-edge) { animation: fedflow 1.8s linear infinite; }
      `}</style>
    </svg>
  )
}

function FBox({ x, y, w, h, title, sub }: { x: number; y: number; w: number; h: number; title: string; sub: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
            fill="rgba(99,102,241,0.10)" stroke="rgba(99,102,241,0.35)" strokeWidth="1" />
      <text x={x + 14} y={y + 24} fill="#ffffff" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">{title}</text>
      <text x={x + 14} y={y + 42} fill="#b6bbc5" fontSize="10" fontFamily="Inter, sans-serif">{sub}</text>
    </g>
  )
}

function FLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x - text.length * 3 - 4} y={y - 9} width={text.length * 6 + 8} height="14" rx="3"
            fill="rgba(10,11,13,0.85)" stroke="rgba(46,48,54,0.8)" strokeWidth="0.5" />
      <text x={x} y={y + 1.5} textAnchor="middle" fill="#a5b4fc" fontSize="9" fontFamily="ui-monospace, monospace">{text}</text>
    </g>
  )
}

function Bullet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#a5b4fc] shrink-0" />
      <div>
        <div className="text-[15px] font-semibold text-white mb-1">{title}</div>
        <div className="text-[13px] text-[#b6bbc5] leading-relaxed">{children}</div>
      </div>
    </li>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Install + CLI
// ────────────────────────────────────────────────────────────────────────

export function InstallSection() {
  return (
    <SectionFrame
      id="install"
      eyebrow="Get started"
      title={<>Install. Register. <span className="text-[#34d399]">Done.</span></>}
      kicker="Drop the shim into your agent process, point it at an Authority, and every outbound call is identity-bound, intent-bound, and audit-logged. No service to run, no sidecar to deploy."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CodeBlock label="Python">{`$ pip install auth51-shim

# In your agent process
from auth51 import init_security, get_secure_client

await init_security(
    app_id="patchet",
    idp_url="https://idp.auth51.com",
)

client = get_secure_client()

# Every outbound call now mints a fresh intent token,
# carries the agent's checksum, and is bound to the
# current workflow step. PoP signed in-process.
res = await client.post(
    "https://api.openai.com/v1/chat/completions",
    json={...},
    intent="generate_response",
)`}</CodeBlock>

        <CodeBlock label="a51 CLI · coming soon">{`$ brew install auth51/tap/a51

$ a51 connect https://idp.auth51.com
✓ Connected to Authority at idp.auth51.com

$ a51 agents list patchet
Supervisor   Orchestrator   Plan-and-execute   ↳ 3
Planner      Tool-agent     ReAct loop         4 tools
Classifier   Tool-agent     Direct execution   3 tools
Patcher      Tool-agent     Direct execution   2 tools

$ a51 apply -f secure_deploy_v1.0.yaml
✓ workflow secure_deploy_v1.0 registered

$ a51 threats run T7
running T7 cross-agent privilege escalation…
  ✗ OAuth   succeeded  (token replayed across agents)
  ✓ Auth51  blocked    (A7 + A8 caught at IDP)`}</CodeBlock>
      </div>
    </SectionFrame>
  )
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(38_39_43)] bg-[rgb(10_11_13)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[rgb(38_39_43)] flex items-center justify-between">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">{label}</span>
      </div>
      <pre className="px-4 py-4 text-[12.5px] font-mono text-[#ececed] overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Closing CTA
// ────────────────────────────────────────────────────────────────────────

export function CtaSection() {
  return (
    <section className="relative border-t border-[rgb(38_39_43_/_0.6)]">
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-[rgb(99_102_241_/_0.08)] to-transparent" />
      <Container>
        <div className="py-24 sm:py-32 text-center max-w-[640px] mx-auto">
          <h2 className="text-[36px] sm:text-[44px] font-semibold text-white tracking-tight leading-[1.06]">
            Ship agents you can <span className="text-[#a5b4fc]">defend in production.</span>
          </h2>
          <p className="mt-5 text-[16px] text-[#b6bbc5] leading-relaxed">
            Open the Console, register your first agent, and watch every call get identity-bound and audit-logged.
            Or just curl the live endpoints and see for yourself.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/console"
              className="inline-flex items-center justify-center rounded-full bg-[#6366f1] hover:bg-[#818cf8] text-white text-[14px] font-medium px-5 py-2.5 no-underline transition-colors"
            >
              Open the Console →
            </Link>
            <Link
              href="/walkthrough"
              className="inline-flex items-center justify-center rounded-full border border-[rgb(46_48_54)] hover:border-[#6366f1] text-white text-[14px] font-medium px-5 py-2.5 no-underline transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
