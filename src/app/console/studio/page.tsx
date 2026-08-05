'use client'

import { useEffect, useMemo, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { ElicitForm, type ElicitField } from '@/components/console/ElicitForm'
import { TraceWaterfall, type Span } from '@/components/console/TraceWaterfall'

/**
 * Simulation Studio — turn an OpenAPI spec into a governed agentic pack.
 *
 * Paste a spec + optional use cases → the workforce generator (Claude Opus)
 * composes a deduplicated agent roster with a delegation topology, each tool
 * bound to a real operation with its exact a51:rs scope (the LLM never authors a
 * scope). Review the roster, then Save it into this org — the agents surface in
 * Agents, ready to register + run.
 *
 * The browser never sees an Authority token: /api/cp/generate exchanges one
 * server-side and calls workforce with it, scoping the pack to this org.
 */

type OperationRef = { operation_id: string; method: string; path: string; scope: string; summary?: string }
type ToolRef = { ref: string; op?: OperationRef | null }
type AgentSpec = {
  id: string; role?: string; system_prompt: string
  tools: ToolRef[]; delegates_to: string[]; limit?: number
}
type UseCase = {
  id: string; title: string; goal?: string
  entry_agent?: string | null; kind: string; suggested?: boolean
  members?: string[]   // agents this use case exercises (entry + any delegates)
}
type Profile = {
  id: string; name: string; description?: string; rs_id?: string | null
  structure: string; agents: AgentSpec[]; programs: UseCase[]
  use_cases: string[]; owner_org?: string | null; app_id?: string | null; source: string
}
type GenerateResponse = { profile?: Profile; warnings?: string[]; error?: string }
type ProfileSummary = {
  id: string; name: string; description?: string; source: string
  owner_org?: string | null; use_cases: string[]; agents: string[]
}

function deriveRsId(specText: string): string {
  try {
    const spec = JSON.parse(specText)
    const url: string | undefined = spec?.servers?.[0]?.url
    if (url) return new URL(url.includes('://') ? url : `https://${url}`).host
  } catch { /* not parseable yet */ }
  return ''
}

export default function StudioPage() {
  const { currentContext } = useControlPlane()
  const [specText, setSpecText] = useState('')
  const [specUrl, setSpecUrl] = useState('')
  const [rsId, setRsId] = useState('')
  const [useCasesText, setUseCasesText] = useState('')
  const [context, setContext] = useState('')
  const [busy, setBusy] = useState<'generate' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // "Register on Save" — default OFF. Off ⇒ the pack goes through the
  // discovery-first flow (baseline run surfaces agents in Discovered). On ⇒
  // register the roster now, under the active app, in your org.
  const [autoRegister, setAutoRegister] = useState(false)
  // ── Run a use case (governed live agent) ──
  const [runUseCaseText, setRunUseCaseText] = useState('')
  const [runBusy, setRunBusy] = useState(false)
  const [runStatus, setRunStatus] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)        // current run, for resume
  const [resumeText, setResumeText] = useState('')               // the user's answer to a Yield
  const [traceSpans, setTraceSpans] = useState<Span[]>([])       // live trace waterfall
  const [runResult, setRunResult] = useState<{ tool_outputs?: Record<string, unknown>; agent?: string; error?: string; reason?: string; fields?: ElicitField[] } | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [progress, setProgress] = useState<string[]>([]) // live agent activity feed
  const [elapsed, setElapsed] = useState(0) // seconds spent generating (reassurance)
  const [saved, setSaved] = useState<ProfileSummary[] | null>(null) // your saved packs

  // Best-effort prefill for JSON paste; YAML / URL specs derive rs_id server-side.
  const derivedRs = useMemo(() => deriveRsId(specText), [specText])

  // Tick an elapsed-time counter while the generator runs.
  useEffect(() => {
    if (busy !== 'generate') return
    setElapsed(0)
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  // Load this org's saved packs on visit (this is what "comes back" after login).
  async function loadSaved() {
    try {
      const res = await fetch('/api/cp/profiles', { cache: 'no-store' })
      const data = await res.json()
      setSaved(res.ok && Array.isArray(data.profiles) ? data.profiles : [])
    } catch {
      setSaved([])
    }
  }
  useEffect(() => { loadSaved() }, [])

  // Clear the run panel — used when switching rosters so one pack's run never
  // bleeds into another's. The backend keeps a paused run durably per roster, so
  // clearing here only parks it; re-opening the pack restores it.
  function resetRunState() {
    setRunId(null); setRunStatus(null); setRunResult(null)
    setTraceSpans([]); setResumeText(''); setRunUseCaseText('')
  }

  // Re-attach to whatever scenario THIS roster left paused (durable, backend-owned).
  // Best-effort: nothing paused ⇒ {} ⇒ the panel stays idle. A finished/aborted run
  // isn't stored, so we never restore stale state.
  async function restorePausedRun(profileId: string) {
    try {
      const res = await fetch(`/api/cp/run/latest?profile=${encodeURIComponent(profileId)}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json().catch(() => ({})) as {
        run_id?: string; status?: string
        result?: { tool_outputs?: Record<string, unknown>; agent?: string; reason?: string; fields?: ElicitField[]; use_case?: string } | null
      }
      if (!data.run_id) return
      setRunId(data.run_id)
      setRunStatus(data.status || 'paused')
      setRunResult(data.result ?? null)
      if (data.result?.use_case) setRunUseCaseText(data.result.use_case)
      fetchTrace(data.run_id)   // rebuild the waterfall as it stood at the pause
    } catch { /* best-effort restore */ }
  }

  // Open a saved pack into the roster view (GET returns the full profile object).
  async function openSaved(id: string) {
    setError(null); setNotice(null); setResult(null); setProgress([])
    resetRunState()   // park the previous roster's run before showing this one
    try {
      const res = await fetch(`/api/cp/profiles/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Could not load "${id}"`); return }
      setResult({ profile: data as Profile, warnings: [] })
      await restorePausedRun(id)   // re-attach this roster's paused scenario, if any
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    } catch (e) {
      setError(String(e))
    }
  }

  async function onGenerate() {
    setError(null); setNotice(null); setResult(null); setProgress([])
    const url = specUrl.trim()
    const text = specText.trim()
    if (!url && !text) { setError('Paste a spec (JSON or YAML) or give a spec URL.'); return }
    const use_cases = useCasesText.split('\n').map((s) => s.trim()).filter(Boolean)
    // Send raw text or a URL — the server accepts JSON or YAML and derives the
    // RS host from the spec when we don't supply one.
    const payload = {
      ...(url ? { spec_url: url } : { spec_text: text }),
      rs_id: rsId.trim() || undefined,
      // Which App this pack belongs to (its agents register/mint under it, and
      // the console's app-scoped Registered/Discovered reads then line up).
      app_id: currentContext?.appId || undefined,
      use_cases,
      domain_context: context,
    }
    setBusy('generate')
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    try {
      // 1) start the job
      const res = await fetch('/api/cp/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const started = await res.json()
      if (!res.ok || !started.job_id) {
        setError(started.error || `Generation failed (HTTP ${res.status})`); return
      }
      // 2) poll the live progress feed until done — the Opus run is on the
      //    workforce, so this stays responsive however long generation takes.
      //    Tolerate transient poll failures (a flaky token exchange etc.) — the
      //    job keeps running on the backend, so retry rather than give up.
      const jobId: string = started.job_id
      let fails = 0
      for (;;) {
        await sleep(1500)
        let j: { status?: string; progress?: string[]; result?: unknown; error?: string }
        try {
          const pr = await fetch(`/api/cp/generate/${jobId}`, { cache: 'no-store' })
          j = await pr.json()
          if (!pr.ok) throw new Error(j.error || `HTTP ${pr.status}`)
        } catch (e) {
          if (++fails >= 5) { setError(`Lost contact with the job: ${String(e)}`); break }
          continue // transient — the job is still running; keep polling
        }
        fails = 0
        if (Array.isArray(j.progress)) setProgress(j.progress)
        if (j.status === 'done') { setResult(j.result as GenerateResponse); break }
        if (j.status === 'error') { setError(j.error || 'generation failed'); break }
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(null)
    }
  }

  async function onSave() {
    if (!result?.profile) return
    setError(null); setNotice(null); setBusy('save')
    try {
      const res = await fetch(`/api/cp/profiles${autoRegister ? '?auto_register=true' : ''}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(result.profile),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Save failed (HTTP ${res.status})`); return }
      const reg = data.registration
      const regNote = reg?.registered
        ? ` Registered ${reg.ok_count}/${reg.agents?.length ?? 0} agents under "${reg.app_id}".`
        : autoRegister ? ` (registration: ${reg?.error ?? 'skipped'})` : ''
      setNotice(`Saved "${result.profile.name}" to your org.${regNote} It's in "Your saved workforces" and will be here next time you log in.`)
      loadSaved() // reflect the new/updated pack in the saved list immediately
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(null)
    }
  }

  async function deletePack(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes the saved pack and its stored spec. Agents already registered in the Authority keep their identity.`)) return
    setError(null); setNotice(null)
    try {
      const res = await fetch(`/api/cp/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || `Delete failed (HTTP ${res.status})`); return
      }
      if (result?.profile?.id === id) setResult(null) // close it if it's open
      setNotice(`Deleted "${name}".`)
      loadSaved()
    } catch (e) { setError(String(e)) }
  }

  // Poll a run until it settles on a non-running status (done/error/aborted) OR
  // pauses awaiting user input ('paused'). Sets runStatus + runResult and returns;
  // 'paused' carries result.reason (what the agent needs) for the input panel.
  async function fetchTrace(id: string) {
    try {
      const tr = await fetch(`/api/cp/run/${id}/trace`, { cache: 'no-store' })
      const td = await tr.json().catch(() => ({}))
      if (Array.isArray(td.spans)) setTraceSpans(td.spans)
    } catch { /* trace is best-effort; never breaks the run */ }
  }

  async function pollRun(id: string) {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let i = 0; i < 150; i++) {
      await sleep(2000)
      const pr = await fetch(`/api/cp/run/${id}`, { cache: 'no-store' })
      const pd = await pr.json().catch(() => ({}))
      await fetchTrace(id) // live waterfall grows as the run progresses
      if (pd.status && pd.status !== 'running') {
        setRunStatus(pd.status)
        setRunResult(pd.result ?? (pd.error ? { error: pd.error } : null))
        return
      }
    }
    setRunStatus('timed out')
  }

  async function runUseCase() {
    const p = result?.profile
    if (!p) return
    setRunBusy(true); setRunStatus('starting'); setRunResult(null)
    setResumeText(''); setRunId(null); setError(null); setTraceSpans([])
    try {
      const res = await fetch('/api/cp/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile: p.id, use_case: runUseCaseText.trim() || undefined }),
      })
      const started = await res.json()
      if (!res.ok || !started.run_id) {
        setError(started.error || `Run failed (HTTP ${res.status})`); setRunStatus(null); return
      }
      setRunId(started.run_id); setRunStatus('running')
      await pollRun(started.run_id)
    } catch (e) {
      setError(String(e)); setRunStatus(null)
    } finally {
      setRunBusy(false)
    }
  }

  // Answer the agent's Yield and continue the SAME run — with structured `answers`
  // (from an elicitation form) or free-text `input`. It may finish, or pause again
  // with a follow-up (the panel just re-renders each time).
  async function submitResume(payload: { answers?: Record<string, unknown>; input?: string }) {
    if (!runId) return
    setRunBusy(true); setRunStatus('running'); setError(null)
    try {
      const res = await fetch(`/api/cp/run/${runId}/resume`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const started = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Keep the panel (values stay) so the user can fix + retry.
        setError(started.error || `Resume failed (HTTP ${res.status})`)
        setRunStatus('paused'); return
      }
      await pollRun(runId)
    } catch (e) {
      setError(String(e)); setRunStatus('paused')
    } finally {
      setRunBusy(false)
    }
  }

  const profile = result?.profile
  const warnings = result?.warnings ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-[22px] font-semibold text-c-text tracking-tight">Simulation Studio</h1>
      <p className="mt-1 mb-6 text-[14px] text-c-text-2 max-w-2xl">
        Turn an OpenAPI spec into a governed agentic workforce. The generator composes
        the agents and their delegation structure; every tool is bound to a real
        operation with its exact capability scope. Review, then save into your org.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-c-success/30 bg-c-success/5 px-4 py-3 text-[13px] text-c-success">
          {notice}
        </div>
      )}

      {/* ── Your saved workforces (loaded on visit) ────────────────── */}
      {saved && saved.length > 0 && (
        <div className="mb-6 rounded-xl border border-c-border overflow-hidden">
          <div className="px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
            Your saved workforces
          </div>
          <div className="divide-y divide-c-border">
            {saved.map((p) => (
              <div
                key={p.id}
                className="px-4 py-3 hover:bg-c-surface-2 flex items-center justify-between gap-3"
              >
                <button onClick={() => openSaved(p.id)} className="min-w-0 flex-1 text-left">
                  <div className="text-[14px] text-c-text truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-[12px] text-c-text-3 truncate">{p.description}</div>
                  )}
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] font-mono text-c-text-3">{p.agents.length} agents</span>
                  {p.source === 'seed' ? (
                    <span className="rounded-full bg-c-surface-2 border border-c-border px-2 py-0.5 text-[10px] font-mono text-c-text-3">seed</span>
                  ) : (
                    <button
                      onClick={() => deletePack(p.id, p.name)}
                      className="text-[12px] text-c-danger hover:underline">
                      Delete
                    </button>
                  )}
                  <button onClick={() => openSaved(p.id)} aria-label="Open" className="text-c-text-3 hover:text-c-text">→</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Input form ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-c-border bg-c-bg p-4 space-y-4">
        <div>
          <label className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5 block">
            Spec URL (optional — fetched for you)
          </label>
          <input
            value={specUrl}
            onChange={(e) => setSpecUrl(e.target.value)}
            placeholder="https://raw.githubusercontent.com/plaid/plaid-openapi/master/2020-09-14.yml"
            spellCheck={false}
            className="w-full rounded-lg border border-c-border bg-c-surface-2 px-3 py-2 text-[12px] font-mono text-c-text"
          />
        </div>

        <div>
          <label className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5 block">
            …or paste the OpenAPI spec (JSON or YAML){specUrl.trim() && <span className="text-c-text-3 normal-case"> — ignored while a URL is set</span>}
          </label>
          <textarea
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
            placeholder={'openapi: 3.0.0\ninfo: { title: My API }\npaths: { ... }'}
            spellCheck={false}
            disabled={!!specUrl.trim()}
            className="w-full h-48 rounded-lg border border-c-border bg-c-surface-2 px-3 py-2 text-[12px] font-mono text-c-text leading-relaxed disabled:opacity-40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5 block">
              RS host (optional){derivedRs && <span className="text-c-text-3 normal-case"> — detected {derivedRs}</span>}
            </label>
            <input
              value={rsId}
              onChange={(e) => setRsId(e.target.value)}
              placeholder={derivedRs || 'derived from spec servers'}
              spellCheck={false}
              className="w-full rounded-lg border border-c-border bg-c-surface-2 px-3 py-2 text-[12px] font-mono text-c-text"
            />
          </div>
          <div>
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5 block">
              Business context (optional)
            </label>
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="A fintech that moves money for SMB customers"
              className="w-full rounded-lg border border-c-border bg-c-surface-2 px-3 py-2 text-[12px] text-c-text"
            />
          </div>
        </div>

        <div>
          <label className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5 block">
            Use cases (one per line, optional — the generator also suggests its own)
          </label>
          <textarea
            value={useCasesText}
            onChange={(e) => setUseCasesText(e.target.value)}
            placeholder={'Pay a vendor invoice\nReconcile yesterday’s transactions'}
            className="w-full h-20 rounded-lg border border-c-border bg-c-surface-2 px-3 py-2 text-[12px] text-c-text leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGenerate}
            disabled={busy !== null || (!specText.trim() && !specUrl.trim())}
            className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy === 'generate' ? 'Generating…' : 'Generate workforce'}
          </button>
          <span className="text-[11.5px] text-c-text-3">
            The generator agent walks the whole spec on Claude Opus — its progress
            shows below as it works.
          </span>
        </div>
      </div>

      {/* ── Live activity feed (the agent walking the spec) ────────── */}
      {(busy === 'generate' || (progress.length > 0 && !profile)) && (
        <div className="mt-6 rounded-xl border border-c-border bg-c-surface-2 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            {busy === 'generate' ? (
              <span className="w-4 h-4 rounded-full border-2 border-c-accent/25 border-t-c-accent animate-spin" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-c-success/20 border border-c-success/40 flex items-center justify-center text-[9px] text-c-success">✓</span>
            )}
            <span className="text-[13px] font-medium text-c-text">
              {busy === 'generate' ? 'Generator agent working' : 'Generator agent finished'}
            </span>
            {busy === 'generate' && (
              <span className="text-[11.5px] font-mono text-c-text-3 tabular-nums">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {(progress.length ? progress : ['Starting…']).slice(-16).map((line, i, arr) => {
              const isLast = i === arr.length - 1
              const active = busy === 'generate' && isLast
              return (
                <div key={i} className="flex items-start gap-3 py-1">
                  <span className="mt-[3px] shrink-0">
                    {active ? (
                      <span className="block w-3.5 h-3.5 rounded-full border-2 border-c-accent/25 border-t-c-accent animate-spin" />
                    ) : (
                      <span className="block w-3.5 h-3.5 rounded-full bg-c-accent/15 border border-c-accent/40" />
                    )}
                  </span>
                  <span className={'text-[13px] leading-[1.45] ' + (active ? 'text-c-text font-medium' : 'text-c-text-2')}>
                    {line}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────── */}
      {profile && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-[16px] font-semibold text-c-text truncate">{profile.name}</h2>
              <span className="rounded-full bg-c-accent/10 border border-c-accent/30 px-2 py-0.5 text-[11px] font-mono text-c-accent-2">
                {profile.structure}
              </span>
              <span className="text-[12px] text-c-text-3 font-mono">{profile.agents.length} agents</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[12px] text-c-text-2 cursor-pointer select-none"
                     title="On: register the roster now, in your org, under the active app. Off: the pack goes through the discovery-first flow (a baseline run surfaces agents in Discovered for review).">
                <input type="checkbox" checked={autoRegister}
                       onChange={(e) => setAutoRegister(e.target.checked)}
                       disabled={busy !== null} />
                Register on save
              </label>
              <button
                onClick={onSave}
                disabled={busy !== null}
                className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40"
              >
                {busy === 'save' ? 'Saving…' : 'Save to my org'}
              </button>
            </div>
          </div>

          {/* ── Run a use case (governed live agent) ── */}
          <div className="mb-4 rounded-lg border border-c-border bg-c-surface-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-[12px] font-semibold text-c-text">
                Run a use case <span className="font-normal text-c-text-3">— a real agent, governed tool calls</span>
              </div>
              <button onClick={runUseCase} disabled={runBusy}
                className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">
                {runBusy ? (runStatus ?? 'Running…') : 'Run'}
              </button>
            </div>
            <input value={runUseCaseText} onChange={(e) => setRunUseCaseText(e.target.value)}
              placeholder={profile.use_cases?.[0] || 'Describe what the agent should do…'}
              className="w-full rounded-md border border-c-border bg-c-bg px-3 py-2 text-[13px] text-c-text outline-none focus:border-c-accent" />
            {profile.use_cases && profile.use_cases.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.use_cases.slice(0, 6).map((uc, i) => (
                  <button key={i} onClick={() => setRunUseCaseText(uc)}
                    className="rounded-full border border-c-border px-2 py-0.5 text-[11px] text-c-text-2 hover:border-c-accent">
                    {uc}
                  </button>
                ))}
              </div>
            )}
            {/* Paused: the agent yielded for input. Show its ask + an answer box. */}
            {runStatus === 'paused' && !runBusy && (
              <div className="mt-3 rounded-md border border-c-accent/40 bg-c-accent/5 px-3 py-2.5">
                <div className="text-[12px] font-semibold text-c-text">
                  Agent needs input{runResult?.agent ? ` · ${runResult.agent}` : ''}
                </div>
                {runResult?.reason && (
                  <div className="mt-1 text-[12px] text-c-text-2 whitespace-pre-wrap break-words">{runResult.reason}</div>
                )}
                {runResult?.fields && runResult.fields.length > 0 ? (
                  <ElicitForm
                    key={`${runId}:${JSON.stringify(runResult.fields)}`}
                    fields={runResult.fields}
                    busy={runBusy}
                    onSubmit={(answers) => submitResume({ answers })}
                  />
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && resumeText.trim()) submitResume({ input: resumeText.trim() }) }}
                      autoFocus placeholder="Type your answer…"
                      className="flex-1 rounded-md border border-c-border bg-c-bg px-3 py-2 text-[13px] text-c-text outline-none focus:border-c-accent" />
                    <button onClick={() => submitResume({ input: resumeText.trim() })} disabled={!resumeText.trim()}
                      className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}
            {runStatus && runStatus !== 'paused' && !runBusy && (
              <div className="mt-3">
                <div className={`text-[12px] font-medium ${runStatus === 'done' ? 'text-c-success' : runStatus === 'error' ? 'text-c-danger' : 'text-c-text-2'}`}>
                  Run {runStatus}{runResult?.agent ? ` · agent ${runResult.agent}` : ''}
                </div>
                {runResult?.error && <div className="mt-1 text-[12px] text-c-danger break-words">{runResult.error}</div>}
                {runResult?.tool_outputs && (
                  <pre className="mt-2 rounded-md bg-c-bg border border-c-border px-3 py-2 text-[11px] font-mono text-c-text-2 overflow-x-auto max-h-72">
                    {JSON.stringify(runResult.tool_outputs, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {traceSpans.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-[11px] font-semibold text-c-text-2">
                  Trace <span className="font-normal text-c-text-3">— governed hops (mint · DPoP · RS) and LLM calls; select a span for tokens + attributes</span>
                </div>
                <TraceWaterfall spans={traceSpans} />
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="mb-4 rounded-lg border border-c-border bg-c-surface-2 px-4 py-3">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3 mb-1.5">
                Reconciliation ({warnings.length})
              </div>
              <ul className="text-[12px] text-c-text-2 space-y-0.5 list-disc pl-4">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Agents */}
          <div className="rounded-xl border border-c-border overflow-hidden">
            <div className="px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
              Agent roster
            </div>
            <div className="divide-y divide-c-border">
              {profile.agents.map((a) => (
                <div key={a.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-c-text font-mono">{a.id}</span>
                    {a.role && <span className="text-[11px] text-c-text-3">{a.role}</span>}
                    {a.delegates_to.length > 0 && (
                      <span className="rounded-md bg-c-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-c-text-2">
                        delegates → {a.delegates_to.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-c-text-2 leading-relaxed whitespace-pre-wrap">{a.system_prompt}</p>
                  {a.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.tools.map((t) => (
                        <span
                          key={t.ref}
                          title={t.op?.scope || t.ref}
                          className="rounded-md bg-c-accent/10 border border-c-accent/20 px-1.5 py-0.5 text-[11px] font-mono text-c-accent-2"
                        >
                          {t.op ? `${t.op.method} ${t.op.path}` : t.ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Use cases */}
          {profile.programs.length > 0 && (
            <div className="mt-4 rounded-xl border border-c-border overflow-hidden">
              <div className="px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
                Use cases
              </div>
              <div className="divide-y divide-c-border">
                {profile.programs.map((p) => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-c-text">{p.title}</span>
                      <span className="rounded-md bg-c-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-c-text-2">{p.kind}</span>
                      {p.suggested && (
                        <span className="rounded-full bg-c-accent/10 border border-c-accent/30 px-2 py-0.5 text-[10px] font-mono text-c-accent-2">
                          suggested
                        </span>
                      )}
                    </div>
                    {p.goal && <p className="mt-1 text-[12px] text-c-text-3">{p.goal}</p>}
                    {(() => {
                      // The roster this use case exercises: entry first (starts the
                      // run), then any agents it delegates to. Falls back to just the
                      // entry for older packs generated before `members` existed.
                      const entry = p.entry_agent || undefined
                      const rest = (p.members || []).filter((m) => m !== entry)
                      const roster = entry ? [entry, ...rest] : rest
                      if (roster.length === 0) return null
                      return (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wider text-c-text-3">Agents</span>
                          {roster.map((m) => (
                            <span key={m}
                              title={m === entry ? 'Entry agent — starts this use case' : 'Delegated to by the entry agent'}
                              className={`rounded-md px-1.5 py-0.5 text-[11px] font-mono ${
                                m === entry
                                  ? 'bg-c-accent/10 border border-c-accent/30 text-c-accent-2'
                                  : 'bg-c-surface-2 text-c-text-2'}`}>
                              {m === entry ? `▶ ${m}` : m}
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
