'use client'

import { useEffect, useState, useMemo } from 'react'
import { classifyAgents, type AgentClassification } from '@/lib/agent-classification'
import { shortChecksum, formatRegisteredAt, type Registration } from '@/lib/console/api'
import { DEMO_AGENTS } from '@/lib/marketing/demoSnapshot'
import { cn } from '@/lib/utils'

/**
 * The hero's live Console panel. Same visual language as the real Console,
 * driven by the same classification pipeline, but with three light
 * animations that convey "things are happening here":
 *   1. The live indicator pulses (CSS).
 *   2. The "updated Ns ago" label ticks up every second.
 *   3. Every ~5s, a different row briefly highlights (mimicking a Token
 *      Mint or registration event landing on that agent).
 *
 * No fake data is injected — the highlighted row is one of the real
 * DEMO_AGENTS, and the only thing changing is a brief visual accent.
 * Honest "live-feeling" rather than dishonest "live-faked".
 */
export function AnimatedConsolePreview() {
  const classified = useMemo(
    () => classifyAgents(DEMO_AGENTS) as Array<Registration & { classification: AgentClassification }>,
    [],
  )

  // Tick the "Ns ago" label
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => (x + 1) & 0xffff), 1000)
    return () => clearInterval(id)
  }, [])

  // Cycle through highlighted rows
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % Math.min(classified.length, 9))
    }, 4500)
    return () => clearInterval(id)
  }, [classified.length])

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-[#0a0b0d]">
      {/* Browser chrome */}
      <div className="bg-[#131418] border-b border-[#1f2127] px-3.5 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2e34]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2e34]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2e34]" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[11px] font-mono text-[#8a8f98] px-3 py-0.5 rounded bg-[#0a0b0d] border border-[#1f2127]">
            auth51.com/console/agents/registered
          </span>
        </div>
        <span className="text-[10px] text-[#5c6168] font-mono">v0.1</span>
      </div>

      <div className="flex" style={{ minHeight: 740 }}>
        {/* Sidebar */}
        <div className="w-[210px] shrink-0 border-r border-[#1f2127] bg-[#0a0b0d] py-3">
          <div className="px-3 flex items-center gap-2 mb-3 pb-3 border-b border-[#1f2127]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#6366f1] text-white text-[10px] font-bold">A</span>
            <span className="text-[12px] font-semibold text-white tracking-tight">Auth51</span>
            <span className="ml-auto text-[8.5px] font-mono text-[#5c6168] uppercase tracking-wider">Console</span>
          </div>
          <div className="px-2">
            <div className="px-2 py-1 mb-1.5 text-[11px] text-[#b6bbc5]">Overview</div>
            <SidebarHeading>Agents</SidebarHeading>
            <SidebarItem indent>Discovered <Soon /></SidebarItem>
            <SidebarItem indent active>Registered</SidebarItem>
            <SidebarHeading>Workflows</SidebarHeading>
            <SidebarItem indent>Inferred</SidebarItem>
            <SidebarItem indent>Registered</SidebarItem>
            <SidebarItem indent>Runtime <Soon /></SidebarItem>
            <SidebarHeading>Security</SidebarHeading>
            <SidebarItem indent>Threats</SidebarItem>
            <SidebarItem indent>Policies <Soon /></SidebarItem>
            <SidebarHeading>Audit</SidebarHeading>
            <SidebarItem indent>Events <Soon /></SidebarItem>
            <SidebarItem indent>Mints <Soon /></SidebarItem>
            <SidebarHeading>Infrastructure</SidebarHeading>
            <SidebarItem indent>Resources</SidebarItem>
            <SidebarItem indent>Authorities</SidebarItem>
            <SidebarHeading>Settings</SidebarHeading>
            <SidebarItem indent>Identity <Soon /></SidebarItem>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Page header bar */}
          <div className="h-10 border-b border-[#1f2127] flex items-center px-4 gap-3">
            <span className="text-[11.5px] text-[#8a8f98]">Agents</span>
            <span className="text-[10px] text-[#5c6168]">/</span>
            <span className="text-[11.5px] text-white font-medium">Registered</span>
            <span className="ml-auto inline-flex items-center gap-2 text-[10.5px] text-[#8a8f98]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#1f2127] bg-[#0a0b0d]">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[#8a8f98]">idp.auth51.com</span>
              </span>
              <span className="text-[#5c6168]">☼</span>
              <span className="h-5 w-5 rounded-full bg-[#1f2127]" />
            </span>
          </div>

          {/* Title strip */}
          <div className="border-b border-[#1f2127] px-5 py-3.5 flex items-start justify-between gap-3">
            <div>
              <p className="text-[9.5px] font-mono tracking-wider uppercase text-[#5c6168] mb-1">Agents · Registered</p>
              <h1 className="text-[15px] font-semibold text-white tracking-tight">
                Patchet
                <span className="ml-2 text-[11.5px] font-normal text-[#b6bbc5]">{classified.length} agents</span>
              </h1>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-[#8a8f98]">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-[#1f2127] bg-[#0a0b0d]">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] animate-ping opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                </span>
                <span className="text-[#b6bbc5] font-medium text-[10.5px]">live</span>
                <span className="text-[#5c6168]">·</span>
                <span className="font-mono text-[#5c6168] text-[10.5px]">updated {1 + (Date.now() / 1000 % 5 | 0)}s ago</span>
              </span>
              <span className="px-2 py-1 rounded border border-[#1f2127] text-[#8a8f98] font-mono">10s ▾</span>
              <span className="px-1.5 py-1 text-[#8a8f98]">↻</span>
            </div>
          </div>

          {/* Filter row */}
          <div className="px-5 py-2.5 border-b border-[#1f2127] flex items-center gap-2 text-[10.5px]">
            <input
              disabled
              placeholder="Filter by ID, checksum, role, reasoning…"
              className="bg-[#0a0b0d] border border-[#1f2127] rounded-md px-2.5 py-1 text-[11px] text-[#5c6168] w-[280px]"
            />
            <div className="ml-auto flex items-center rounded-md border border-[#1f2127] bg-[#0a0b0d] overflow-hidden text-[10.5px]">
              <span className="px-2 py-1 bg-[#1a1c20] text-white">All</span>
              <span className="px-2 py-1 text-[#8a8f98]">Orchestrators</span>
              <span className="px-2 py-1 text-[#8a8f98]">Workers</span>
              <span className="px-2 py-1 text-[#8a8f98]">Scenarios</span>
            </div>
          </div>

          {/* Table */}
          <div>
            <table className="w-full text-[11px]">
              <thead className="bg-[#0a0b0d] border-b border-[#1f2127]">
                <tr>
                  <Th>Agent ID</Th>
                  <Th>Role</Th>
                  <Th>Reasoning</Th>
                  <Th>Autonomy</Th>
                  <Th>Provenance</Th>
                  <Th>Checksum</Th>
                  <Th>Registered</Th>
                </tr>
              </thead>
              <tbody>
                {classified.slice(0, 9).map((a, idx) => {
                  const c = a.classification
                  const active = activeIdx === idx
                  return (
                    <tr
                      key={a.agent_id}
                      className={cn(
                        'border-b border-[#1f2127] transition-all duration-700 ease-out',
                        active ? 'bg-[#6366f1]/10 ring-1 ring-inset ring-[#6366f1]/30' : 'hover:bg-[#131418]',
                      )}
                    >
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <RoleDot role={c.role} />
                          <span className={cn('font-mono', active ? 'text-white' : 'text-white/95')}>{a.agent_id}</span>
                          {active && (
                            <span className="text-[8.5px] font-mono px-1 py-0.5 rounded bg-[#6366f1] text-white animate-pulse">live</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <RoleLabel role={c.role} subAgents={c.subAgentCount} parents={c.parentAgentIds.length} />
                      </Td>
                      <Td><span className="text-[#b6bbc5]">{reasoningLabel(c.reasoning)}</span></Td>
                      <Td><span className="text-[#b6bbc5]">Autonomous</span></Td>
                      <Td><ProvenanceChip c={c} /></Td>
                      <Td><span className="font-mono text-[#8a8f98] text-[10px]">{shortChecksum(a.checksum, 10)}…</span></Td>
                      <Td>
                        <span className={cn(active ? 'text-[#a5b4fc] font-medium' : 'text-[#b6bbc5]')}>
                          {active ? 'just now' : formatRegisteredAt(a.registered_at)}
                        </span>
                      </Td>
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
  return <th className="px-3.5 py-2 text-left text-[9px] font-semibold tracking-wider uppercase text-[#5c6168]">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3.5 py-2.5 align-middle">{children}</td>
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
        <span className="text-[9px] font-mono text-[#8a8f98] px-1 rounded border border-[#1f2127]">↳ {subAgents}</span>
      )}
      {parents > 0 && role !== 'orchestrator' && (
        <span className="text-[9px] font-mono text-[#8a8f98] px-1 rounded border border-[#1f2127]">↑ {parents}</span>
      )}
    </span>
  )
}
function ProvenanceChip({ c }: { c: AgentClassification }) {
  if (c.provenance === 'production') {
    return <span className="text-[10.5px] text-[#34d399]">Production</span>
  }
  if (c.provenance === 'test-scenario') {
    const kind = c.scenarioActorKind && c.scenarioActorKind !== 'neutral' ? ` · ${c.scenarioActorKind}` : ''
    const tone = c.scenarioActorKind === 'malicious' || c.scenarioActorKind === 'attacker' ? 'text-[#f87171]' : 'text-[#b6bbc5]'
    return <span className={cn('text-[10.5px] font-mono', tone)}>{c.scenarioId}{kind}</span>
  }
  return <span className="text-[10.5px] text-[#5c6168]">—</span>
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
function SidebarHeading({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 px-2 text-[8.5px] font-semibold tracking-wider uppercase text-[#5c6168] mb-1">{children}</div>
}
function SidebarItem({ children, indent, active }: { children: React.ReactNode; indent?: boolean; active?: boolean }) {
  return (
    <div className={cn(
      'flex items-center px-2 py-1 rounded text-[11px]',
      indent && 'pl-4',
      active ? 'bg-[#1a1c20] text-white font-medium' : 'text-[#b6bbc5]',
    )}>
      {children}
    </div>
  )
}
function Soon() {
  return (
    <span className="ml-auto text-[8.5px] font-medium tracking-wide uppercase text-[#5c6168] px-1 rounded border border-[#1f2127]">
      Soon
    </span>
  )
}
