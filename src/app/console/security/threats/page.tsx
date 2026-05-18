'use client'

import { useMemo, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  THREATS,
  THREAT_METRICS,
  ANCHORS,
  severityColorClass,
  severityBgClass,
  type Threat,
} from '@/lib/console/threats-data'
import { cn } from '@/lib/utils'

/**
 * Threats board.
 *
 * Static catalog of the 12 known threats to agentic systems, with empirical
 * outcomes under OAuth vs Auth51 baselines. Sourced from the patchet
 * empirical evaluation. Later: this becomes dynamic — an analyzer agent
 * cross-references real blocks against OSV/OWASP/CVE data and surfaces
 * contextual insights here.
 *
 * "Run live" is intentionally disabled for the demo Authority because
 * scenario runs reset agent/workflow state. When isolated test
 * environments exist, the button becomes active.
 */
export default function ThreatsPage() {
  const { currentContext } = useControlPlane()
  const [selectedId, setSelectedId] = useState<string | null>(THREATS[0]?.id ?? null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return THREATS
    return THREATS.filter((t) => t.severity === filter)
  }, [filter])

  const selected = useMemo(
    () => THREATS.find((t) => t.id === selectedId) ?? THREATS[0],
    [selectedId],
  )

  if (!currentContext) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-[14px] text-c-text-2">Connect a Control Plane from the Overview page to see the threats catalog.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-c-border px-6 py-5">
          <p className="text-[11px] font-mono tracking-wider uppercase text-c-text-3 mb-1">Security · Threats</p>
          <h1 className="text-[22px] font-semibold text-c-text tracking-tight">Threat catalog</h1>
          <p className="mt-1.5 text-[13px] text-c-text-2 max-w-[680px] leading-relaxed">
            Twelve known attack patterns against agentic systems, evaluated against OAuth and Auth51 baselines.
            Empirical results from the Patchet evaluation suite — every attack blocked under Auth51.
          </p>
        </div>

        {/* Summary banner */}
        <SummaryBanner />

        {/* Filter */}
        <div className="px-6 py-3 border-b border-c-border flex items-center gap-3">
          <div className="flex items-center rounded-md border border-c-border bg-c-bg overflow-hidden">
            {(['all', 'critical', 'high', 'medium'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={cn(
                  'px-2.5 py-1.5 text-[11.5px] font-medium transition-colors capitalize',
                  filter === opt ? 'bg-c-surface-2 text-c-text' : 'text-c-text-2 hover:text-c-text',
                )}
              >
                {opt} {opt !== 'all' && (
                  <span className="ml-1 text-[10px] text-c-text-3 font-mono">
                    {THREATS.filter((t) => t.severity === opt).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="text-[11.5px] text-c-text-3">
            {filtered.length} of {THREATS.length} threats · sourced from <code className="font-mono">summary_report.md</code> {new Date(THREAT_METRICS.reportGenerated).toLocaleDateString()}
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((t) => (
              <ThreatCard
                key={t.id}
                threat={t}
                isSelected={selected?.id === t.id}
                onSelect={() => setSelectedId(t.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selection detail panel */}
      {selected && <DetailPanel threat={selected} />}
    </div>
  )
}

// ─── Summary banner ────────────────────────────────────────────────────

function SummaryBanner() {
  const m = THREAT_METRICS
  return (
    <div className="px-6 py-4 border-b border-c-border">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          eyebrow="OAuth baseline"
          headline={`${m.oauthSucceeded}/${m.total}`}
          tag="attacks succeeded"
          tone="danger"
        />
        <SummaryCard
          eyebrow="Auth51 (Agentic JWT)"
          headline={`${m.intentBlocked}/${m.total}`}
          tag="attacks blocked"
          tone="success"
        />
        <SummaryCard
          eyebrow="Token mint overhead"
          headline={`+${(m.performance.tokenMintMs.intent - m.performance.tokenMintMs.oauth).toFixed(1)}ms`}
          tag={`${m.performance.tokenMintMs.oauth}ms → ${m.performance.tokenMintMs.intent}ms`}
          tone="neutral"
        />
      </div>
    </div>
  )
}

function SummaryCard({
  eyebrow, headline, tag, tone,
}: {
  eyebrow: string
  headline: string
  tag: string
  tone: 'success' | 'danger' | 'neutral'
}) {
  const headlineColor =
    tone === 'success' ? 'text-c-success' :
    tone === 'danger'  ? 'text-c-danger'  :
                         'text-c-text'
  return (
    <div className="border border-c-border rounded-xl px-4 py-3 bg-c-surface">
      <div className="text-[10px] font-mono tracking-wider uppercase text-c-text-3 mb-1.5">{eyebrow}</div>
      <div className={cn('text-[22px] font-semibold tracking-tight', headlineColor)}>{headline}</div>
      <div className="text-[11px] text-c-text-2 mt-0.5">{tag}</div>
    </div>
  )
}

// ─── Threat card ───────────────────────────────────────────────────────

function ThreatCard({
  threat, isSelected, onSelect,
}: {
  threat: Threat
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group text-left rounded-xl border bg-c-surface px-4 py-3 transition-colors',
        isSelected ? 'border-c-accent bg-c-surface-2' : 'border-c-border hover:border-c-border-2 hover:bg-c-surface-2',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded border',
            severityBgClass(threat.severity),
          )}>
            {threat.id}
          </span>
          <span className="text-[12.5px] font-semibold text-c-text truncate">{threat.name}</span>
        </div>
        <span className={cn(
          'text-[9.5px] font-medium uppercase tracking-wider whitespace-nowrap',
          severityColorClass(threat.severity),
        )}>
          {threat.severity}
        </span>
      </div>

      {/* Category + attack one-liner */}
      <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">{threat.category}</div>
      <p className="text-[12px] text-c-text-2 leading-relaxed line-clamp-2 mb-3">{threat.attack}</p>

      {/* Outcomes side-by-side */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Outcome
          label="OAuth"
          icon="✗"
          tone="danger"
          status="succeeded"
        />
        <Outcome
          label="Auth51"
          icon="✓"
          tone="success"
          status="blocked"
        />
      </div>

      {/* Anchors */}
      <div className="flex flex-wrap gap-1">
        {threat.detectedBy.map((aid) => (
          <span
            key={aid}
            title={ANCHORS[aid]?.name ?? aid}
            className="text-[9.5px] font-mono text-c-accent border border-c-accent/30 bg-c-accent/10 px-1.5 py-0.5 rounded"
          >
            {aid}
          </span>
        ))}
      </div>
    </button>
  )
}

function Outcome({
  label, icon, tone, status,
}: {
  label: string
  icon: string
  tone: 'success' | 'danger'
  status: string
}) {
  return (
    <div className={cn(
      'rounded-md border px-2 py-1.5 text-[11px]',
      tone === 'success'
        ? 'border-c-success/30 bg-c-success/10 text-c-success'
        : 'border-c-danger/30 bg-c-danger/10 text-c-danger',
    )}>
      <span className="font-mono mr-1">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="ml-1 text-c-text-3">{status}</span>
    </div>
  )
}

// ─── Detail panel ──────────────────────────────────────────────────────

function DetailPanel({ threat }: { threat: Threat }) {
  return (
    <div className="w-[380px] shrink-0 border-l border-c-border bg-c-surface overflow-y-auto">
      <div className="sticky top-0 bg-c-surface border-b border-c-border px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            'text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border',
            severityBgClass(threat.severity),
          )}>
            {threat.id}
          </span>
          <span className={cn(
            'text-[9.5px] font-medium uppercase tracking-wider',
            severityColorClass(threat.severity),
          )}>
            {threat.severity}
          </span>
        </div>
        <h2 className="text-[16px] font-semibold text-c-text leading-tight">{threat.name}</h2>
        <p className="mt-0.5 text-[11px] font-mono uppercase tracking-wider text-c-text-3">{threat.category}</p>
      </div>

      <div className="px-5 py-4 space-y-5 text-[12.5px]">
        {/* Attack description */}
        <Section label="Attack">
          <p className="text-c-text-2 leading-relaxed">{threat.attack}</p>
        </Section>

        {/* Outcomes */}
        <Section label="Outcomes">
          <div className="space-y-2.5">
            <div className="border border-c-danger/30 bg-c-danger/5 rounded-md px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-c-danger font-mono">✗</span>
                <span className="font-medium text-c-danger">OAuth baseline · succeeded</span>
              </div>
              <p className="text-[11.5px] text-c-text-2 leading-relaxed">{threat.oauthOutcome.note}</p>
            </div>
            <div className="border border-c-success/30 bg-c-success/5 rounded-md px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-c-success font-mono">✓</span>
                <span className="font-medium text-c-success">Auth51 (Agentic JWT) · blocked</span>
              </div>
              <p className="text-[11.5px] text-c-text-2 leading-relaxed">{threat.intentOutcome.note}</p>
            </div>
          </div>
        </Section>

        {/* Anchors */}
        <Section label={`Detected by · ${threat.detectedBy.length} anchor${threat.detectedBy.length === 1 ? '' : 's'}`}>
          <ul className="space-y-2">
            {threat.detectedBy.map((aid) => {
              const a = ANCHORS[aid]
              return (
                <li key={aid} className="text-[12px]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono text-c-accent border border-c-accent/30 bg-c-accent/10 px-1.5 py-0.5 rounded">
                      {aid}
                    </span>
                    <span className="font-medium text-c-text">{a?.name ?? aid}</span>
                  </div>
                  {a?.brief && (
                    <p className="mt-1 ml-1 text-[11px] text-c-text-2 leading-relaxed">{a.brief}</p>
                  )}
                </li>
              )
            })}
          </ul>
        </Section>

        {/* Real-world parallel */}
        {threat.parallel && (
          <Section label="Real-world parallel">
            <p className="text-[11.5px] text-c-text-2 leading-relaxed">{threat.parallel}</p>
          </Section>
        )}

        {/* Run live (disabled — see header comment) */}
        <Section label="Live evaluation">
          <button
            disabled
            title="Live scenario runs reset Authority state in the shared demo environment. Available on isolated environments."
            className="w-full text-left px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text-3 cursor-not-allowed"
          >
            <div className="text-[11px] uppercase tracking-wider text-c-text-3">Disabled in shared demo</div>
            <div className="text-[12px] mt-0.5">Run {threat.id} against demo.auth51.com →</div>
          </button>
          <p className="mt-2 text-[10.5px] text-c-text-3 leading-relaxed">
            Available on isolated environments. Once the analyzer agent ships, this page will surface real blocks from your traffic with OSV/OWASP cross-references — no manual runs needed.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-wider uppercase text-c-text-3 mb-2">{label}</div>
      {children}
    </div>
  )
}
