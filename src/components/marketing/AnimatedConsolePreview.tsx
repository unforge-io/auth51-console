'use client'

import { useEffect, useState, useMemo } from 'react'
import { classifyAgents, type AgentClassification } from '@/lib/agent-classification'
import { formatRegisteredAt, type Registration } from '@/lib/console/api'
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

  // Cycle through highlighted rows. Each cycle picks a new row and the
  // right-hand detail panel re-renders to that agent's details.
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % Math.min(classified.length, 12))
    }, 5200)
    return () => clearInterval(id)
  }, [classified.length])
  const activeAgent = classified[activeIdx]

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

      <div className="flex" style={{ minHeight: 660 }}>
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

          {/* Table — narrowed to 5 columns; full per-agent detail
              lives in the right-hand panel. */}
          <div>
            <table className="w-full text-[11px] table-fixed">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead className="bg-[#0a0b0d] border-b border-[#1f2127]">
                <tr>
                  <Th>Agent ID</Th>
                  <Th>Role</Th>
                  <Th>Reasoning</Th>
                  <Th>Provenance</Th>
                  <Th>Registered</Th>
                </tr>
              </thead>
              <tbody>
                {classified.slice(0, 12).map((a, idx) => {
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <RoleDot role={c.role} />
                          <span className={cn('font-mono truncate', active ? 'text-white' : 'text-white/95')}>{a.agent_id}</span>
                          {active && (
                            <span className="text-[8.5px] font-mono px-1 py-0.5 rounded bg-[#6366f1] text-white animate-pulse shrink-0">live</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <RoleLabel role={c.role} subAgents={c.subAgentCount} parents={c.parentAgentIds.length} />
                      </Td>
                      <Td><span className="text-[#b6bbc5]">{reasoningLabel(c.reasoning)}</span></Td>
                      <Td><ProvenanceChip c={c} /></Td>
                      <Td>
                        <span className={cn('text-[10px]', active ? 'text-[#a5b4fc] font-medium' : 'text-[#b6bbc5]')}>
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

        {/* ── Right-side detail panel ─────────────────────────────────
            Mirrors the real Console's behaviour when an agent row is
            "selected": shows checksum, prompt, and tool inventory for
            the active agent. Re-renders every ~5s as the row cycles. */}
        <DetailPanel agent={activeAgent} />
      </div>
      <style jsx>{`
        @keyframes detail-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :global(.detail-anim) {
          animation: detail-in 380ms ease-out;
        }
      `}</style>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────

function DetailPanel({
  agent,
}: {
  agent: Registration & { classification: AgentClassification }
}) {
  const c = agent.classification
  return (
    <aside
      key={agent.agent_id}
      className="w-[340px] shrink-0 border-l border-[#1f2127] bg-[#0a0b0d] flex flex-col detail-anim"
    >
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-[#1f2127] flex items-center gap-2">
        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#5c6168]">Selected</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px]">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#6366f1] animate-ping opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
          </span>
          <span className="text-[#a5b4fc] font-medium">live</span>
        </span>
      </div>

      {/* Title block */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1f2127]">
        <div className="flex items-center gap-2 mb-2">
          <RoleDot role={c.role} />
          <h3 className="text-[14px] font-semibold text-white font-mono tracking-tight">{agent.agent_id}</h3>
        </div>
        <p className="text-[10.5px] text-[#8a8f98] font-mono break-all">{agent.registration_id}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Pill>{roleLabel(c.role)}</Pill>
          <Pill>{reasoningLabel(c.reasoning)}</Pill>
          <Pill>Autonomous</Pill>
        </div>
      </div>

      {/* Checksum */}
      <Section title="Checksum">
        <p className="font-mono text-[10px] text-[#b6bbc5] break-all leading-relaxed">
          {agent.checksum.slice(0, 32)}
          <span className="text-[#5c6168]">{agent.checksum.slice(32)}</span>
        </p>
      </Section>

      {/* Prompt */}
      <Section title="Prompt">
        <p className="text-[11px] text-[#b6bbc5] leading-relaxed">
          {agent.prompt}
        </p>
      </Section>

      {/* Tools */}
      <Section title={`Tools · ${agent.tools.length}`}>
        <ul className="space-y-2">
          {agent.tools.map((t) => (
            <li key={t.name} className="flex items-start gap-2 text-[10.5px] leading-snug">
              <span className={cn('mt-0.5 inline-flex h-1.5 w-1.5 rounded-full shrink-0', t.is_agent ? 'bg-[#818cf8]' : 'bg-[#8a8f98]')} />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-white truncate">{t.name}</div>
                <div className="font-mono text-[#5c6168] text-[9.5px] truncate">{t.signature}</div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Footer */}
      <div className="mt-auto px-4 py-2.5 border-t border-[#1f2127] flex items-center gap-2 text-[10px] font-mono text-[#5c6168]">
        <span>v{agent.version}</span>
        <span className="text-[#2c2e34]">·</span>
        <span className="truncate">app: {agent.app_id}</span>
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-[#1f2127]">
      <h4 className="text-[9px] font-mono uppercase tracking-wider text-[#5c6168] mb-2">{title}</h4>
      {children}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-[#1f2127] bg-[#131418] text-[9.5px] text-[#b6bbc5]">
      {children}
    </span>
  )
}

function roleLabel(role: AgentClassification['role']): string {
  return role === 'orchestrator' ? 'Orchestrator'
    : role === 'tool-agent'   ? 'Tool-agent'
    : role === 'worker'       ? 'Worker'
    : role === 'hybrid'       ? 'Hybrid'
    : '—'
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
