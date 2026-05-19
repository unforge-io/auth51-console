'use client'

import { THREATS, ANCHORS, severityColorClass, severityBgClass } from '@/lib/console/threats-data'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────────────────
// "12 attacks, 12 blocks" — uses the same data as the Console threats page
// ────────────────────────────────────────────────────────────────────────

export function ThreatsHomeSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-[1200px] px-6">
        <p className="text-[11px] font-mono tracking-wider uppercase text-[#4338ca] mb-3">Empirical evaluation</p>
        <div className="flex flex-col lg:flex-row lg:items-end gap-6 mb-10">
          <div className="flex-1">
            <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#0a2540] tracking-tight max-w-[680px] leading-[1.1]">
              12 known agentic attacks. <span className="text-[#10b981]">All 12 blocked.</span>
            </h2>
            <p className="mt-4 text-[16px] text-[#425466] leading-relaxed max-w-[600px]">
              Every threat below was implemented as a runnable scenario, executed against
              both an OAuth-only baseline and an Auth51-protected configuration. OAuth
              succeeded on every attack. Auth51 blocked every attack.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-[400px]">
            <Mini eyebrow="OAuth" value="0/12" tag="blocked" tone="danger" />
            <Mini eyebrow="Auth51" value="12/12" tag="blocked" tone="success" />
            <Mini eyebrow="Overhead" value="+2.1ms" tag="per token mint" tone="neutral" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THREATS.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded border',
                  severityBgClass(t.severity),
                )}>
                  {t.id}
                </span>
                <span className="text-[12.5px] font-semibold text-[#0a2540] truncate">{t.name}</span>
                <span className={cn('ml-auto text-[9.5px] uppercase tracking-wider font-medium', severityColorClass(t.severity))}>
                  {t.severity}
                </span>
              </div>
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-stone-400 mb-2">{t.category}</div>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <div className="text-[10.5px] px-1.5 py-1 rounded border border-red-200 bg-red-50/60 text-red-700">
                  <span className="font-mono mr-1">✗</span> OAuth
                </div>
                <div className="text-[10.5px] px-1.5 py-1 rounded border border-emerald-200 bg-emerald-50/60 text-emerald-700">
                  <span className="font-mono mr-1">✓</span> Auth51
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.detectedBy.map((aid) => (
                  <span
                    key={aid}
                    title={ANCHORS[aid]?.name ?? aid}
                    className="text-[9.5px] font-mono text-[#4338ca] border border-[#4338ca]/30 bg-[#4338ca]/10 px-1.5 py-0.5 rounded"
                  >
                    {aid}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Mini({ eyebrow, value, tag, tone }: { eyebrow: string; value: string; tag: string; tone: 'success' | 'danger' | 'neutral' }) {
  const color =
    tone === 'success' ? 'text-[#10b981]' :
    tone === 'danger'  ? 'text-[#b91c1c]' :
                         'text-[#0a2540]'
  return (
    <div className="rounded-xl border border-stone-200 px-3 py-3 text-center bg-stone-50/40">
      <div className="text-[10px] font-mono tracking-wider uppercase text-stone-400">{eyebrow}</div>
      <div className={cn('text-[20px] font-semibold tracking-tight mt-1', color)}>{value}</div>
      <div className="text-[10px] text-stone-500 mt-0.5">{tag}</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// K8s mental model — analogy table
// ────────────────────────────────────────────────────────────────────────

export function KubernetesAnalogySection() {
  const rows: Array<{ k8s: string; auth51: string; where: string }> = [
    { k8s: 'kubeconfig',                              auth51: 'a51 config',                  where: 'List of clusters / control planes + creds' },
    { k8s: 'kubectl CLI',                             auth51: 'a51 CLI',                     where: 'Talks to a Control Plane\'s Authority' },
    { k8s: 'K8s Dashboard',                           auth51: 'Auth51 Console',              where: 'Web UI to a Control Plane' },
    { k8s: 'API server / etcd (control plane)',       auth51: 'Auth51 Authority',            where: 'ReplicaSet — source of truth' },
    { k8s: 'kubelet (on each node)',                  auth51: 'Auth51 Runtime',              where: 'In-process library on every agent host' },
    { k8s: 'Admission controller / sidecar / ingress', auth51: 'Auth51 Verifier',             where: 'Sidecar, DaemonSet, or API gateway' },
    { k8s: 'Workload (Deployment / Pod)',             auth51: 'Agentic application',         where: 'The thing being protected' },
    { k8s: 'kubectl apply -f workflow.yaml',          auth51: 'a51 apply -f workflow.yaml',  where: 'Declarative resource registration' },
  ]
  return (
    <section className="py-20 sm:py-28 bg-stone-50/60 border-y border-stone-200/60">
      <div className="mx-auto max-w-[1100px] px-6">
        <p className="text-[11px] font-mono tracking-wider uppercase text-[#4338ca] mb-3">Mental model</p>
        <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#0a2540] tracking-tight max-w-[680px] leading-[1.1]">
          It&apos;s kubectl for AI agents.
        </h2>
        <p className="mt-4 text-[16px] text-[#425466] leading-relaxed max-w-[640px]">
          If you know how a Kubernetes cluster is shaped, you already know how Auth51 deploys.
          Same primitives, mapped to the agent identity domain.
        </p>

        <div className="mt-10 rounded-xl border border-stone-200 overflow-hidden bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-stone-50/60">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-mono tracking-wider uppercase text-stone-500">Kubernetes</th>
                <th className="px-5 py-3 text-left text-[11px] font-mono tracking-wider uppercase text-stone-500">Auth51</th>
                <th className="px-5 py-3 text-left text-[11px] font-mono tracking-wider uppercase text-stone-500 hidden sm:table-cell">What it is</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r) => (
                <tr key={r.k8s} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-[#425466]">{r.k8s}</td>
                  <td className="px-5 py-3.5 font-mono font-medium text-[#4338ca]">{r.auth51}</td>
                  <td className="px-5 py-3.5 text-[#8898aa] hidden sm:table-cell">{r.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Protocol callout — IETF + RFC 8693
// ────────────────────────────────────────────────────────────────────────

export function ProtocolSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#0a0b0d] text-white">
      <div className="mx-auto max-w-[1100px] px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-[11px] font-mono tracking-wider uppercase text-[#818cf8] mb-3">Built on the protocol</p>
          <h2 className="text-[32px] sm:text-[40px] font-semibold text-white tracking-tight leading-[1.1]">
            Standards-based.<br />Not handwaved.
          </h2>
          <p className="mt-4 text-[16px] text-[#b6bbc5] leading-relaxed">
            Auth51 implements the <strong className="text-white">Agentic JWT</strong> IETF
            draft on top of <strong className="text-white">OAuth 2.0 Token Exchange</strong> (RFC 8693).
            Tokens are standard JWTs your existing libraries already understand.
            Every primitive — checksum verification, intent binding, proof-of-possession —
            is published in the spec, not hidden behind a vendor SDK.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>RFC 8693 · Token Exchange</Pill>
            <Pill>RFC 9440 · HTTP Message Signatures</Pill>
            <Pill>draft-goswami-agentic-jwt</Pill>
            <Pill>Ed25519 · RS256</Pill>
          </div>
        </div>

        <div className="rounded-lg border border-[#1f2127] bg-[#131418] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1f2127] flex items-center justify-between">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">decoded intent token (excerpt)</span>
          </div>
          <pre className="px-4 py-4 text-[12px] font-mono text-[#ececed] overflow-x-auto leading-relaxed">
{`{
  "iss":   "https://idp.auth51.com",
  "sub":   "agent:patcher-v1.0.0",
  "aud":   ["api.acme.com/v1/deploy"],
  "scope": "write:deployment",

  // ── Auth51-specific claims ────────────────────
  "agent_checksum": "c2736b78f0bb2c4e…",   // A1
  "intent":        "deploy_release",       // A7
  "workflow_id":   "secure_deploy_v1.0",   // A8
  "workflow_step": "patch_apply",
  "delegation_chain": [                    // A9
    { "agent": "supervisor",  "sig": "…" },
    { "agent": "patcher",     "sig": "…" }
  ],

  // PoP confirmation (RFC 7800 cnf claim)  // A6
  "cnf": { "jkt": "9o5VrGi…" },

  "iat": 1779091016, "exp": 1779092816
}`}
          </pre>
        </div>
      </div>
    </section>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-mono text-[#b6bbc5] px-2.5 py-1 rounded border border-[#1f2127] bg-[#131418]">{children}</span>
}

// ────────────────────────────────────────────────────────────────────────
// Install in 2 minutes
// ────────────────────────────────────────────────────────────────────────

export function InstallSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-[1100px] px-6">
        <p className="text-[11px] font-mono tracking-wider uppercase text-[#4338ca] mb-3">Get started</p>
        <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#0a2540] tracking-tight max-w-[680px] leading-[1.1]">
          Install. Register. Done.
        </h2>
        <p className="mt-4 text-[16px] text-[#425466] leading-relaxed max-w-[640px]">
          The shim is a library, not a service. Drop it into your agent process, register
          once, and every outbound call is identity-bound, intent-bound, and audit-logged.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-lg border border-stone-200 bg-[#0a0b0d] text-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#1f2127] flex items-center justify-between">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">Python</span>
            </div>
            <pre className="px-4 py-4 text-[12.5px] font-mono text-[#ececed] overflow-x-auto leading-relaxed">
{`$ pip install auth51-shim

# In your agent process
from auth51 import init_security, SecureClient

await init_security(app_id="patchet", idp_url="https://idp.auth51.com")
client = SecureClient.get()

# Every outbound call now mints a fresh intent token
response = await client.post(
    "https://api.openai.com/v1/chat/completions",
    json={...},
    intent="generate_response",
)`}
            </pre>
          </div>

          <div className="rounded-lg border border-stone-200 bg-[#0a0b0d] text-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#1f2127] flex items-center justify-between">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">a51 CLI · coming soon</span>
            </div>
            <pre className="px-4 py-4 text-[12.5px] font-mono text-[#ececed] overflow-x-auto leading-relaxed">
{`$ brew install auth51/tap/a51

$ a51 connect https://idp.auth51.com
✓ Connected to Authority at idp.auth51.com

$ a51 agents list patchet
Supervisor    Orchestrator    Plan-and-execute    ↳ 3 sub-agents
Planner       Tool-agent      ReAct loop          4 tools
Classifier    Tool-agent      Direct execution    3 tools
Patcher       Tool-agent      Direct execution    2 tools

$ a51 apply -f workflow.yaml
✓ workflow secure_deploy_v1.0 registered`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
