'use client'

import { useControlPlane } from '@/lib/console/controlPlane'
import { EmptyState } from '@/components/console/EmptyState'

/**
 * Overview — the Console landing page.
 *
 * - If no Control Plane is connected: show first-run empty state with
 *   three setup options.
 * - If connected: show summary cards (counts, health, recent activity).
 *
 * For Phase 1 the "connected" state shows just system health + stub counts;
 * Agents / Threats / Resources views will be filled out next.
 */
export default function ConsoleOverviewPage() {
  const { currentContext } = useControlPlane()

  if (!currentContext) {
    return <EmptyState />
  }

  return <Connected />
}

function Connected() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-[11px] font-mono tracking-wider uppercase text-c-text-3 mb-2">Overview</p>
        <h1 className="text-[28px] font-semibold text-c-text leading-tight tracking-tight">
          Control plane status
        </h1>
        <p className="mt-2 text-[13.5px] text-c-text-2">
          Connected. Browse the sidebar to explore agents, threats, and resources.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Authority" value="online" tone="success" />
        <StatCard label="Registered agents" value="—" tone="neutral" />
        <StatCard label="Threats blocked (24h)" value="—" tone="neutral" />
      </div>

      <div className="mt-10 border border-c-border rounded-xl p-6 bg-c-surface">
        <p className="text-[13px] text-c-text-2 leading-relaxed">
          More views are coming online here. Use the sidebar to navigate to
          Agents, Threats, and Resources. The Discovered / Audit / Workflows
          / MCP views will become available as the underlying endpoints
          on the Authority ship.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'success' | 'neutral' | 'danger' }) {
  const dot =
    tone === 'success' ? 'bg-c-success' :
    tone === 'danger'  ? 'bg-c-danger'  :
    'bg-c-text-3'

  return (
    <div className="border border-c-border rounded-xl p-4 bg-c-surface">
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[11px] font-mono tracking-wider uppercase text-c-text-3">{label}</span>
      </div>
      <div className="text-[22px] font-semibold text-c-text tracking-tight">{value}</div>
    </div>
  )
}
