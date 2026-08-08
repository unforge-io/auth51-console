'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
import { ElicitForm, type ElicitField } from '@/components/console/ElicitForm'
import { TraceWaterfall, type Span } from '@/components/console/TraceWaterfall'
import { DelegationTree } from '@/components/console/DelegationTree'
import {
  AuthorityError,
  assignGrant,
  listAgents,
  listGrants,
  previewChecksums,
  shortChecksum,
  unregisterAgent,
  type ChecksumPreview,
  type GrantView,
  type Proposal,
  type Registration,
} from '@/lib/console/api'
import type { AgentSpec, Profile, UseCase } from '@/lib/console/workforceTypes'

/**
 * Dedicated workforce page (2.F) — operate one saved pack: run its use cases with
 * one click, see the delegation + live trace, and manage the roster's registration.
 * Studio stays for create/import/save; this is where a saved pack is operated.
 */

type RunResult = { tool_outputs?: Record<string, unknown>; agent?: string; error?: string; reason?: string; fields?: ElicitField[]; use_case?: string }
type RunSummary = { run_id: string; status: string; use_case?: string; agent?: string; mode?: string }
type Tab = 'usecases' | 'agents' | 'runs'
type AttackKind = 'prompt_injection' | 'excessive_agency' | 'custom'

/**
 * The attack catalog labels + explains each simulation. The injected CONTENT is not
 * here — it's the agent's own components, edited live per use case and sent verbatim
 * as a RUN-ONLY override (never registered). `promptEditable` / `inputEditable` say
 * which vectors the operator edits for a given kind; `ready` flags whether Intent
 * blocks it today.
 */
const KINDS: Record<AttackKind, {
  label: string; blurb: string; intent: string; oauth: string
  promptEditable: boolean; inputEditable: boolean; ready: boolean; note?: string
}> = {
  prompt_injection: {
    label: 'Prompt injection',
    blurb:
      "Edit an agent's system prompt — a supply-chain / prompt-swap compromise. The embed " +
      "re-derives the identity checksum from the live prompt; it no longer matches the " +
      "registered one.",
    intent: 'DENIED at mint — checksum mismatch. Unconditional, any grant mode.',
    oauth: 'Proceeds — OAuth has no notion of agent composition to check.',
    promptEditable: true, inputEditable: false, ready: true,
  },
  excessive_agency: {
    label: 'Excessive agency',
    blurb:
      "Plant an injection in the agent's input to steer it toward a high-consequence action " +
      "outside its job. Identity is unchanged — the over-reach rides in DATA, not the prompt.",
    intent: 'DENIED at mint — out-of-grant / out-of-workflow.',
    oauth: 'Proceeds — OAuth mints a per-op token regardless of workflow.',
    promptEditable: false, inputEditable: true, ready: false,
    note: 'Blocks in Intent once this agent’s grant is in enforce mode (6.3, in progress). Runs now, but completes in both modes until then.',
  },
  custom: {
    label: 'Custom',
    blurb:
      'Edit the system prompt and/or plant an input injection freely, with LLM help. Any ' +
      'system-prompt edit diverges the checksum (Intent denies at mint); input-only steering ' +
      'rides in data.',
    intent: 'System-prompt edits: DENIED at mint (checksum). Input-only: as excessive agency.',
    oauth: 'Proceeds.',
    promptEditable: true, inputEditable: true, ready: true,
  },
}

export default function WorkforcePage() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(String(params.id))
  const { currentContext } = useControlPlane()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [registered, setRegistered] = useState<Registration[] | null>(null)
  const [grants, setGrants] = useState<GrantView[] | null>(null)
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
  const [runMode, setRunMode] = useState<'intent' | 'oauth'>('intent')
  const [runningMode, setRunningMode] = useState<string | null>(null)  // the ACTIVE run's mode
  const [attackKind, setAttackKind] = useState<'none' | AttackKind>('none')
  // Run-only overrides the operator authors against the agents' REAL components. These
  // are sent verbatim and applied only to the run — never registered. `overrides` maps
  // agent_id → an edited system prompt; `inputInjections` maps use-case id → injected
  // input text. Absent/unchanged ⇒ not sent ⇒ that agent runs clean.
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [inputInjections, setInputInjections] = useState<Record<string, string>>({})
  // "Ask the LLM" per-field instruction + busy, keyed `sp:<agentId>` / `in:<useCaseId>`.
  const [suggestInstr, setSuggestInstr] = useState<Record<string, string>>({})
  const [suggestBusy, setSuggestBusy] = useState<Record<string, boolean>>({})
  const [runningAttack, setRunningAttack] = useState<string | null>(null)  // the ACTIVE run's attack
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
  const grantByAgent = useMemo(
    () => new Map((grants ?? []).map((g) => [g.agent_id, g])),
    [grants],
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

  const loadGrants = useCallback(async () => {
    if (!currentContext) return
    try {
      setGrants(await listGrants(currentContext, profile?.app_id ?? undefined))
    } catch {
      setGrants([])
    }
  }, [currentContext, profile])

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
  useEffect(() => { if (profile) loadGrants() }, [profile, loadGrants])
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
        const data = await res.json().catch(() => ({})) as { run_id?: string; status?: string; result?: RunResult; mode?: string }
        if (cancelled || !data.run_id) return
        setRunId(data.run_id)
        setRunStatus(data.status || 'paused')
        setRunResult(data.result ?? null)
        setRunningUseCase(data.result?.use_case ?? null)
        setRunningMode(data.mode ?? null)
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

  // ── Attack override helpers (run-only; the registered agent is never touched) ──
  const agentById = useMemo(
    () => new Map((profile?.agents ?? []).map((a) => [a.id, a])),
    [profile])
  const registeredPrompt = useCallback(
    (agentId: string) => agentById.get(agentId)?.system_prompt ?? '', [agentById])
  const currentPrompt = useCallback(
    (agentId: string) => overrides[agentId] ?? registeredPrompt(agentId),
    [overrides, registeredPrompt])
  const isPromptModified = useCallback(
    (agentId: string) => overrides[agentId] != null && overrides[agentId] !== registeredPrompt(agentId),
    [overrides, registeredPrompt])
  const membersOf = useCallback((p: UseCase): string[] => {
    const ids = [p.entry_agent || '', ...(p.members ?? [])].filter(Boolean) as string[]
    return Array.from(new Set(ids)).filter((x) => agentById.has(x))
  }, [agentById])

  /** Assemble the run-only attack plan for a use case from the operator's edits, or
   *  null when nothing is armed/edited (⇒ a clean run). */
  function buildAttack(p: UseCase): Record<string, unknown> | null {
    if (attackKind === 'none') return null
    const meta = KINDS[attackKind]
    const ov: Record<string, { system_prompt: string }> = {}
    if (meta.promptEditable) {
      for (const aid of membersOf(p)) {
        if (isPromptModified(aid)) ov[aid] = { system_prompt: overrides[aid] }
      }
    }
    const inj = meta.inputEditable ? (inputInjections[p.id] || '').trim() : ''
    if (Object.keys(ov).length === 0 && !inj) return null
    return { kind: attackKind, overrides: ov, input_injection: inj }
  }

  /** "Ask the LLM": draft a tampered component and drop it into the editable field. */
  async function askLLM(key: string, body: Record<string, unknown>, apply: (s: string) => void) {
    setSuggestBusy((b) => ({ ...b, [key]: true })); setError(null)
    try {
      const res = await fetch('/api/cp/suggest', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({} as { suggestion?: string; error?: string }))
      if (res.ok && typeof data.suggestion === 'string' && data.suggestion.trim()) apply(data.suggestion)
      else setError(data.error || `Suggestion failed (HTTP ${res.status})`)
    } catch (e) { setError(String(e)) }
    finally { setSuggestBusy((b) => ({ ...b, [key]: false })) }
  }

  async function runUseCase(p: UseCase) {
    const attack = buildAttack(p)
    setRunBusy(true); setRunStatus('starting'); setRunResult(null)
    setResumeText(''); setRunId(null); setError(null); setTraceSpans([])
    setRunningUseCase(p.title); setRunningMode(runMode)
    setRunningAttack(attack ? attackKind : null); setTab('usecases')
    try {
      const res = await fetch('/api/cp/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profile: id, use_case: p.title, mode: runMode,
          // The operator-authored, run-only override (or nothing ⇒ a clean run).
          ...(attack ? { attack } : {}),
        }),
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
    // Re-send the currently-armed attack so agents that run AFTER this pause are
    // tampered too (this use case pauses for input, and the tampered agent often
    // runs post-resume). Rebuilt from the running use case's current edits.
    const runningProgram = profile?.programs.find((pr) => pr.title === runningUseCase)
    const attack = runningProgram ? buildAttack(runningProgram) : null
    setRunningAttack(attack ? attackKind : runningAttack)
    try {
      const res = await fetch(`/api/cp/run/${runId}/resume`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, ...(attack ? { attack } : {}) }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || `Resume failed (HTTP ${res.status})`); setRunStatus('paused'); return }
      await pollRun(runId)
    } catch (e) {
      setError(String(e)); setRunStatus('paused')
    } finally { setRunBusy(false) }
  }

  // Open a past run from history into the run panel (loads its status + trace).
  async function openRun(rid: string, mode?: string) {
    setTab('usecases'); setRunId(rid); setError(null); setTraceSpans([]); setRunningMode(mode ?? null)
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
      await Promise.all([loadRegistered(), loadGrants()])
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
      await Promise.all([loadRegistered(), loadGrants()])
    } catch (e) {
      setError(e instanceof AuthorityError ? `Unregister failed: ${e.message}` : `Unregister failed: ${String(e)}`)
    } finally { setRegBusy(null) }
  }

  // Clean-slate reset: unregister every registered agent of THIS roster (each
  // registration + its capability grant). The saved pack is untouched — re-register
  // anytime. Symmetric with the bulk "Register N unregistered" action.
  async function unregisterAll() {
    if (!currentContext) return
    const ids = (profile?.agents ?? []).map((a) => a.id).filter((aid) => registeredIds.has(aid))
    if (ids.length === 0) return
    if (!window.confirm(`Unregister all ${ids.length} registered agent${ids.length === 1 ? '' : 's'} in this roster? Removes each registration + capability grant. The saved pack is NOT deleted — you can re-register anytime.`)) return
    setRegBusy('*'); setError(null); setNotice(null)
    const failed: string[] = []
    for (const aid of ids) {
      try {
        await unregisterAgent(currentContext, aid, profile?.app_id ?? undefined)
      } catch { failed.push(aid) }
    }
    setNotice(`Unregistered ${ids.length - failed.length}/${ids.length} agent${ids.length === 1 ? '' : 's'}.${failed.length ? ` Failed: ${failed.join(', ')}.` : ''}`)
    await Promise.all([loadRegistered(), loadGrants()])
    setRegBusy(null)
  }

  // B3 — grant the agent exactly the capabilities its tools declare (the op
  // scopes). Fixes an empty/partial grant (e.g. a discovery-registered agent) so
  // its governed RS calls actually carry the a51:rs scope the verifier requires.
  async function grantDeclared(agent: AgentSpec) {
    if (!currentContext) return
    const scopes = declaredScopes(agent)
    if (scopes.length === 0) return
    setRegBusy(agent.id); setError(null); setNotice(null)
    try {
      await assignGrant(currentContext, agent.id, scopes, { appId: profile?.app_id ?? undefined, replace: true })
      setNotice(`Granted ${scopes.length} capabilit${scopes.length === 1 ? 'y' : 'ies'} to "${agent.id}".`)
      await loadGrants()
    } catch (e) {
      setError(e instanceof AuthorityError ? `Grant failed: ${e.message}` : `Grant failed: ${String(e)}`)
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

  // The active run's panel renders INLINE under the use case it belongs to (not
  // floating at the top). Match by title or goal (the workforce may store either).
  const activeRunUC = profile.programs.find(
    (p) => !!runningUseCase && (p.title === runningUseCase || p.goal === runningUseCase),
  ) || null
  const runPanelEl = (runStatus || runId) ? (
    <RunPanel
      status={runStatus} result={runResult} traceSpans={traceSpans} useCase={runningUseCase}
      mode={runningMode} attack={runningAttack} busy={runBusy} resumeText={resumeText}
      setResumeText={setResumeText} onResume={submitResume}
    />
  ) : null

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
          {/* Mode selector — the OAuth-vs-Intent contrast (same use case, two modes) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-c-text-3">Auth mode</span>
            <div className="inline-flex rounded-md border border-c-border overflow-hidden">
              {(['intent', 'oauth'] as const).map((m) => (
                <button key={m} onClick={() => setRunMode(m)} disabled={runBusy}
                  className={`px-2.5 py-1 text-[12px] ${runMode === m ? 'bg-c-accent text-white' : 'bg-c-bg text-c-text-2 hover:bg-c-surface-2'} disabled:opacity-50`}>
                  {m === 'intent' ? 'Intent' : 'OAuth'}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-c-text-3">
              {runMode === 'intent'
                ? 'per-op intent token — checksum identity + workflow binding + DPoP'
                : 'plain OAuth bearer, same scope — no identity/workflow/DPoP binding (baseline)'}
            </span>
          </div>

          {/* Attack kind — arms the per-agent component editors under each use case.
              The injected content is the agents' OWN components, edited live and sent
              as a RUN-ONLY override (never registered). */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-c-text-3">Attack</span>
            <div className="inline-flex rounded-md border border-c-border overflow-hidden">
              {(['none', 'prompt_injection', 'excessive_agency', 'custom'] as const).map((v) => (
                <button key={v} onClick={() => setAttackKind(v)} disabled={runBusy}
                  className={`px-2.5 py-1 text-[12px] ${attackKind === v ? (v === 'none' ? 'bg-c-accent text-white' : 'bg-c-danger text-white') : 'bg-c-bg text-c-text-2 hover:bg-c-surface-2'} disabled:opacity-50`}>
                  {v === 'none' ? 'None' : KINDS[v].label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-c-text-3">
              {attackKind === 'none'
                ? 'no attack — a clean run'
                : 'edit the involved agents below, then run the same edit in each mode to contrast'}
            </span>
          </div>
          {attackKind !== 'none' && (
            <div className="rounded-lg border border-c-danger/40 bg-c-danger/5 p-3 space-y-1.5">
              <p className="text-[12px] text-c-text-2 leading-snug">{KINDS[attackKind].blurb}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-c-border/60 bg-c-bg px-2 py-1.5">
                  <span className="font-mono uppercase tracking-wider text-c-accent">Intent</span>
                  <div className="text-c-text-2 mt-0.5">{KINDS[attackKind].intent}</div>
                </div>
                <div className="rounded border border-c-border/60 bg-c-bg px-2 py-1.5">
                  <span className="font-mono uppercase tracking-wider text-c-text-3">OAuth</span>
                  <div className="text-c-text-2 mt-0.5">{KINDS[attackKind].oauth}</div>
                </div>
              </div>
              {!KINDS[attackKind].ready && KINDS[attackKind].note && (
                <p className="text-[11px] text-c-danger">⚠ {KINDS[attackKind].note}</p>
              )}
              <p className="text-[11px] text-c-text-3">Edits apply to the run only — the registered agent is never changed.</p>
            </div>
          )}

          {/* Fallback: an active run whose use case isn't in the list (ad-hoc)
              still shows here; otherwise the panel renders INLINE below its use case. */}
          {runPanelEl && !activeRunUC && runPanelEl}
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
                    onClick={() => runUseCase(p)}
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
                  active={activeRunUC?.id === p.id ? activeAgents : undefined} />

                {/* Live, editable agent components for THIS use case — the tamper surface.
                    System-prompt edits (prompt_injection/custom) diverge the checksum;
                    the input injection (excessive_agency/custom) rides in data. Run-only. */}
                {attackKind !== 'none' && (
                  <div className="mt-3 space-y-2 border-t border-c-border/60 pt-3">
                    <div className="text-[11px] uppercase tracking-wider text-c-text-3">
                      Tamper the components this use case runs — applied to the run only
                    </div>
                    {KINDS[attackKind].promptEditable && membersOf(p).map((aid) => {
                      const agent = agentById.get(aid)
                      if (!agent) return null
                      const key = `sp:${aid}`
                      return (
                        <AgentTamperCard
                          key={aid} agent={agent} isEntry={aid === (p.entry_agent || membersOf(p)[0])}
                          prompt={currentPrompt(aid)} modified={isPromptModified(aid)} busy={runBusy}
                          onChange={(t) => setOverrides((o) => ({ ...o, [aid]: t }))}
                          onReset={() => setOverrides((o) => { const n = { ...o }; delete n[aid]; return n })}
                          instruction={suggestInstr[key] || ''}
                          onInstruction={(t) => setSuggestInstr((s) => ({ ...s, [key]: t }))}
                          asking={!!suggestBusy[key]}
                          onAsk={() => askLLM(key,
                            { profile: id, agent_id: aid, component: 'system_prompt', kind: attackKind, instruction: suggestInstr[key] || '', current: currentPrompt(aid) },
                            (s) => setOverrides((o) => ({ ...o, [aid]: s })))}
                        />
                      )
                    })}
                    {KINDS[attackKind].inputEditable && (() => {
                      const key = `in:${p.id}`
                      const entryId = p.entry_agent || membersOf(p)[0] || ''
                      return (
                        <InputInjectionCard
                          value={inputInjections[p.id] || ''} busy={runBusy}
                          onChange={(t) => setInputInjections((m) => ({ ...m, [p.id]: t }))}
                          instruction={suggestInstr[key] || ''}
                          onInstruction={(t) => setSuggestInstr((s) => ({ ...s, [key]: t }))}
                          asking={!!suggestBusy[key]}
                          onAsk={() => askLLM(key,
                            { profile: id, agent_id: entryId, component: 'input', kind: attackKind, instruction: suggestInstr[key] || '', current: inputInjections[p.id] || '' },
                            (s) => setInputInjections((m) => ({ ...m, [p.id]: s })))}
                        />
                      )
                    })()}
                  </div>
                )}
                {/* The run panel lives INLINE, right under its use case. */}
                {activeRunUC?.id === p.id && runPanelEl && (
                  <div className="mt-3">{runPanelEl}</div>
                )}
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
                <button key={r.run_id} onClick={() => openRun(r.run_id, r.mode)}
                  className="w-full text-left px-4 py-3 hover:bg-c-surface-2 flex items-center gap-3">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                    r.status === 'done' ? 'border-c-success/30 bg-c-success/10 text-c-success'
                    : r.status === 'error' ? 'border-c-danger/30 bg-c-danger/10 text-c-danger'
                    : r.status === 'paused' ? 'border-c-accent/30 bg-c-accent/10 text-c-accent-2'
                    : r.status === 'running' ? 'border-c-accent/30 bg-c-accent/10 text-c-accent-2'
                    : 'border-c-border bg-c-surface-2 text-c-text-3'}`}>{r.status}</span>
                  {r.mode && <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${r.mode === 'oauth' ? 'border-c-warning/30 bg-c-warning/10 text-c-warning' : 'border-c-border bg-c-surface-2 text-c-text-3'}`}>{r.mode}</span>}
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
                grant={grantByAgent.get(a.id) ?? null}
                busy={regBusy === a.id}
                onRegister={() => registerAgents([a.id])}
                onUnregister={() => unregister(a.id)}
                onGrant={() => grantDeclared(a)}
              />
            ))}
          </div>

          {/* Danger zone — clean-slate reset of all registrations for this roster.
              Modeled after GitHub's repo danger zone: a red-bordered section whose
              rows pair a plain-language consequence with the destructive control. */}
          {regCount > 0 && (
            <div className="mt-6 rounded-xl border border-c-danger/40 overflow-hidden">
              <div className="border-b border-c-danger/30 bg-c-danger/5 px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-c-danger">
                Danger zone
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[13px] text-c-text">Unregister all agents in this roster</div>
                  <p className="mt-0.5 text-[12px] text-c-text-3 max-w-xl">
                    Removes every registration ({regCount} of {roster.length}) and its capability grant from the Authority.
                    The saved pack is not deleted — you can re-register anytime. Use this to start from a clean slate.
                  </p>
                </div>
                <button onClick={unregisterAll} disabled={regBusy !== null}
                  className="rounded-md border border-c-danger/50 px-3 py-1.5 text-[12px] font-medium text-c-danger hover:bg-c-danger/10 disabled:opacity-40 shrink-0">
                  {regBusy === '*' ? 'Working…' : `Unregister all ${regCount}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// The a51:rs capability scopes an agent's tools declare (what its governed calls
// need). The grant should cover these; a gap ⇒ the RS will deny (wrong scope).
function declaredScopes(agent: AgentSpec): string[] {
  return Array.from(new Set(
    agent.tools.map((t) => t.op?.scope).filter((s): s is string => !!s),
  ))
}

// ── Attack editors (run-only overrides against the agents' real components) ──

/** One involved agent, with its live system prompt editable + an "Ask the LLM" row.
 *  Tools + config are shown read-only (editable + tool poisoning is a follow-up). */
function AgentTamperCard({ agent, isEntry, prompt, modified, busy, onChange, onReset, instruction, onInstruction, asking, onAsk }: {
  agent: AgentSpec
  isEntry: boolean
  prompt: string
  modified: boolean
  busy: boolean
  onChange: (t: string) => void
  onReset: () => void
  instruction: string
  onInstruction: (t: string) => void
  asking: boolean
  onAsk: () => void
}) {
  const scopes = declaredScopes(agent)
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${modified ? 'border-c-danger/50 bg-c-danger/5' : 'border-c-border bg-c-bg'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[12px] text-c-text">{agent.id}</span>
        {isEntry && <span className="rounded bg-c-surface-2 px-1.5 py-0.5 text-[10px] text-c-text-2">entry</span>}
        {agent.role && <span className="text-[11px] text-c-text-3">{agent.role}</span>}
        {modified && <span className="text-[10px] font-mono uppercase tracking-wider text-c-danger">● modified · not registered</span>}
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-c-text-3">System prompt</span>
        <textarea
          value={prompt} disabled={busy} rows={5}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-c-border bg-c-surface px-2.5 py-2 text-[12px] font-mono text-c-text leading-snug focus:outline-none focus:ring-1 focus:ring-c-danger/50 disabled:opacity-50" />
      </label>

      {/* Ask the generator LLM to draft a tampered prompt for the operator. */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={instruction} disabled={busy || asking}
          onChange={(e) => onInstruction(e.target.value)}
          placeholder="tell the LLM what compromise to simulate (optional)…"
          className="flex-1 min-w-[180px] rounded-md border border-c-border bg-c-surface px-2 py-1 text-[12px] text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-1 focus:ring-c-accent/40 disabled:opacity-50" />
        <button onClick={onAsk} disabled={busy || asking}
          className="rounded-md border border-c-accent/50 px-2.5 py-1 text-[12px] text-c-accent hover:bg-c-accent/10 disabled:opacity-40">
          {asking ? 'Thinking…' : 'Ask the LLM'}
        </button>
        {modified && (
          <button onClick={onReset} disabled={busy}
            className="text-[11px] text-c-text-3 hover:underline disabled:opacity-40">Reset</button>
        )}
      </div>

      {/* Read-only context so the components are visible, not just editable. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-c-text-3">
        <div className="rounded border border-c-border/60 px-2 py-1.5">
          <span className="uppercase tracking-wider">Tools</span>
          <div className="mt-0.5 space-y-0.5">
            {agent.tools.length === 0 && <span>—</span>}
            {agent.tools.map((t) => (
              <div key={t.ref} className="font-mono text-c-text-2 truncate" title={t.op?.scope || t.ref}>
                {t.op ? `${t.op.method} ${t.op.path}` : t.ref}
              </div>
            ))}
            <span className="italic text-c-text-3">tool poisoning — editable soon</span>
          </div>
        </div>
        <div className="rounded border border-c-border/60 px-2 py-1.5">
          <span className="uppercase tracking-wider">Config</span>
          <div className="mt-0.5 font-mono text-c-text-2">model: {agent.llm || 'default'}</div>
          <div className="font-mono text-c-text-2">loop cap: {agent.limit ?? '—'}</div>
          {scopes.length > 0 && <div className="mt-0.5 truncate" title={scopes.join(' ')}>scopes: {scopes.length}</div>}
        </div>
      </div>
    </div>
  )
}

/** The entry-input injection editor (data vector — identity unchanged). */
function InputInjectionCard({ value, busy, onChange, instruction, onInstruction, asking, onAsk }: {
  value: string
  busy: boolean
  onChange: (t: string) => void
  instruction: string
  onInstruction: (t: string) => void
  asking: boolean
  onAsk: () => void
}) {
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${value.trim() ? 'border-c-danger/50 bg-c-danger/5' : 'border-c-border bg-c-bg'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-c-text">Input injection</span>
        <span className="text-[11px] text-c-text-3">planted in the entry agent’s input (data — identity unchanged)</span>
        {value.trim() && <span className="text-[10px] font-mono uppercase tracking-wider text-c-danger">● armed</span>}
      </div>
      <textarea
        value={value} disabled={busy} rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder="injected content the agent will read (e.g. a follow-up instruction from 'retrieved' data)…"
        className="w-full rounded-md border border-c-border bg-c-surface px-2.5 py-2 text-[12px] font-mono text-c-text leading-snug placeholder:text-c-text-3 focus:outline-none focus:ring-1 focus:ring-c-danger/50 disabled:opacity-50" />
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={instruction} disabled={busy || asking}
          onChange={(e) => onInstruction(e.target.value)}
          placeholder="tell the LLM what over-reach to steer toward (optional)…"
          className="flex-1 min-w-[180px] rounded-md border border-c-border bg-c-surface px-2 py-1 text-[12px] text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-1 focus:ring-c-accent/40 disabled:opacity-50" />
        <button onClick={onAsk} disabled={busy || asking}
          className="rounded-md border border-c-accent/50 px-2.5 py-1 text-[12px] text-c-accent hover:bg-c-accent/10 disabled:opacity-40">
          {asking ? 'Thinking…' : 'Ask the LLM'}
        </button>
      </div>
    </div>
  )
}

// ── Run panel ──
function RunPanel({ status, result, traceSpans, useCase, mode, attack, busy, resumeText, setResumeText, onResume }: {
  status: string | null
  result: RunResult | null
  traceSpans: Span[]
  useCase: string | null
  mode: string | null
  attack: string | null
  busy: boolean
  resumeText: string
  setResumeText: (v: string) => void
  onResume: (payload: { answers?: Record<string, unknown>; input?: string }) => void
}) {
  return (
    <div className={`rounded-xl border p-4 ${attack ? 'border-c-danger/40 bg-c-danger/5' : 'border-c-accent/30 bg-c-accent/5'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] font-semibold text-c-text">Run{useCase ? `: ${useCase}` : ''}</span>
        {mode && (
          <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${mode === 'oauth' ? 'border-c-warning/30 bg-c-warning/10 text-c-warning' : 'border-c-accent/30 bg-c-accent/10 text-c-accent-2'}`}>{mode}</span>
        )}
        {attack && (
          <span title="A deterministic compromise was injected into this run" className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-danger/40 bg-c-danger/10 text-c-danger">⚠ {attack.replace('_', ' ')}</span>
        )}
        <span className="text-[11px] font-normal text-c-text-3">
          {mode === 'oauth' ? '— plain OAuth bearer, no intent binding' : '— governed, per-op minted'}
        </span>
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
function AgentRow({ agent, ctx, appId, registration, grant, busy, onRegister, onUnregister, onGrant }: {
  agent: AgentSpec
  ctx: ReturnType<typeof useControlPlane>['currentContext']
  appId?: string | null
  registration: Registration | null
  grant: GrantView | null
  busy: boolean
  onRegister: () => void
  onUnregister: () => void
  onGrant: () => void
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ChecksumPreview | 'loading' | 'error' | null>(null)
  const isRegistered = registration !== null

  // Capabilities: what the tools declare vs what the grant actually covers. A gap
  // means governed RS calls will be denied (wrong scope) — the discovery-path
  // failure mode. B3's "Grant capabilities" closes it.
  const declared = declaredScopes(agent)
  const granted = new Set(grant?.allowed_scopes ?? [])
  const missing = declared.filter((s) => !granted.has(s))
  const hasGap = isRegistered && declared.length > 0 && missing.length > 0

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
        {isRegistered && declared.length > 0 && (
          hasGap
            ? <span title={`Missing: ${missing.join(', ')}`} className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-danger/30 bg-c-danger/10 text-c-danger">no grant · {granted.size}/{declared.length} caps</span>
            : <span title={declared.join(', ')} className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-border bg-c-surface-2 text-c-text-3">{declared.length} caps</span>
        )}
        <span className="text-[10.5px] text-c-text-3">· {agent.tools.length} tool{agent.tools.length === 1 ? '' : 's'}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggle} className="text-[11px] text-c-accent-2 hover:underline">{open ? 'hide' : 'review'}</button>
          {hasGap && (
            <button onClick={onGrant} disabled={busy}
              title={`Grant the ${missing.length} capability scope(s) this agent's tools declare`}
              className="rounded-md border border-c-accent/40 bg-c-accent/5 px-2 py-0.5 text-[11px] text-c-accent-2 hover:bg-c-accent/10 disabled:opacity-40">{busy ? '…' : `Grant ${missing.length} caps`}</button>
          )}
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
