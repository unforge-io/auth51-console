'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useControlPlane } from '@/lib/console/controlPlane'
import { listAgents, listRegisteredWorkflows, checkHealth } from '@/lib/console/api'
import { useAutoRefresh } from '@/lib/console/useAutoRefresh'
import { useRefreshInterval } from '@/lib/console/useRefreshInterval'
import { classifyAgents, buildImplicitWorkflows, type AgentClassification } from '@/lib/agent-classification'
import { THREATS } from '@/lib/console/threats-data'
import { EmptyState } from '@/components/console/EmptyState'
import { LiveIndicator } from '@/components/console/LiveIndicator'
import { cn } from '@/lib/utils'

/**
 * Overview — the Console landing page.
 *
 * Empty state when no Control Plane is connected.
 * Live state otherwise — health, counts, role/provenance breakdowns,
 * approval-gated workflow callouts. Polls on the same global interval
 * preference as the other live views.
 */
export default function ConsoleOverviewPage() {
  const { currentContext } = useControlPlane()
  if (!currentContext) return <EmptyState />
  return <Connected />
}

type OverviewState = {
  health: 'unknown' | 'ok' | 'down'
  agentCount: number
  orchestratorCount: number
  workerCount: number
  productionAgents: number
  scenarioAgents: number
  registeredWorkflowCount: number
  inferredWorkflowCount: number
  approvalGatedWorkflows: number
}

const INITIAL: OverviewState = {
  health: 'unknown',
  agentCount: 0,
  orchestratorCount: 0,
  workerCount: 0,
  productionAgents: 0,
  scenarioAgents: 0,
  registeredWorkflowCount: 0,
  inferredWorkflowCount: 0,
  approvalGatedWorkflows: 0,
}

function Connected() {
  const { currentContext } = useControlPlane()
  const [state, setState] = useState<OverviewState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true)
    setError(null)
    try {
      const [healthy, agents, workflows] = await Promise.all([
        checkHealth(currentContext.endpoint),
        listAgents(currentContext).catch(() => []),
        listRegisteredWorkflows(currentContext).catch(() => []),
      ])

      const classified = classifyAgents(agents) as Array<{ classification: AgentClassification }>
      const orchestrators = classified.filter((a) => a.classification.isOrchestrator).length
      const workers = classified.filter((a) => a.classification.role === 'worker').length
      const production = classified.filter((a) => a.classification.provenance === 'production').length
      const scenarios = classified.filter((a) => a.classification.provenance === 'test-scenario').length

      // Compute inferred workflow count (same logic as the inferred view)
      const inferredCount = buildImplicitWorkflows(classifyAgents(agents) as Parameters<typeof buildImplicitWorkflows>[0]).length

      // Workflows with approval-gated steps
      const approvalGated = workflows.filter((w) =>
        Object.values(w.steps).some((s) => s.approval_gate || s.requires_approval),
      ).length

      setState({
        health: healthy ? 'ok' : 'down',
        agentCount: agents.length,
        orchestratorCount: orchestrators,
        workerCount: workers,
        productionAgents: production,
        scenarioAgents: scenarios,
        registeredWorkflowCount: workflows.length,
        inferredWorkflowCount: inferredCount,
        approvalGatedWorkflows: approvalGated,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [currentContext])

  // Live polling
  const { intervalMs, setIntervalMs } = useRefreshInterval()
  const { lastUpdatedAt, tickedAt } = useAutoRefresh({
    intervalMs,
    fetcher: load,
    enabled: !!currentContext,
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-[11px] font-mono tracking-wider uppercase text-c-text-3 mb-1">Overview</p>
          <h1 className="text-[26px] font-semibold text-c-text leading-tight tracking-tight">
            {currentContext?.name ?? 'Control plane'}
          </h1>
          <p className="mt-1 text-[12.5px] text-c-text-3 font-mono">{currentContext?.endpoint}</p>
        </div>
        <LiveIndicator
          lastUpdatedAt={lastUpdatedAt}
          tick={tickedAt}
          loading={loading}
          onRefresh={load}
          intervalMs={intervalMs}
          onIntervalChange={setIntervalMs}
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md border border-c-danger/30 bg-c-danger/5 text-[12.5px] text-c-danger">
          <div className="font-medium mb-1">Could not load overview</div>
          <div className="text-[11.5px] opacity-90">{error}</div>
        </div>
      )}

      {/* Top row — headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Authority"
          value={state.health === 'ok' ? 'online' : state.health === 'down' ? 'down' : '—'}
          tone={state.health === 'ok' ? 'success' : state.health === 'down' ? 'danger' : 'neutral'}
        />
        <StatCard
          label="Registered agents"
          value={String(state.agentCount)}
          sub={`${state.productionAgents} production · ${state.scenarioAgents} scenario`}
          tone="neutral"
        />
        <StatCard
          label="Registered workflows"
          value={String(state.registeredWorkflowCount)}
          sub={state.approvalGatedWorkflows > 0 ? `${state.approvalGatedWorkflows} approval-gated` : 'all autonomous'}
          tone="neutral"
        />
        <StatCard
          label="Known threats covered"
          value={`${THREATS.length} / ${THREATS.length}`}
          sub="blocked under Auth51"
          tone="success"
        />
      </div>

      {/* Roles + inferred breakdown */}
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel label="Agent roles">
          <Row k="Orchestrators" v={String(state.orchestratorCount)} />
          <Row k="Workers" v={String(state.workerCount)} />
          <Row k="Other (tool-agent, hybrid)" v={String(Math.max(0, state.agentCount - state.orchestratorCount - state.workerCount))} />
        </Panel>
        <Panel label="Workflow shapes">
          <Row k="Inferred (from tool graph)" v={String(state.inferredWorkflowCount)} />
          <Row k="Registered (declared with IDP)" v={String(state.registeredWorkflowCount)} />
          <Row k="Approval-gated" v={String(state.approvalGatedWorkflows)} />
        </Panel>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QuickLink href="/console/agents/registered" label="Agents" subtitle="Registered" />
        <QuickLink href="/console/workflows/inferred" label="Workflows" subtitle="Inferred" />
        <QuickLink href="/console/workflows/registered" label="Workflows" subtitle="Registered" />
        <QuickLink href="/console/security/threats" label="Threats" subtitle="Catalog" />
      </div>
    </div>
  )
}

// ─── Visual atoms ──────────────────────────────────────────────────────

function StatCard({
  label, value, sub, tone,
}: {
  label: string
  value: string
  sub?: string
  tone: 'success' | 'neutral' | 'danger'
}) {
  const dot =
    tone === 'success' ? 'bg-c-success' :
    tone === 'danger'  ? 'bg-c-danger'  :
                          'bg-c-text-3'
  const valueColor =
    tone === 'success' ? 'text-c-success' :
    tone === 'danger'  ? 'text-c-danger'  :
                          'text-c-text'
  return (
    <div className="border border-c-border rounded-xl p-4 bg-c-surface">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
        <span className="text-[10.5px] font-mono tracking-wider uppercase text-c-text-3">{label}</span>
      </div>
      <div className={cn('text-[22px] font-semibold tracking-tight', valueColor)}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-c-text-3">{sub}</div>}
    </div>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-c-border rounded-xl bg-c-surface">
      <div className="px-4 py-2.5 border-b border-c-border text-[10.5px] font-mono tracking-wider uppercase text-c-text-3">
        {label}
      </div>
      <div className="px-4 py-3 space-y-1">{children}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-[12.5px]">
      <span className="text-c-text-2">{k}</span>
      <span className="font-mono text-c-text">{v}</span>
    </div>
  )
}

function QuickLink({ href, label, subtitle }: { href: string; label: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="block border border-c-border rounded-xl px-4 py-3 bg-c-surface hover:bg-c-surface-2 hover:border-c-border-2 transition-colors no-underline group"
    >
      <div className="text-[10.5px] font-mono tracking-wider uppercase text-c-text-3">{label}</div>
      <div className="text-[13.5px] font-semibold text-c-text mt-1 flex items-center justify-between">
        {subtitle}
        <span className="text-c-text-3 group-hover:text-c-accent transition-colors">→</span>
      </div>
    </Link>
  )
}
