'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  AuthorityError,
  listAgents,
  listProposals,
  registerAgent,
  shortChecksum,
  formatRegisteredAt,
  type Proposal,
} from '@/lib/console/api'
import { EmptyState } from '@/components/console/EmptyState'

/**
 * Discovered — agents your auth51 client saw but that aren't registered yet.
 *
 * Source of truth is the **auth51-discovery** service: the embed pushes a
 * proposal (prompt + tools + computed checksum) at the LLM egress the instant it
 * derives an unregistered agent — no governed call, no config, no mint required.
 * So an agent shows up here on its very first run. We simply hide the ones that
 * are already registered. Approve → the Authority's normal /register/agent, and
 * the agent's next run is recognized. Content lives only in discovery until then
 * (DESIGN §5b).
 */

const POLL_MS = 15_000

export default function DiscoveredAgentsPage() {
  const { currentContext } = useControlPlane()
  const [rows, setRows] = useState<Proposal[]>([])
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
      const [proposals, registered] = await Promise.all([
        listProposals(currentContext),
        listAgents(currentContext).catch(() => []),
      ])
      const registeredIds = new Set(registered.map((a) => a.agent_id))
      setRows(proposals.filter((p) => !registeredIds.has(p.agent_id)))
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

  const approve = async (p: Proposal) => {
    if (!currentContext) return
    setBusy(p.agent_id); setError(null)
    try {
      const ack = await registerAgent(currentContext, p)
      setJustRegistered(ack.agent_id)
      await load()
    } catch (err) {
      setError(err instanceof AuthorityError
        ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
        : err instanceof Error ? err.message : String(err))
    } finally { setBusy(null) }
  }

  const visible = rows.filter((r) => !dismissed.has(`${r.agent_id}:${r.checksum}`))

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
        Agents your auth51 client saw running but that aren&rsquo;t registered yet — captured
        automatically at the model call, with the identity it computed. Review and
        register; the agent&rsquo;s next run is recognized and governed.
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
          <span>Agent</span><span>Checksum</span><span>First seen</span><span className="text-right">Actions</span>
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
            <div key={`${r.agent_id}:${r.checksum}`} className="border-t border-c-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[14px] text-c-text font-medium truncate">{r.agent_id}</div>
                  <button onClick={() => setExpanded(expanded === r.agent_id ? null : r.agent_id)}
                          className="text-[11.5px] text-c-accent-2 hover:underline">
                    {expanded === r.agent_id ? 'Hide identity' : 'Review identity'}
                  </button>
                </div>
                <span className="font-mono text-[12px] text-c-text-2" title={r.checksum}>{shortChecksum(r.checksum, 12)}…</span>
                <span className="text-[12px] text-c-text-3">{formatRegisteredAt(r.first_seen_at)}</span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => approve(r)}
                    disabled={busy === r.agent_id}
                    className="rounded-md bg-c-accent px-2.5 py-1 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40"
                  >
                    {busy === r.agent_id ? '…' : 'Register'}
                  </button>
                  <button
                    onClick={() => setDismissed((d) => new Set(d).add(`${r.agent_id}:${r.checksum}`))}
                    disabled={busy === r.agent_id}
                    className="rounded-md border border-c-border px-2.5 py-1 text-[12px] text-c-text-2 hover:border-c-border-2 disabled:opacity-40"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {expanded === r.agent_id && (
                <div className="px-4 pb-4">
                  <div className="rounded-lg border border-c-border bg-c-bg p-4 space-y-3">
                    <div>
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">System prompt (as observed by your client)</div>
                      <pre className="text-[12px] font-mono text-c-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{r.prompt}</pre>
                    </div>
                    {r.tools.length > 0 && (
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">Tools ({r.tools.length})</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.tools.map((t, i) => (
                            <span key={i} className="rounded-md bg-c-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-c-text-2">
                              {String((t as { name?: string }).name ?? `tool_${i}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-[11.5px] text-c-text-3">
                      Registering approves exactly this identity — prompt + tools hashed to
                      checksum <span className="font-mono">{shortChecksum(r.checksum, 16)}…</span>.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[12px] text-c-text-3 max-w-2xl">
        Prompts and tools shown here are staged in auth51-discovery by your auth51 client.
        They enter the Authority only when you register — never on the token-minting path.
      </p>
    </div>
  )
}
