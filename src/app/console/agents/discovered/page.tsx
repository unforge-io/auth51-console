'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  AuthorityError,
  consumeProposal,
  listAgents,
  listDiscovered,
  listProposals,
  registerAgent,
  shortChecksum,
  formatRegisteredAt,
  type DiscoveredTrigger,
  type Proposal,
} from '@/lib/console/api'
import { EmptyState } from '@/components/console/EmptyState'

/**
 * Discovered — every unregistered agent auth51 has SEEN, joined by checksum
 * across two independent signals so you can read every execution pattern:
 *
 *   • proposal (auth51-discovery)  — pushed at the LLM egress: the agent's
 *     observed identity (prompt + tools + computed checksum). No mint required.
 *   • mint trigger (Authority)     — a denied mint attempt persists the SAME
 *     checksum as a reference (no content — DESIGN §5b).
 *
 * The embed uses one wire-derived checksum for both, so they join. That surfaces:
 *   proposed + mint-attempted · proposed, no mint yet · mint-attempted, no proposal.
 * Approve (needs proposal content) → the Authority's /register/agent; recognized
 * next run. Registered agents are hidden.
 */

type Row = {
  agent_id: string
  checksum: string
  first_seen_at: number
  proposal: Proposal | null           // content, from discovery
  trigger: DiscoveredTrigger | null   // mint reference, from the Authority
}

const POLL_MS = 15_000

export default function DiscoveredAgentsPage() {
  const { currentContext } = useControlPlane()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [justRegistered, setJustRegistered] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (background = false) => {
    if (!currentContext) return
    if (!background) { setLoading(true); setError(null) }
    try {
      const [proposals, triggers, registered] = await Promise.all([
        listProposals(currentContext).catch(() => [] as Proposal[]),
        listDiscovered(currentContext).catch(() => [] as DiscoveredTrigger[]),
        listAgents(currentContext).catch(() => []),
      ])
      const registeredIds = new Set(registered.map((a) => a.agent_id))

      // Union by checksum — the join key the embed stamps on both signals.
      const byChecksum = new Map<string, Row>()
      const upsert = (checksum: string, agent_id: string, seen: number) => {
        const existing = byChecksum.get(checksum)
        if (existing) return existing
        const row: Row = { agent_id, checksum, first_seen_at: seen, proposal: null, trigger: null }
        byChecksum.set(checksum, row)
        return row
      }
      for (const p of proposals) {
        const row = upsert(p.checksum, p.agent_id, p.first_seen_at)
        row.proposal = p
      }
      for (const t of triggers) {
        const row = upsert(t.checksum, t.agent_id, t.first_seen_at)
        row.trigger = t
        if (t.agent_id && row.agent_id.startsWith('unregistered-')) row.agent_id = t.agent_id
      }

      setRows(
        [...byChecksum.values()]
          .filter((r) => !registeredIds.has(r.agent_id))
          .sort((a, b) => b.first_seen_at - a.first_seen_at),
      )
    } catch (err) {
      if (!background) {
        setError(err instanceof AuthorityError
          ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
          : err instanceof Error ? err.message : String(err))
        setRows([])
      }
    } finally { if (!background) setLoading(false) }
  }, [currentContext])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    timer.current = setInterval(() => load(true), POLL_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [load])

  const approve = async (r: Row) => {
    if (!currentContext || !r.proposal) return
    setBusy(r.checksum); setError(null)
    try {
      const ack = await registerAgent(currentContext, r.proposal)
      await consumeProposal(currentContext, r.checksum)  // retire it at the source
      setJustRegistered(ack.agent_id)
      await load()
    } catch (err) {
      setError(err instanceof AuthorityError
        ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
        : err instanceof Error ? err.message : String(err))
    } finally { setBusy(null) }
  }

  const visible = rows.filter((r) => !dismissed.has(r.checksum))

  if (!currentContext) return <EmptyState />

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-semibold text-c-text tracking-tight">Discovered</h1>
        {visible.length > 0 && (
          <span className="rounded-full bg-c-accent/10 border border-c-accent/30 px-2 py-0.5 text-[11px] font-mono text-c-accent-2">
            {visible.length} pending
          </span>
        )}
      </div>
      <p className="mt-1 mb-6 text-[14px] text-c-text-2 max-w-2xl">
        Every unregistered agent auth51 has seen — captured at the model call, and
        cross-referenced with any token-mint attempt. Review the identity and register;
        the agent&rsquo;s next run is recognized and governed.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>
      )}
      {justRegistered && (
        <div className="mb-4 rounded-lg border border-c-success/30 bg-c-success/5 px-4 py-3 text-[13px] text-c-success">
          ✓ <span className="font-mono">{justRegistered}</span> registered — recognized on its next run.{' '}
          <a href="/console/agents/registered" className="underline hover:no-underline">View in Registered →</a>
        </div>
      )}

      <div className="rounded-xl border border-c-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
          <span>Agent</span><span>Signals</span><span>First seen</span><span className="text-right">Actions</span>
        </div>

        {loading && visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-c-text-3">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-c-text-3">
            Nothing waiting. Run an agent with the auth51 client installed and it
            appears here on its first model call.
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.checksum} className="border-t border-c-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[14px] text-c-text font-medium truncate">{r.agent_id}</div>
                  <div className="text-[11.5px] text-c-text-3">
                    <span className="font-mono">{shortChecksum(r.checksum, 12)}…</span>
                    {r.proposal && (
                      <>{' · '}<button onClick={() => setExpanded(expanded === r.checksum ? null : r.checksum)}
                                       className="text-c-accent-2 hover:underline">
                        {expanded === r.checksum ? 'hide identity' : 'review identity'}
                      </button></>
                    )}
                  </div>
                </div>
                <SignalBadges row={r} />
                <span className="text-[12px] text-c-text-3">{formatRegisteredAt(r.first_seen_at)}</span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => approve(r)}
                    disabled={!r.proposal || busy === r.checksum}
                    title={r.proposal ? 'Register this identity' : 'No proposal content — the client hasn’t sent this agent’s prompt/tools yet'}
                    className="rounded-md bg-c-accent px-2.5 py-1 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy === r.checksum ? '…' : 'Register'}
                  </button>
                  <button
                    onClick={() => setDismissed((d) => new Set(d).add(r.checksum))}
                    disabled={busy === r.checksum}
                    className="rounded-md border border-c-border px-2.5 py-1 text-[12px] text-c-text-2 hover:border-c-border-2 disabled:opacity-40"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {expanded === r.checksum && r.proposal && (
                <div className="px-4 pb-4">
                  <div className="rounded-lg border border-c-border bg-c-bg p-4 space-y-3">
                    <div>
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">System prompt (as observed by your client)</div>
                      <pre className="text-[12px] font-mono text-c-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{r.proposal.prompt}</pre>
                    </div>
                    {r.proposal.tools.length > 0 && (
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">Tools ({r.proposal.tools.length})</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.proposal.tools.map((t, i) => (
                            <span key={i} className="rounded-md bg-c-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-c-text-2">
                              {String((t as { name?: string }).name ?? `tool_${i}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[12px] text-c-text-3 max-w-2xl">
        Prompts and tools are staged in auth51-discovery by your client; the Authority holds
        only the checksum reference from a mint attempt. They join here by checksum, and
        content enters the Authority only when you register — never on the minting path.
      </p>
    </div>
  )
}

function SignalBadges({ row }: { row: Row }) {
  const pill = (text: string, cls: string, title: string) => (
    <span title={title} className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>{text}</span>
  )
  return (
    <div className="flex items-center gap-1.5">
      {row.proposal
        ? pill('seen', 'text-c-accent-2 border-c-accent/30 bg-c-accent/10', 'Identity proposed at the LLM egress (auth51-discovery)')
        : pill('no proposal', 'text-c-warning border-c-warning/30 bg-c-warning/10', 'A mint was attempted but no identity was proposed — older client, or the discovery push failed')}
      {row.trigger
        ? pill(`mint ${row.trigger.seen_count}×`, 'text-c-text-2 border-c-border bg-c-surface-2', `Attempted to mint (denied) ${row.trigger.seen_count}×`)
        : pill('no mint yet', 'text-c-text-3 border-c-border bg-c-surface-2', 'Seen at the model call but has not attempted a governed mint yet')}
    </div>
  )
}
