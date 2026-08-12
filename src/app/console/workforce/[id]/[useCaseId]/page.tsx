'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { TraceWaterfall, type Span } from '@/components/console/TraceWaterfall'
import { ElicitForm, type ElicitField } from '@/components/console/ElicitForm'
import {
  AgentTamperCard, InputInjectionCard, KINDS, type AttackKind,
} from '@/components/console/AttackEditor'
import type { AgentSpec, Profile, Scenario, UseCase } from '@/lib/console/workforceTypes'

/**
 * Scenario workspace — the OAuth-vs-Intent contrast for ONE use case. The attack is
 * configured ONCE (a saved, nameable scenario) and run as the SAME attack in both
 * modes, side by side, so the divergence is the story: OAuth proceeds, Intent denies
 * at mint. The attack is a RUN-ONLY override — the registered agents never change.
 */

type RunResult = {
  tool_outputs?: Record<string, unknown>; agent?: string; error?: string
  reason?: string; fields?: ElicitField[]; use_case?: string; status?: string
}
type Mode = 'oauth' | 'intent'
type Lane = { runId: string | null; status: string | null; result: RunResult | null; spans: Span[]; busy: boolean }
const EMPTY_LANE: Lane = { runId: null, status: null, result: null, spans: [], busy: false }

export default function ScenarioWorkspace() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(String(params.id))
  const useCaseId = decodeURIComponent(String(params.useCaseId))

  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Scenario config (the attack surface, authored once).
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [attackKind, setAttackKind] = useState<AttackKind>('prompt_injection')
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [inputInjection, setInputInjection] = useState('')
  const [suggestInstr, setSuggestInstr] = useState<Record<string, string>>({})
  const [suggestBusy, setSuggestBusy] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  // The two run lanes (each span expands its detail inline within its own lane).
  const [lanes, setLanes] = useState<Record<Mode, Lane>>({ oauth: EMPTY_LANE, intent: EMPTY_LANE })
  const setLane = useCallback((mode: Mode, patch: Partial<Lane>) =>
    setLanes((L) => ({ ...L, [mode]: { ...L[mode], ...patch } })), [])

  const program = useMemo<UseCase | undefined>(
    () => profile?.programs.find((p) => p.id === useCaseId), [profile, useCaseId])
  const agentById = useMemo(
    () => new Map((profile?.agents ?? []).map((a) => [a.id, a])), [profile])

  const registeredPrompt = useCallback(
    (aid: string) => agentById.get(aid)?.system_prompt ?? '', [agentById])
  const currentPrompt = useCallback(
    (aid: string) => overrides[aid] ?? registeredPrompt(aid), [overrides, registeredPrompt])
  const isPromptModified = useCallback(
    (aid: string) => overrides[aid] != null && overrides[aid] !== registeredPrompt(aid),
    [overrides, registeredPrompt])
  const membersOf = useCallback((p: UseCase): string[] => {
    const ids = [p.entry_agent || '', ...(p.members ?? [])].filter(Boolean) as string[]
    return Array.from(new Set(ids)).filter((x) => agentById.has(x))
  }, [agentById])

  // Load the pack + hydrate the scenario for this use case (first saved one, if any).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/cp/profiles/${encodeURIComponent(id)}`, { cache: 'no-store' })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) { setError(data.error || `Load failed (HTTP ${res.status})`); return }
        setProfile(data as Profile)
        const existing = (data.scenarios as Scenario[] | undefined)?.find((s) => s.use_case_id === useCaseId)
        if (existing) {
          setScenarioId(existing.id)
          setName(existing.name)
          setAttackKind((existing.attack?.kind as AttackKind) || 'prompt_injection')
          const ov: Record<string, string> = {}
          for (const [aid, comp] of Object.entries(existing.attack?.overrides || {})) {
            if (comp && typeof comp.system_prompt === 'string') ov[aid] = comp.system_prompt
          }
          setOverrides(ov)
          setInputInjection(existing.attack?.input_injection || '')
        }
      } catch (e) { if (!cancelled) setError(String(e)) }
    })()
    return () => { cancelled = true }
  }, [id, useCaseId])

  /** The attack plan from the current surface — the SAME plan for both modes. */
  const buildAttack = useCallback((): Record<string, unknown> => {
    const meta = KINDS[attackKind]
    const ov: Record<string, { system_prompt: string }> = {}
    if (meta.promptEditable && program) {
      for (const aid of membersOf(program)) {
        if (isPromptModified(aid)) ov[aid] = { system_prompt: overrides[aid] }
      }
    }
    const inj = meta.inputEditable ? inputInjection.trim() : ''
    return { kind: attackKind, overrides: ov, input_injection: inj }
  }, [attackKind, program, membersOf, isPromptModified, overrides, inputInjection])

  const armed = useMemo(() => {
    const a = buildAttack() as { overrides: object; input_injection: string }
    return Object.keys(a.overrides).length > 0 || !!a.input_injection
  }, [buildAttack])

  // Agents whose prompt is tampered this run — the trace flags their spans so a
  // watcher can jump straight to where the injection landed.
  const tamperedAgents = useMemo(
    () => new Set(Object.keys(overrides).filter((aid) => isPromptModified(aid))),
    [overrides, isPromptModified])

  async function askLLM(key: string, body: Record<string, unknown>, apply: (s: string) => void) {
    setSuggestBusy((b) => ({ ...b, [key]: true })); setError(null)
    try {
      const res = await fetch('/api/cp/suggest', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({} as { suggestion?: string; error?: string }))
      if (res.ok && typeof data.suggestion === 'string' && data.suggestion.trim()) apply(data.suggestion)
      else setError(data.error || `Suggestion failed (HTTP ${res.status})`)
    } catch (e) { setError(String(e)) }
    finally { setSuggestBusy((b) => ({ ...b, [key]: false })) }
  }

  async function saveScenario() {
    if (!program) return
    setSaving(true); setError(null); setNotice(null)
    try {
      const res = await fetch(`/api/cp/profiles/${encodeURIComponent(id)}/scenarios`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: scenarioId ?? undefined,
          name: name.trim() || `${program.title} — ${KINDS[attackKind].label}`,
          use_case_id: program.id,
          attack: buildAttack(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Save failed (HTTP ${res.status})`); return }
      setScenarioId(data.scenario?.id ?? scenarioId)
      if (data.scenario?.name) setName(data.scenario.name)
      setNotice('Scenario saved.')
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  const fetchTrace = useCallback(async (mode: Mode, rid: string) => {
    try {
      const tr = await fetch(`/api/cp/run/${rid}/trace`, { cache: 'no-store' })
      const td = await tr.json().catch(() => ({}))
      if (Array.isArray(td.spans)) setLane(mode, { spans: td.spans })
    } catch { /* best-effort */ }
  }, [setLane])

  const pollLane = useCallback(async (mode: Mode, rid: string) => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let i = 0; i < 150; i++) {
      await sleep(2000)
      const pr = await fetch(`/api/cp/run/${rid}`, { cache: 'no-store' })
      const pd = await pr.json().catch(() => ({}))
      await fetchTrace(mode, rid)
      if (pd.status && pd.status !== 'running') {
        setLane(mode, { status: pd.status, result: pd.result ?? (pd.error ? { error: pd.error } : null), busy: false })
        return
      }
    }
    setLane(mode, { status: 'timed out', busy: false })
  }, [fetchTrace, setLane])

  const runMode = useCallback(async (mode: Mode) => {
    if (!program) return
    setLanes((L) => ({ ...L, [mode]: { ...EMPTY_LANE, busy: true, status: 'starting' } }))
    setError(null)
    try {
      const res = await fetch('/api/cp/run', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile: id, use_case: program.title, mode, attack: buildAttack() }),
      })
      const started = await res.json()
      if (!res.ok || !started.run_id) {
        setLane(mode, { status: null, busy: false }); setError(started.error || `Run failed (HTTP ${res.status})`); return
      }
      setLane(mode, { runId: started.run_id, status: 'running' })
      await pollLane(mode, started.run_id)
    } catch (e) { setError(String(e)); setLane(mode, { busy: false, status: null }) }
  }, [program, id, buildAttack, pollLane, setLane])

  const resumeLane = useCallback(async (mode: Mode, answers: Record<string, unknown>) => {
    const rid = lanes[mode].runId
    if (!rid) return
    setLane(mode, { busy: true, status: 'running' })
    try {
      const res = await fetch(`/api/cp/run/${rid}/resume`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        // Re-send the armed attack so post-pause agents are tampered too.
        body: JSON.stringify({ answers, attack: buildAttack() }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || `Resume failed (HTTP ${res.status})`); setLane(mode, { status: 'paused', busy: false }); return }
      await pollLane(mode, rid)
    } catch (e) { setError(String(e)); setLane(mode, { status: 'paused', busy: false }) }
  }, [lanes, buildAttack, pollLane, setLane])

  function runBoth() { runMode('oauth'); runMode('intent') }

  // Reattach the last run per mode for this use case on load, so the lanes survive a
  // reload (the runs are durable backend-side). Newest-first list ⇒ first match wins.
  useEffect(() => {
    if (!program) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/cp/runs?profile=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const runs: Array<{ run_id: string; status: string; use_case?: string; mode?: string }> =
          Array.isArray(data.runs) ? data.runs : []
        for (const mode of ['oauth', 'intent'] as Mode[]) {
          const last = runs.find((r) => r.use_case === program.title &&
            (r.mode === mode || (mode === 'intent' && !r.mode)))
          if (!last) continue
          const pr = await fetch(`/api/cp/run/${last.run_id}`, { cache: 'no-store' })
          const pd = await pr.json().catch(() => ({}))
          if (cancelled) return
          setLane(mode, {
            runId: last.run_id, status: pd.status ?? last.status,
            result: pd.result ?? (pd.error ? { error: pd.error } : null),
          })
          fetchTrace(mode, last.run_id)
        }
      } catch { /* best-effort */ }
    })()
    return () => { cancelled = true }
  }, [program, id, setLane, fetchTrace])

  if (error && !profile) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-center text-[13px] text-c-danger">{error}</div>
  }
  if (!profile || !program) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-center text-[13px] text-c-text-3">
      {profile && !program ? 'Use case not found in this pack.' : 'Loading…'}
    </div>
  }
  const anyBusy = lanes.oauth.busy || lanes.intent.busy

  return (
    <div className="max-w-[1700px] mx-auto px-6 py-8">
      <button onClick={() => router.push(`/console/workforce/${encodeURIComponent(id)}`)}
        className="text-[12px] text-c-accent-2 hover:underline">← {profile.name}</button>

      <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-c-text tracking-tight">{program.title}</h1>
          {program.goal && <p className="mt-0.5 text-[13px] text-c-text-2 max-w-2xl">{program.goal}</p>}
          <div className="mt-1 text-[11px] text-c-text-3">Scenario: attack configured once, run in both modes to contrast.</div>
          <div className="mt-0.5 text-[11px] text-c-text-3">
            Runs execute live against the Authority (mint) and the resource server{profile.rs_id ? ` (${profile.rs_id})` : ''} — the tokens in the trace are real and independently verifiable.
          </div>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>}
      {notice && <div className="mt-4 rounded-lg border border-c-success/30 bg-c-success/5 px-4 py-3 text-[13px] text-c-success">{notice}</div>}

      {/* ── Attack surface (configured once) ── */}
      <div className="mt-5 rounded-xl border border-c-border p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="name this scenario…"
            className="flex-1 min-w-[220px] rounded-md border border-c-border bg-c-bg px-2.5 py-1.5 text-[13px] text-c-text placeholder:text-c-text-3 focus:outline-none focus:border-c-accent" />
          <button onClick={saveScenario} disabled={saving}
            className="rounded-md border border-c-accent/50 px-3 py-1.5 text-[12px] text-c-accent hover:bg-c-accent/10 disabled:opacity-40">
            {saving ? 'Saving…' : scenarioId ? 'Save' : 'Save scenario'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-c-text-3">Attack</span>
          <div className="inline-flex rounded-md border border-c-border overflow-hidden">
            {(['prompt_injection', 'excessive_agency', 'custom'] as const).map((v) => (
              <button key={v} onClick={() => setAttackKind(v)} disabled={anyBusy}
                className={`px-2.5 py-1 text-[12px] ${attackKind === v ? 'bg-c-danger text-white' : 'bg-c-bg text-c-text-2 hover:bg-c-surface-2'} disabled:opacity-50`}>
                {KINDS[v].label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-c-text-3">{KINDS[attackKind].blurb}</span>
        </div>
        {KINDS[attackKind].note && (
          <p className="text-[11px] text-c-warning">ℹ {KINDS[attackKind].note}</p>
        )}

        {KINDS[attackKind].promptEditable && membersOf(program).map((aid) => {
          const agent = agentById.get(aid) as AgentSpec
          const key = `sp:${aid}`
          return (
            <AgentTamperCard
              key={aid} agent={agent} isEntry={aid === (program.entry_agent || membersOf(program)[0])}
              prompt={currentPrompt(aid)} modified={isPromptModified(aid)} busy={anyBusy}
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
          const key = `in:${program.id}`
          const entryId = program.entry_agent || membersOf(program)[0] || ''
          return (
            <InputInjectionCard
              value={inputInjection} busy={anyBusy}
              onChange={setInputInjection}
              instruction={suggestInstr[key] || ''}
              onInstruction={(t) => setSuggestInstr((s) => ({ ...s, [key]: t }))}
              asking={!!suggestBusy[key]}
              onAsk={() => askLLM(key,
                { profile: id, agent_id: entryId, component: 'input', kind: attackKind, instruction: suggestInstr[key] || '', current: inputInjection },
                setInputInjection)}
            />
          )
        })()}
        <p className="text-[11px] text-c-text-3">Edits apply to the run only — the registered agents are never changed.</p>
      </div>

      {/* ── Run controls ── */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button onClick={runBoth} disabled={anyBusy}
          className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">
          Run both
        </button>
        <button onClick={() => runMode('oauth')} disabled={anyBusy}
          className="rounded-md border border-c-border px-3 py-1.5 text-[12px] text-c-text-2 hover:bg-c-surface-2 disabled:opacity-40">Run OAuth</button>
        <button onClick={() => runMode('intent')} disabled={anyBusy}
          className="rounded-md border border-c-border px-3 py-1.5 text-[12px] text-c-text-2 hover:bg-c-surface-2 disabled:opacity-40">Run Intent</button>
        {!armed && <span className="text-[11px] text-c-text-3">no edits yet — this will run clean in both modes</span>}
      </div>

      {/* ── What this run actually injected (so a watcher sees the tampering) ── */}
      {armed && (
        <details className="mt-4 rounded-xl border border-c-danger/40 bg-c-danger/5" open>
          <summary className="cursor-pointer px-4 py-2 text-[12px] font-semibold text-c-danger">
            Injected into this run — run-only, never registered
          </summary>
          <div className="px-4 pb-3 space-y-2">
            {program && KINDS[attackKind].promptEditable && membersOf(program).filter(isPromptModified).map((aid) => (
              <div key={aid}>
                <div className="text-[11px] uppercase tracking-wider text-c-text-3">system prompt · <span className="font-mono">{aid}</span></div>
                <pre className="mt-0.5 max-h-64 overflow-auto rounded-md border border-c-border bg-c-bg p-2 text-[11px] font-mono text-c-text-2 whitespace-pre-wrap break-words">{overrides[aid]}</pre>
              </div>
            ))}
            {KINDS[attackKind].inputEditable && inputInjection.trim() && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-c-text-3">input injection</div>
                <pre className="mt-0.5 max-h-40 overflow-auto rounded-md border border-c-border bg-c-bg p-2 text-[11px] font-mono text-c-text-2 whitespace-pre-wrap break-words">{inputInjection}</pre>
              </div>
            )}
          </div>
        </details>
      )}

      {/* ── Contrast diff (the money shot) ── */}
      <ScenarioDiff oauth={lanes.oauth} intent={lanes.intent} />

      {/* ── Two lanes — each span expands its detail INLINE (never off-screen) ── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <RunLane mode="oauth" lane={lanes.oauth} onResume={(a) => resumeLane('oauth', a)} highlightAgents={tamperedAgents} />
        <RunLane mode="intent" lane={lanes.intent} onResume={(a) => resumeLane('intent', a)} highlightAgents={tamperedAgents} />
      </div>
    </div>
  )
}

// ── contrast diff: align the governed tool calls of both lanes ────────────────
type Step = { tool: string; token: string; tokenDecision: string; rs: boolean }

const spanAttr = (s: Span, k: string) => s.attributes?.[k]

/** Extract the ordered governed tool calls from a lane's spans, each with its token
 *  hop (mint/oauth + decision) and whether the RS was actually called. */
function stepsOf(spans: Span[]): Step[] {
  const tools = spans
    .filter((s) => spanAttr(s, 'auth51.tool') !== undefined)
    .sort((a, b) => (a.start_unix_nano ?? 0) - (b.start_unix_nano ?? 0))
  return tools.map((t) => {
    const children = spans.filter((s) => s.parent_span_id === t.span_id)
    const tokenHop = children.find((s) => ['mint', 'oauth'].includes(String(spanAttr(s, 'auth51.hop'))))
    const kind = tokenHop ? String(spanAttr(tokenHop, 'auth51.hop')) : '—'
    const decision = tokenHop
      ? String(spanAttr(tokenHop, 'auth51.decision.result') ?? (kind === 'oauth' ? 'issued' : 'minted'))
      : 'none'
    const rs = children.some((s) => String(spanAttr(s, 'auth51.hop')) === 'rs')
    return { tool: String(spanAttr(t, 'auth51.tool')), token: kind, tokenDecision: decision, rs }
  })
}

function ScenarioDiff({ oauth, intent }: { oauth: Lane; intent: Lane }) {
  const o = stepsOf(oauth.spans)
  const i = stepsOf(intent.spans)
  if (o.length === 0 && i.length === 0) return null
  const rows = Math.max(o.length, i.length)
  const cell = (s?: Step) => {
    if (!s) return { text: 'not reached', cls: 'text-c-text-3', diverge: false }
    const denied = s.tokenDecision === 'deny'
    const text = denied ? `${s.token} DENIED — blocked` : `${s.token} → ${s.rs ? 'RS called' : 'no RS'}`
    return { text, cls: denied ? 'text-c-danger' : s.rs ? 'text-c-success' : 'text-c-text-2', diverge: false }
  }
  return (
    <div className="mt-4 rounded-xl border border-c-border overflow-hidden">
      <div className="border-b border-c-border bg-c-surface-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-c-text-2">
        Contrast — same attack, per governed call
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] text-[11px]">
        <div className="px-3 py-1.5 text-c-text-3 border-b border-c-border/60">Tool call</div>
        <div className="px-3 py-1.5 text-c-text-3 border-b border-c-border/60">OAuth</div>
        <div className="px-3 py-1.5 text-c-text-3 border-b border-c-border/60">Intent</div>
        {Array.from({ length: rows }).map((_, r) => {
          const os = o[r]; const is = i[r]
          const oc = cell(os); const ic = cell(is)
          const diverge = (oc.text !== ic.text)
          const tool = os?.tool || is?.tool || '—'
          return (
            <div key={r} className="contents">
              <div className={`px-3 py-1.5 font-mono border-b border-c-border/40 ${diverge ? 'bg-c-danger/5' : ''}`}>{tool}</div>
              <div className={`px-3 py-1.5 border-b border-c-border/40 ${oc.cls} ${diverge ? 'bg-c-danger/5' : ''}`}>{oc.text}</div>
              <div className={`px-3 py-1.5 border-b border-c-border/40 ${ic.cls} ${diverge ? 'bg-c-danger/5' : ''}`}>{ic.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── verdict + lane ──────────────────────────────────────────────────────────
function verdictOf(lane: Lane): { label: string; cls: string } | null {
  if (!lane.status) return null
  if (lane.status === 'running' || lane.status === 'starting') return { label: 'running…', cls: 'text-c-text-3' }
  if (lane.status === 'paused') return { label: 'paused — awaiting input', cls: 'text-c-warning' }
  const err = lane.result?.error || ''
  const blocked = lane.status === 'error' || /401|denied|mismatch|unregistered|mint|forbidden|invalid_/i.test(err)
  if (blocked) return { label: 'BLOCKED at mint', cls: 'text-c-danger' }
  if (lane.status === 'done') return { label: 'proceeded — completed', cls: 'text-c-success' }
  return { label: lane.status, cls: 'text-c-text-3' }
}

function RunLane({ mode, lane, onResume, highlightAgents }: {
  mode: Mode
  lane: Lane
  onResume: (answers: Record<string, unknown>) => void
  highlightAgents?: Set<string>
}) {
  const v = verdictOf(lane)
  const isIntent = mode === 'intent'
  const fields = lane.status === 'paused' ? lane.result?.fields : undefined
  return (
    <div className={`rounded-xl border p-3 ${isIntent ? 'border-c-accent/30' : 'border-c-border'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[13px] font-semibold text-c-text">{isIntent ? 'Intent' : 'OAuth'}</span>
        <span className="text-[11px] text-c-text-3">
          {isIntent ? 'checksum identity + workflow + DPoP' : 'plain bearer, route scope — no bindings'}
        </span>
      </div>
      {v ? (
        <div className={`mt-1 text-[12px] font-medium ${v.cls}`}>{v.label}</div>
      ) : (
        <div className="mt-1 text-[12px] text-c-text-3">not run yet</div>
      )}

      {fields && fields.length > 0 && (
        <div className="mt-3 rounded-lg border border-c-warning/30 bg-c-warning/5 p-3">
          <div className="text-[11px] text-c-text-2 mb-2">{lane.result?.reason || 'The agent needs input to continue.'}</div>
          <ElicitForm fields={fields} busy={lane.busy} onSubmit={onResume} />
        </div>
      )}

      {lane.result?.tool_outputs && Object.keys(lane.result.tool_outputs).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] text-c-text-3">output</summary>
          <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-c-border bg-c-bg p-2 text-[10px] font-mono text-c-text-2 whitespace-pre-wrap break-words">
            {JSON.stringify(lane.result.tool_outputs, null, 2).slice(0, 20000)}
          </pre>
        </details>
      )}

      {lane.spans.length > 0 && (
        <div className="mt-3">
          {/* Tree with inline detail — click a span, its detail opens right below it. */}
          <TraceWaterfall spans={lane.spans} showDetail={false} highlightAgents={highlightAgents} />
        </div>
      )}
    </div>
  )
}
