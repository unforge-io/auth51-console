'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  AuthorityError,
  consumeProposal,
  dismissDiscovered,
  listAgents,
  listDiscovered,
  listProposals,
  previewChecksums,
  registerAgent,
  shortChecksum,
  formatRegisteredAt,
  type ChecksumPreview,
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
  // Lazily-fetched checksum previews, keyed by row checksum. 'loading'/'error'
  // are sentinels so the panel can show progress without a second state map.
  const [previews, setPreviews] = useState<Record<string, ChecksumPreview | 'loading' | 'error'>>({})
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

  // Dismiss for real: retire BOTH signals so it stays gone on reload — the
  // Authority trigger (by agent_id) and the discovery proposal (by checksum). The
  // local `dismissed` set is just immediate UI feedback; persistence is the fix.
  const dismiss = async (r: Row) => {
    if (!currentContext) return
    setBusy(r.checksum); setError(null)
    setDismissed((d) => new Set(d).add(r.checksum))   // optimistic hide
    try {
      const ops: Promise<unknown>[] = []
      if (r.trigger) ops.push(dismissDiscovered(currentContext, r.trigger.agent_id))
      if (r.proposal) ops.push(consumeProposal(currentContext, r.checksum))
      await Promise.all(ops)
      await load(true)                                // refetch; persisted ⇒ won't return
    } catch (err) {
      // Persistence failed — un-hide + surface so it isn't a silent no-op again.
      setDismissed((d) => { const n = new Set(d); n.delete(r.checksum); return n })
      setError(err instanceof AuthorityError ? `Dismiss failed: ${err.message}` : `Dismiss failed: ${String(err)}`)
    } finally { setBusy(null) }
  }

  // Expand/collapse the review panel. On first expand of a row that has proposal
  // content, fetch the checksum preview (v1–v5) so the operator sees the exact
  // identity that Register would seal — computed by the Authority, not persisted.
  const toggleReview = useCallback((r: Row) => {
    const next = expanded === r.checksum ? null : r.checksum
    setExpanded(next)
    if (next && r.proposal && currentContext && previews[r.checksum] === undefined) {
      setPreviews((p) => ({ ...p, [r.checksum]: 'loading' }))
      previewChecksums(currentContext, r.proposal)
        .then((preview) => setPreviews((p) => ({ ...p, [r.checksum]: preview })))
        .catch(() => setPreviews((p) => ({ ...p, [r.checksum]: 'error' })))
    }
  }, [expanded, currentContext, previews])

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
                      <>{' · '}<button onClick={() => toggleReview(r)}
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
                    onClick={() => dismiss(r)}
                    disabled={busy === r.checksum}
                    className="rounded-md border border-c-border px-2.5 py-1 text-[12px] text-c-text-2 hover:border-c-border-2 disabled:opacity-40"
                  >
                    {busy === r.checksum ? '…' : 'Dismiss'}
                  </button>
                </div>
              </div>

              {expanded === r.checksum && r.proposal && (
                <div className="px-4 pb-4">
                  <div className="rounded-lg border border-c-border bg-c-bg p-4 space-y-4">
                    <div>
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">System prompt (as observed by your client)</div>
                      <pre className="text-[12px] font-mono text-c-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{r.proposal.prompt}</pre>
                    </div>
                    {r.proposal.tools.length > 0 && (
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-2">Tools ({r.proposal.tools.length})</div>
                        <div className="space-y-2">
                          {r.proposal.tools.map((t, i) => (
                            <ToolDetail key={i} tool={t} index={i} />
                          ))}
                        </div>
                      </div>
                    )}
                    {Object.keys(r.proposal.configuration ?? {}).length > 0 && (
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">Configuration</div>
                        <pre className="text-[11.5px] font-mono text-c-text-2 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto rounded-md border border-c-border bg-c-surface-2 p-2">{JSON.stringify(r.proposal.configuration, null, 2)}</pre>
                      </div>
                    )}
                    <ChecksumPanel state={previews[r.checksum]} />
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

// One observed tool, expanded: name + trust marker + description + the wire
// parameter schema the embed captured (this is exactly what folds into the v4
// tool-interface hash). Anthropic egress carries `input_schema`, OpenAI carries
// `parameters` — accept either so the panel is model-agnostic.
function ToolDetail({ tool, index }: { tool: Record<string, unknown>; index: number }) {
  const name = String(tool.name ?? `tool_${index}`)
  const description = typeof tool.description === 'string' ? tool.description : ''
  const isAgent = tool.is_agent === true
  const source = typeof tool.source === 'string' ? tool.source : 'process'
  const schema = (tool.parameters ?? tool.input_schema) as
    | { properties?: Record<string, { type?: string; description?: string }>; required?: string[] }
    | undefined
  const props = schema?.properties ?? {}
  const required = new Set(schema?.required ?? [])
  const paramNames = Object.keys(props)

  return (
    <div className="rounded-md border border-c-border bg-c-surface-2/50 p-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] font-mono font-medium text-c-text">{name}</span>
        {isAgent
          ? <span title="A sub-agent edge — part of the delegation graph, excluded from the identity hash"
                  className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-accent/30 bg-c-accent/10 text-c-accent-2">agent</span>
          : <span title={source === 'mcp' ? 'Rented/remote capability — granted, excluded from the identity hash (§13.1)' : 'In-process tool — part of IDENTITY, folded into v4 (§13.1)'}
                  className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-border bg-c-surface-2 text-c-text-3">{source}</span>}
      </div>
      {description && <p className="mt-1 text-[12px] text-c-text-2 leading-snug">{description}</p>}
      {paramNames.length > 0 ? (
        <div className="mt-2 space-y-1">
          {paramNames.map((pn) => {
            const p = props[pn] ?? {}
            return (
              <div key={pn} className="flex items-baseline gap-2 text-[11.5px] font-mono">
                <span className="text-c-text">{pn}</span>
                {p.type && <span className="text-c-text-3">{p.type}</span>}
                {required.has(pn) && <span className="text-c-danger text-[10px]">required</span>}
                {p.description && <span className="text-c-text-3 font-sans truncate">— {p.description}</span>}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] text-c-text-3 italic">no parameters</p>
      )}
    </div>
  )
}

// The identity Register would seal — v1–v5, computed by the Authority WITHOUT
// persisting (POST /register/agent/preview). Runtime recognition matches v3
// (prompt) today; v4 adds the tool interface, v5 adds normalized source.
function ChecksumPanel({ state }: { state: ChecksumPreview | 'loading' | 'error' | undefined }) {
  const label = (
    <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">
      Checksums that will register
    </div>
  )
  if (state === undefined || state === 'loading') {
    return <div>{label}<div className="text-[12px] text-c-text-3">Computing identity…</div></div>
  }
  if (state === 'error') {
    return <div>{label}<div className="text-[12px] text-c-warning">Couldn&rsquo;t compute checksums — the Authority may be an older build without the preview endpoint.</div></div>
  }
  const rows: [string, string, string][] = [
    ['v1', state.checksum_v1, 'SHA-256, patchet-compat (legacy)'],
    ['v2', state.checksum_v2, 'SHA3-512 full-component (canonical stored)'],
    ['v3', state.checksum_v3, 'identity: prompt + config — matched at runtime'],
    ['v4', state.checksum_v4, 'v3 + tool interface (name/desc/params)'],
    ['v5', state.checksum_v5, 'v4 + AST-normalized source'],
  ]
  return (
    <div>
      {label}
      <div className="rounded-md border border-c-border bg-c-surface-2/50 divide-y divide-c-border">
        {rows.map(([v, sum, note]) => (
          <div key={v} className="flex items-baseline gap-3 px-2.5 py-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-c-accent-2 w-5 shrink-0">{v}</span>
            <span className="text-[11.5px] font-mono text-c-text truncate flex-1" title={sum}>{sum}</span>
            <span className="text-[10.5px] text-c-text-3 hidden sm:block shrink-0">{note}</span>
          </div>
        ))}
      </div>
      {state.already_registered && (
        <div className="mt-2 text-[11.5px] text-c-warning">
          ⚠ An agent with this identity is already registered — Register will return a Registration-First (A2) conflict.
        </div>
      )}
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
