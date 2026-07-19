'use client'

import { useMemo, useState } from 'react'

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
}
type Profile = {
  id: string; name: string; description?: string; rs_id?: string | null
  structure: string; agents: AgentSpec[]; programs: UseCase[]
  use_cases: string[]; owner_org?: string | null; source: string
}
type GenerateResponse = { profile?: Profile; warnings?: string[]; error?: string }

function deriveRsId(specText: string): string {
  try {
    const spec = JSON.parse(specText)
    const url: string | undefined = spec?.servers?.[0]?.url
    if (url) return new URL(url.includes('://') ? url : `https://${url}`).host
  } catch { /* not parseable yet */ }
  return ''
}

export default function StudioPage() {
  const [specText, setSpecText] = useState('')
  const [specUrl, setSpecUrl] = useState('')
  const [rsId, setRsId] = useState('')
  const [useCasesText, setUseCasesText] = useState('')
  const [context, setContext] = useState('')
  const [busy, setBusy] = useState<'generate' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [progress, setProgress] = useState<string[]>([]) // live agent activity feed

  // Best-effort prefill for JSON paste; YAML / URL specs derive rs_id server-side.
  const derivedRs = useMemo(() => deriveRsId(specText), [specText])

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
      const jobId: string = started.job_id
      for (;;) {
        await sleep(1500)
        const pr = await fetch(`/api/cp/generate/${jobId}`, { cache: 'no-store' })
        const j = await pr.json()
        if (!pr.ok) { setError(j.error || `Lost the job (HTTP ${pr.status})`); break }
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
      const res = await fetch('/api/cp/profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(result.profile),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Save failed (HTTP ${res.status})`); return }
      setNotice(`Saved "${result.profile.name}" to your org — its agents now appear under Agents.`)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(null)
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
            The generator agent walks the whole spec on Claude Opus — you'll see its
            progress below as it works.
          </span>
        </div>
      </div>

      {/* ── Live activity feed (the agent walking the spec) ────────── */}
      {(busy === 'generate' || (progress.length > 0 && !profile)) && (
        <div className="mt-6 rounded-xl border border-c-border bg-c-surface-2 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-c-accent animate-pulse" />
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3">
              Generator agent {busy === 'generate' ? 'working' : 'finished'}
            </span>
          </div>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {(progress.length ? progress : ['Starting…']).slice(-14).map((line, i, arr) => (
              <div
                key={i}
                className={
                  'text-[12px] font-mono ' +
                  (busy === 'generate' && i === arr.length - 1
                    ? 'text-c-text'
                    : 'text-c-text-3')
                }
              >
                <span className="text-c-text-3">›</span> {line}
              </div>
            ))}
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
            <button
              onClick={onSave}
              disabled={busy !== null}
              className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40"
            >
              {busy === 'save' ? 'Saving…' : 'Save to my org'}
            </button>
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
                      {p.entry_agent && <span className="text-[11px] text-c-text-3 font-mono">entry: {p.entry_agent}</span>}
                      {p.suggested && (
                        <span className="rounded-full bg-c-accent/10 border border-c-accent/30 px-2 py-0.5 text-[10px] font-mono text-c-accent-2">
                          suggested
                        </span>
                      )}
                    </div>
                    {p.goal && <p className="mt-1 text-[12px] text-c-text-3">{p.goal}</p>}
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
