'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
import { ElicitForm, type ElicitField } from '@/components/console/ElicitForm'
import { TraceWaterfall, type Span } from '@/components/console/TraceWaterfall'
import { DelegationTree } from '@/components/console/DelegationTree'
import {
  AuthorityError,
  listAgents,
  previewChecksums,
  shortChecksum,
  unregisterAgent,
  type ChecksumPreview,
  type Proposal,
  type Registration,
} from '@/lib/console/api'
import type { AgentSpec, Profile } from '@/lib/console/workforceTypes'

/**
 * Dedicated workforce page (2.F) — operate one saved pack: run its use cases with
 * one click, see the delegation + live trace, and manage the roster's registration.
 * Studio stays for create/import/save; this is where a saved pack is operated.
 */

type RunResult = { tool_outputs?: Record<string, unknown>; agent?: string; error?: string; reason?: string; fields?: ElicitField[]; use_case?: string }
type RunSummary = { run_id: string; status: string; use_case?: string; agent?: string }
type Tab = 'usecases' | 'agents' | 'runs'

export default function WorkforcePage() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(String(params.id))
  const { currentContext } = useControlPlane()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [registered, setRegistered] = useState<Registration[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('usecases')

  // Run state (one active run at a time on this page).
  const [runId, setRunId] = useState<string | null>(null)
  const [runStatus, setRunStatus] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runningUseCase, setRunningUseCase] = useState<string | null>(null)
  const [traceSpans, setTraceSpans] = useState<Span[]>([])
  const [resumeText, setResumeText] = useState('')
  const [runBusy, setRunBusy] = useState(false)
  const [history, setHistory] = useState<RunSummary[] | null>(null)

  // Agents that actually participated in the current run (from the trace), for
  // highlighting the delegation tree of the use case being run.
  const activeAgents = useMemo(() => {
    if (!profile || traceSpans.length === 0) return undefined
    const ids = new Set(profile.agents.map((a) => a.id))
    const found = new Set<string>()
    for (const s of traceSpans) {
      if (s.name && ids.has(s.name)) found.add(s.name)
      for (const v of Object.values(s.attributes ?? {})) {
        if (typeof v === 'string' && ids.has(v)) found.add(v)
      }
    }
    return found.size ? found : undefined
  }, [traceSpans, profile])

  // Registration action busy-state, keyed by agent id ('*' = bulk).
  const [regBusy, setRegBusy] = useState<string | null>(null)

  const registeredIds = useMemo(
    () => new Set((registered ?? []).map((r) => r.agent_id)),
    [registered],
  )
  const registeredById = useMemo(
    () => new Map((registered ?? []).map((r) => [r.agent_id, r])),
    [registered],
  )
  const unregisteredAgents = useMemo(
    () => (profile?.agents ?? []).filter((a) => !registeredIds.has(a.id)),
    [profile, registeredIds],
  )

  const loadRegistered = useCallback(async () => {
    if (!currentContext) return
    try {
      setRegistered(await listAgents(currentContext))
    } catch {
      setRegistered([]) // Authority unreachable ⇒ treat as none registered
    }
  }, [currentContext])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/cp/runs?profile=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setHistory(Array.isArray(data.runs) ? data.runs : [])
    } catch { setHistory([]) }
  }, [id])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/cp/profiles/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Could not load "${id}"`); return }
      setProfile(data as Profile)
    } catch (e) {
      setError(String(e))
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadRegistered() }, [loadRegistered])
  useEffect(() => { if (tab === 'runs' && profile) loadHistory() }, [tab, profile, loadHistory])

  // ── Run controller ──
  const fetchTrace = useCallback(async (rid: string) => {
    try {
      const tr = await fetch(`/api/cp/run/${rid}/trace`, { cache: 'no-store' })
      const td = await tr.json().catch(() => ({}))
      if (Array.isArray(td.spans)) setTraceSpans(td.spans)
    } catch { /* best-effort */ }
  }, [])

  const pollRun = useCallback(async (rid: string) => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let i = 0; i < 150; i++) {
      await sleep(2000)
      const pr = await fetch(`/api/cp/run/${rid}`, { cache: 'no-store' })
      const pd = await pr.json().catch(() => ({}))
      await fetchTrace(rid)
      if (pd.status && pd.status !== 'running') {
        setRunStatus(pd.status)
        setRunResult(pd.result ?? (pd.error ? { error: pd.error } : null))
        return
      }
    }
    setRunStatus('timed out')
  }, [fetchTrace])

  // Re-attach a paused run for this pack on load (durable, backend-owned).
  useEffect(() => {
    if (!profile) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/cp/run/latest?profile=${encodeURIComponent(id)}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({})) as { run_id?: string; status?: string; result?: RunResult }
        if (cancelled || !data.run_id) return
        setRunId(data.run_id)
        setRunStatus(data.status || 'paused')
        setRunResult(data.result ?? null)
        setRunningUseCase(data.result?.use_case ?? null)
        fetchTrace(data.run_id)
        // A still-RUNNING run keeps advancing on the backend — follow it so the
        // panel updates live, and keep new runs blocked until it settles/pauses.
        if (data.status === 'running') {
          setRunBusy(true)
          pollRun(data.run_id).finally(() => setRunBusy(false))
        }
      } catch { /* best-effort */ }
    })()
    return () => { cancelled = true }
  }, [profile, id, fetchTrace, pollRun])

  async function runUseCase(useCaseTitle: string) {
    setRunBusy(true); setRunStatus('starting'); setRunResult(null)
    setResumeText(''); setRunId(null); setError(null); setTraceSpans([])
    setRunningUseCase(useCaseTitle); setTab('usecases')
    try {
      const res = await fetch('/api/cp/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile: id, use_case: useCaseTitle }),
      })
      const started = await res.json()
      if (!res.ok || !started.run_id) { setError(started.error || `Run failed (HTTP ${res.status})`); setRunStatus(null); return }
      setRunId(started.run_id); setRunStatus('running')
      await pollRun(started.run_id)
    } catch (e) {
      setError(String(e)); setRunStatus(null)
    } finally { setRunBusy(false) }
  }

  async function submitResume(payload: { answers?: Record<string, unknown>; input?: string }) {
    if (!runId) return
    setRunBusy(true); setRunStatus('running'); setError(null)
    try {
      const res = await fetch(`/api/cp/run/${runId}/resume`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || `Resume failed (HTTP ${res.status})`); setRunStatus('paused'); return }
      await pollRun(runId)
    } catch (e) {
      setError(String(e)); setRunStatus('paused')
    } finally { setRunBusy(false) }
  }

  // Open a past run from history into the run panel (loads its status + trace).
  async function openRun(rid: string) {
    setTab('usecases'); setRunId(rid); setError(null); setTraceSpans([])
    try {
      const res = await fetch(`/api/cp/run/${rid}`, { cache: 'no-store' })
      const d = await res.json().catch(() => ({}))
      setRunStatus(d.status ?? null)
      setRunResult(d.result ?? (d.error ? { error: d.error } : null))
      setRunningUseCase(d.result?.use_case ?? null)
      await fetchTrace(rid)
      if (d.status === 'running') { setRunBusy(true); pollRun(rid).finally(() => setRunBusy(false)) }
    } catch (e) { setError(String(e)) }
  }

  // ── Registration actions ──
  async function registerAgents(ids: string[]) {
    if (ids.length === 0) return
    setRegBusy(ids.length === 1 ? ids[0] : '*'); setError(null); setNotice(null)
    try {
      const res = await fetch(`/api/cp/profiles/${encodeURIComponent(id)}/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent_ids: ids }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || `Register failed (HTTP ${res.status})`); return }
      const failed = (data.agents ?? []).filter((a: { ok: boolean }) => !a.ok)
      setNotice(`Registered ${data.ok_count ?? 0}/${data.agents?.length ?? ids.length} agent${ids.length === 1 ? '' : 's'}.${failed.length ? ` Failed: ${failed.map((a: { agent_id: string }) => a.agent_id).join(', ')}.` : ''}`)
      await loadRegistered()
    } catch (e) {
      setError(String(e))
    } finally { setRegBusy(null) }
  }

  async function unregister(agentId: string) {
    if (!currentContext) return
    if (!window.confirm(`Unregister "${agentId}"? Removes its registration + capability grant.`)) return
    setRegBusy(agentId); setError(null); setNotice(null)
    try {
      await unregisterAgent(currentContext, agentId, profile?.app_id ?? undefined)
      setNotice(`Unregistered "${agentId}".`)
      await loadRegistered()
    } catch (e) {
      setError(e instanceof AuthorityError ? `Unregister failed: ${e.message}` : `Unregister failed: ${String(e)}`)
    } finally { setRegBusy(null) }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-[13px] text-c-text-3">Loading…</div>
  if (error && !profile) return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <button onClick={() => router.push('/console/studio')} className="text-[12px] text-c-accent-2 hover:underline">← Studio</button>
      <div className="mt-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>
    </div>
  )
  if (!profile) return null

  const roster = profile.agents
  const regCount = roster.filter((a) => registeredIds.has(a.id)).length
  const allRegistered = registered !== null && unregisteredAgents.length === 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <button onClick={() => router.push('/console/studio')} className="text-[12px] text-c-accent-2 hover:underline">← Studio</button>
      <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-c-text tracking-tight truncate">{profile.name}</h1>
          {profile.description && <p className="mt-0.5 text-[13px] text-c-text-2 max-w-2xl">{profile.description}</p>}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-c-text-3">
            {profile.app_id && <span className="font-mono">app: {profile.app_id}</span>}
            {profile.rs_id && <span className="font-mono">· RS: {profile.rs_id}</span>}
            <span>· {roster.length} agents</span>
            <span>· {profile.programs.length} use cases</span>
            <span className={`font-mono ${allRegistered ? 'text-c-success' : 'text-c-warning'}`}>
              · {regCount}/{roster.length} registered
            </span>
          </div>
        </div>
        {!allRegistered && registered !== null && (
          <button onClick={() => registerAgents(unregisteredAgents.map((a) => a.id))} disabled={regBusy !== null}
            className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40 shrink-0">
            {regBusy === '*' ? 'Registering…' : `Register ${unregisteredAgents.length} unregistered`}
          </button>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>}
      {notice && <div className="mt-4 rounded-lg border border-c-success/30 bg-c-success/5 px-4 py-3 text-[13px] text-c-success">{notice}</div>}

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-1 border-b border-c-border">
        {(['usecases', 'agents', 'runs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-[13px] -mb-px border-b-2 ${tab === t ? 'border-c-accent text-c-text font-medium' : 'border-transparent text-c-text-3 hover:text-c-text-2'}`}>
            {t === 'usecases' ? `Use cases (${profile.programs.length})` : t === 'agents' ? `Agents (${roster.length})` : 'Runs'}
          </button>
        ))}
      </div>

      {tab === 'usecases' && (
        <div className="mt-4 space-y-3">
          {/* Active run panel */}
          {(runStatus || runId) && (
            <RunPanel
              status={runStatus} result={runResult} traceSpans={traceSpans} useCase={runningUseCase}
              busy={runBusy} resumeText={resumeText} setResumeText={setResumeText} onResume={submitResume}
            />
          )}
          {profile.programs.length === 0 && (
            <div className="rounded-xl border border-c-border px-4 py-8 text-center text-[13px] text-c-text-3">This pack has no use cases.</div>
          )}
          {profile.programs.map((p) => {
            const entry = p.entry_agent || undefined
            const entryRegistered = !entry || registeredIds.has(entry)
            const isRunning = runBusy && runningUseCase === p.title
            return (
              <div key={p.id} className="rounded-xl border border-c-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] text-c-text">{p.title}</span>
                      <span className="rounded-md bg-c-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-c-text-2">{p.kind}</span>
                    </div>
                    {p.goal && <p className="mt-1 text-[12px] text-c-text-3">{p.goal}</p>}
                  </div>
                  <button
                    onClick={() => runUseCase(p.title)}
                    disabled={runBusy || !entryRegistered}
                    title={entryRegistered ? 'Run this use case (governed)' : `Register "${entry}" first — an unregistered entry agent can’t mint`}
                    className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    {isRunning ? (runStatus ?? 'Running…') : 'Run'}
                  </button>
                </div>
                {!entryRegistered && (
                  <div className="mt-2 text-[11px] text-c-warning">Entry agent <span className="font-mono">{entry}</span> is not registered — register it to run.</div>
                )}
                <DelegationTree entryId={p.entry_agent} members={p.members} agents={roster}
                  active={runningUseCase === p.title ? activeAgents : undefined} />
              </div>
            )
          })}
        </div>
      )}

      {tab === 'runs' && (
        <div className="mt-4">
          {history === null ? (
            <div className="rounded-xl border border-c-border px-4 py-8 text-center text-[13px] text-c-text-3">Loading…</div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-c-border px-4 py-8 text-center text-[13px] text-c-text-3">No runs yet. Run a use case to see it here.</div>
          ) : (
            <div className="rounded-xl border border-c-border divide-y divide-c-border">
              {history.map((r) => (
                <button key={r.run_id} onClick={() => openRun(r.run_id)}
                  className="w-full text-left px-4 py-3 hover:bg-c-surface-2 flex items-center gap-3">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                    r.status === 'done' ? 'border-c-success/30 bg-c-success/10 text-c-success'
                    : r.status === 'error' ? 'border-c-danger/30 bg-c-danger/10 text-c-danger'
                    : r.status === 'paused' ? 'border-c-accent/30 bg-c-accent/10 text-c-accent-2'
                    : r.status === 'running' ? 'border-c-accent/30 bg-c-accent/10 text-c-accent-2'
                    : 'border-c-border bg-c-surface-2 text-c-text-3'}`}>{r.status}</span>
                  <span className="text-[13px] text-c-text truncate flex-1">{r.use_case || '(ad-hoc)'}</span>
                  {r.agent && <span className="text-[11px] font-mono text-c-text-3 shrink-0">{r.agent}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'agents' && (
        <div className="mt-4">
          {allRegistered && (
            <div className="mb-3 rounded-lg border border-c-success/30 bg-c-success/5 px-4 py-2.5 text-[12px] text-c-success">✓ All {roster.length} agents are registered.</div>
          )}
          <div className="rounded-xl border border-c-border divide-y divide-c-border">
            {roster.map((a) => (
              <AgentRow
                key={a.id} agent={a} ctx={currentContext} appId={profile.app_id}
                registration={registeredById.get(a.id) ?? null}
                busy={regBusy === a.id}
                onRegister={() => registerAgents([a.id])}
                onUnregister={() => unregister(a.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Run panel ──
function RunPanel({ status, result, traceSpans, useCase, busy, resumeText, setResumeText, onResume }: {
  status: string | null
  result: RunResult | null
  traceSpans: Span[]
  useCase: string | null
  busy: boolean
  resumeText: string
  setResumeText: (v: string) => void
  onResume: (payload: { answers?: Record<string, unknown>; input?: string }) => void
}) {
  return (
    <div className="rounded-xl border border-c-accent/30 bg-c-accent/5 p-4">
      <div className="text-[12px] font-semibold text-c-text">
        Run{useCase ? `: ${useCase}` : ''} <span className="font-normal text-c-text-3">— governed, per-op minted</span>
      </div>
      {status === 'paused' && !busy && (
        <div className="mt-3 rounded-md border border-c-accent/40 bg-c-bg px-3 py-2.5">
          <div className="text-[12px] font-semibold text-c-text">Agent needs input{result?.agent ? ` · ${result.agent}` : ''}</div>
          {result?.reason && <div className="mt-1 text-[12px] text-c-text-2 whitespace-pre-wrap break-words">{result.reason}</div>}
          {result?.fields && result.fields.length > 0 ? (
            <ElicitForm key={JSON.stringify(result.fields)} fields={result.fields} busy={busy} onSubmit={(answers) => onResume({ answers })} />
          ) : (
            <div className="mt-2 flex gap-2">
              <input value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && resumeText.trim()) onResume({ input: resumeText.trim() }) }}
                autoFocus placeholder="Type your answer…"
                className="flex-1 rounded-md border border-c-border bg-c-bg px-3 py-2 text-[13px] text-c-text outline-none focus:border-c-accent" />
              <button onClick={() => onResume({ input: resumeText.trim() })} disabled={!resumeText.trim()}
                className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">Send</button>
            </div>
          )}
        </div>
      )}
      {status && status !== 'paused' && !busy && (
        <div className="mt-3">
          <div className={`text-[12px] font-medium ${status === 'done' ? 'text-c-success' : status === 'error' ? 'text-c-danger' : 'text-c-text-2'}`}>
            Run {status}{result?.agent ? ` · agent ${result.agent}` : ''}
          </div>
          {result?.error && <div className="mt-1 text-[12px] text-c-danger break-words">{result.error}</div>}
          {result?.tool_outputs && (
            <pre className="mt-2 rounded-md bg-c-bg border border-c-border px-3 py-2 text-[11px] font-mono text-c-text-2 overflow-x-auto max-h-72">{JSON.stringify(result.tool_outputs, null, 2)}</pre>
          )}
        </div>
      )}
      {traceSpans.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] font-semibold text-c-text-2">Trace <span className="font-normal text-c-text-3">— governed hops (mint · DPoP · RS) and LLM calls</span></div>
          <TraceWaterfall spans={traceSpans} />
        </div>
      )}
    </div>
  )
}

// ── One agent row (roster) ──
function AgentRow({ agent, ctx, appId, registration, busy, onRegister, onUnregister }: {
  agent: AgentSpec
  ctx: ReturnType<typeof useControlPlane>['currentContext']
  appId?: string | null
  registration: Registration | null
  busy: boolean
  onRegister: () => void
  onUnregister: () => void
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ChecksumPreview | 'loading' | 'error' | null>(null)
  const isRegistered = registration !== null

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && ctx && preview === null) {
      setPreview('loading')
      const proposal = {
        agent_id: agent.id, app_id: appId ?? null, prompt: agent.system_prompt,
        tools: agent.tools.map((t) => ({ name: t.op?.operation_id || t.ref, description: t.op?.summary || '', parameters: t.op?.interface || {} })),
        configuration: {},
      } as unknown as Proposal
      previewChecksums(ctx, proposal, appId ?? undefined)
        .then((p) => setPreview(p)).catch(() => setPreview('error'))
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[13px] font-mono text-c-text">{agent.id}</span>
        {agent.role && <span className="text-[11px] text-c-text-3">{agent.role}</span>}
        {isRegistered
          ? <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-success/30 bg-c-success/10 text-c-success">registered{registration?.version ? ` ${registration.version}` : ''}</span>
          : <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-warning/30 bg-c-warning/10 text-c-warning">unregistered</span>}
        <span className="text-[10.5px] text-c-text-3">· {agent.tools.length} tool{agent.tools.length === 1 ? '' : 's'}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggle} className="text-[11px] text-c-accent-2 hover:underline">{open ? 'hide' : 'review'}</button>
          {isRegistered
            ? <button onClick={onUnregister} disabled={busy} className="rounded-md border border-c-danger/40 px-2 py-0.5 text-[11px] text-c-danger hover:bg-c-danger/10 disabled:opacity-40">{busy ? '…' : 'Unregister'}</button>
            : <button onClick={onRegister} disabled={busy} className="rounded-md bg-c-accent px-2 py-0.5 text-[11px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">{busy ? '…' : 'Register'}</button>}
        </div>
      </div>
      {open && (
        <div className="mt-2 ml-1 space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-c-text-3 mb-1">System prompt (identity)</div>
            <pre className="text-[11.5px] font-mono text-c-text-2 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto rounded border border-c-border bg-c-bg p-2">{agent.system_prompt}</pre>
          </div>
          {agent.tools.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-c-text-3 mb-1">Tools / capabilities ({agent.tools.length})</div>
              <div className="space-y-1">
                {agent.tools.map((t) => (
                  <div key={t.ref} className="text-[11px]">
                    <span className="font-mono text-c-accent-2" title={t.op?.scope || t.ref}>{t.op ? `${t.op.method.toUpperCase()} ${t.op.path}` : t.ref}</span>
                    {t.op?.interface?.properties && Object.keys(t.op.interface.properties).length > 0 && (
                      <span className="ml-2 text-c-text-3 font-mono">({Object.keys(t.op.interface.properties).join(', ')})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <ChecksumBlock state={preview} />
        </div>
      )}
    </div>
  )
}

function ChecksumBlock({ state }: { state: ChecksumPreview | 'loading' | 'error' | null }) {
  const label = <div className="text-[10px] font-mono uppercase tracking-wider text-c-text-3 mb-1">Identity checksums (v3 = matched at runtime)</div>
  if (state === null || state === 'loading') return <div>{label}<div className="text-[11.5px] text-c-text-3">Computing…</div></div>
  if (state === 'error') return <div>{label}<div className="text-[11.5px] text-c-warning">Couldn’t compute checksums.</div></div>
  const rows: [string, string][] = [['v3', state.checksum_v3], ['v4', state.checksum_v4], ['v5', state.checksum_v5]]
  return (
    <div>{label}
      <div className="rounded-md border border-c-border bg-c-bg divide-y divide-c-border">
        {rows.map(([v, sum]) => (
          <div key={v} className="flex items-baseline gap-3 px-2.5 py-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-c-accent-2 w-5 shrink-0">{v}</span>
            <span className="text-[11px] font-mono text-c-text-2 truncate" title={sum}>{shortChecksum(sum, 40)}</span>
          </div>
        ))}
      </div>
      {state.already_registered && <div className="mt-1 text-[11px] text-c-text-3">This identity is already registered.</div>}
    </div>
  )
}
