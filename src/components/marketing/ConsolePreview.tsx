'use client'

import { useMemo } from 'react'
import { classifyAgents, type AgentClassification } from '@/lib/agent-classification'
import { shortChecksum, formatRegisteredAt, type Registration } from '@/lib/console/api'
import { DEMO_AGENTS } from '@/lib/marketing/demoSnapshot'
import { cn } from '@/lib/utils'

/**
 * A static-data, dark-themed rendering of the Console's agents table.
 *
 * Renders inside the marketing site (which is light-themed) inside a
 * frame that visually matches the real Console — dark surface, sidebar
 * silhouette, header chrome, live indicator, role columns, classification
 * chips. Same visual language as the actual product because it uses the
 * same classification library — DEMO_AGENTS flow through classifyAgents()
 * exactly the way real agents do.
 *
 * Read-only. No auth needed. No API calls.
 */
export function ConsolePreview() {
  const classified = useMemo(
    () => classifyAgents(DEMO_AGENTS) as Array<Registration & { classification: AgentClassification }>,
    [],
  )

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-[#0a0b0d]">
      {/* Browser chrome */}
      <div className="bg-[#131418] border-b border-[#1f2127] px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2e34]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2e34]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2e34]" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[10px] font-mono text-[#8a8f98] px-3 py-0.5 rounded bg-[#0a0b0d] border border-[#1f2127]">
            auth51.com/console/agents/registered
          </span>
        </div>
      </div>

      <div className="flex" style={{ minHeight: 460 }}>
        {/* Sidebar silhouette */}
        <div className="w-[170px] shrink-0 border-r border-[#1f2127] bg-[#0a0b0d] p-3">
          <div className="flex items-center gap-2 px-1 mb-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#4338ca] text-white text-[10px] font-bold">A</span>
            <span className="text-[11.5px] font-semibold text-white tracking-tight">Auth51</span>
          </div>
          <SidebarItem heading>Overview</SidebarItem>
          <SidebarSection title="Agents">
            <SidebarItem indent>Discovered <Soon /></SidebarItem>
            <SidebarItem indent active>Registered</SidebarItem>
          </SidebarSection>
          <SidebarSection title="Workflows">
            <SidebarItem indent>Inferred</SidebarItem>
            <SidebarItem indent>Registered</SidebarItem>
          </SidebarSection>
          <SidebarSection title="Security">
            <SidebarItem indent>Threats</SidebarItem>
          </SidebarSection>
          <SidebarSection title="Infrastructure">
            <SidebarItem indent>Resources</SidebarItem>
          </SidebarSection>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="h-9 border-b border-[#1f2127] flex items-center px-3 gap-3">
            <span className="text-[11px] text-[#8a8f98]">Agents</span>
            <span className="text-[10px] text-[#5c6168]">/</span>
            <span className="text-[11px] text-[#ececed] font-medium">Registered</span>
            <span className="ml-auto inline-flex items-center gap-2 text-[10px] text-[#8a8f98]">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#1f2127] bg-[#0a0b0d]">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[#8a8f98]">idp.auth51.com</span>
              </span>
              <span className="text-[#5c6168]">☼</span>
              <span className="h-5 w-5 rounded-full bg-[#1f2127]" />
            </span>
          </div>

          {/* Page header */}
          <div className="border-b border-[#1f2127] px-4 py-3">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-[9px] font-mono tracking-wider uppercase text-[#5c6168] mb-0.5">Agents · Registered</p>
                <h1 className="text-[14px] font-semibold text-white tracking-tight">
                  Patchet
                  <span className="ml-2 text-[10.5px] font-normal text-[#b6bbc5]">{classified.length} agents</span>
                </h1>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[9.5px] text-[#8a8f98]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#1f2127] bg-[#0a0b0d]">
                  <span className="relative inline-flex h-1 w-1">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] animate-ping opacity-60" />
                    <span className="relative inline-flex h-1 w-1 rounded-full bg-[#34d399]" />
                  </span>
                  <span className="font-medium text-[#b6bbc5]">live</span>
                  <span className="text-[#5c6168]">·</span>
                  <span className="font-mono text-[#5c6168]">updated 1s ago</span>
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden">
            <table className="w-full text-[10.5px]">
              <thead className="bg-[#0a0b0d] border-b border-[#1f2127]">
                <tr>
                  <Th>Agent ID</Th>
                  <Th>Role</Th>
                  <Th>Reasoning</Th>
                  <Th>Provenance</Th>
                  <Th>Tools</Th>
                  <Th>Checksum</Th>
                  <Th>Registered</Th>
                </tr>
              </thead>
              <tbody>
                {classified.slice(0, 6).map((a, idx) => {
                  const c = a.classification
                  return (
                    <tr key={a.agent_id} className={cn(
                      'border-b border-[#1f2127]',
                      idx === 0 && 'bg-[#1a1c20]',
                    )}>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <RoleDot role={c.role} />
                          <span className="font-mono text-white">{a.agent_id}</span>
                        </div>
                      </Td>
                      <Td>
                        <RoleLabel role={c.role} subAgents={c.subAgentCount} parents={c.parentAgentIds.length} />
                      </Td>
                      <Td><span className="text-[#b6bbc5]">{reasoningLabel(c.reasoning)}</span></Td>
                      <Td><ProvenanceChip c={c} /></Td>
                      <Td><span className="text-[#b6bbc5]">{a.tools?.length ?? 0}</span></Td>
                      <Td><span className="font-mono text-[#8a8f98] text-[10px]">{shortChecksum(a.checksum, 10)}…</span></Td>
                      <Td><span className="text-[#b6bbc5]">{formatRegisteredAt(a.registered_at)}</span></Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Atoms ─────────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-[8.5px] font-semibold tracking-wider uppercase text-[#5c6168]">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-middle">{children}</td>
}

function RoleDot({ role }: { role: AgentClassification['role'] }) {
  const color =
    role === 'orchestrator' ? 'bg-[#818cf8]' :
    role === 'hybrid'       ? 'bg-[#facc15]' :
    role === 'tool-agent'   ? 'bg-[#8a8f98]' :
    role === 'worker'       ? 'bg-[#34d399]' :
                              'bg-[#5c6168]'
  return <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', color)} />
}

function RoleLabel({ role, subAgents, parents }: { role: AgentClassification['role']; subAgents: number; parents: number }) {
  const label =
    role === 'orchestrator' ? 'Orchestrator' :
    role === 'tool-agent'   ? 'Tool-agent' :
    role === 'worker'       ? 'Worker' :
    role === 'hybrid'       ? 'Hybrid' : '—'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-white font-medium">{label}</span>
      {subAgents > 0 && (
        <span className="text-[8.5px] font-mono text-[#8a8f98] px-1 rounded border border-[#1f2127]">↳ {subAgents}</span>
      )}
      {parents > 0 && role !== 'orchestrator' && (
        <span className="text-[8.5px] font-mono text-[#8a8f98] px-1 rounded border border-[#1f2127]">↑ {parents}</span>
      )}
    </span>
  )
}

function ProvenanceChip({ c }: { c: AgentClassification }) {
  if (c.provenance === 'production') {
    return <span className="text-[10px] text-[#34d399]">Production</span>
  }
  if (c.provenance === 'test-scenario') {
    const kind = c.scenarioActorKind && c.scenarioActorKind !== 'neutral' ? ` · ${c.scenarioActorKind}` : ''
    const tone = c.scenarioActorKind === 'malicious' || c.scenarioActorKind === 'attacker' ? 'text-[#f87171]' : 'text-[#b6bbc5]'
    return <span className={cn('text-[10px] font-mono', tone)}>{c.scenarioId}{kind}</span>
  }
  return <span className="text-[10px] text-[#5c6168]">—</span>
}

function reasoningLabel(r: AgentClassification['reasoning']): string {
  switch (r) {
    case 'react': return 'ReAct loop'
    case 'plan-execute': return 'Plan-and-execute'
    case 'direct': return 'Direct execution'
    case 'conversational': return 'Conversational'
    default: return '—'
  }
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="px-1 text-[8.5px] font-semibold tracking-wider uppercase text-[#5c6168] mb-1">{title}</div>
      {children}
    </div>
  )
}

function SidebarItem({ children, heading, indent, active }: {
  children: React.ReactNode
  heading?: boolean
  indent?: boolean
  active?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center px-1.5 py-1 rounded text-[10.5px]',
      indent && 'pl-3',
      active ? 'bg-[#1a1c20] text-white font-medium' : 'text-[#b6bbc5]',
      heading && 'font-medium text-white',
    )}>
      {children}
    </div>
  )
}

function Soon() {
  return (
    <span className="ml-auto text-[8px] font-medium tracking-wide uppercase text-[#5c6168] px-1 rounded border border-[#1f2127]">
      Soon
    </span>
  )
}
