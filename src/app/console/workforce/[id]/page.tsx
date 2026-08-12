'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useControlPlane } from '@/lib/console/controlPlane'
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
import { declaredScopes } from '@/components/console/AttackEditor'
import type { AgentSpec, Profile } from '@/lib/console/workforceTypes'

/**
 * Dedicated workforce page (2.F) — operate one saved pack: run its use cases with
 * one click, see the delegation + live trace, and manage the roster's registration.
 * Studio stays for create/import/save; this is where a saved pack is operated.
 */

type RunSummary = { run_id: string; status: string; use_case?: string; agent?: string; mode?: string }
type Tab = 'usecases' | 'agents'

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

  // Last runs per use case (for the compact preview strip). Runs + attack scenarios
  // are operated on the dedicated scenario workspace, not inline here.
  const [history, setHistory] = useState<RunSummary[] | null>(null)

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
  // Last run per (use case title, mode) → a compact verdict chip. The runs list is
  // newest-first, so the first entry per (title, mode) is the latest.
  const runsByUseCase = useMemo(() => {
    const m = new Map<string, { intent?: string; oauth?: string }>()
    for (const r of history ?? []) {
      if (!r.use_case) continue
      const mode = r.mode === 'oauth' ? 'oauth' : 'intent'
      const e = m.get(r.use_case) ?? {}
      if (e[mode] === undefined) e[mode] = r.status
      m.set(r.use_case, e)
    }
    return m
  }, [history])

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
  // Load recent runs once (powers the per-use-case preview strip).
  useEffect(() => { if (profile) loadHistory() }, [profile, loadHistory])

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

  // Least-privilege config (6.3): set which declared scopes are ALLOWED vs held
  // behind STEP-UP, and the grant mode. A destructive op in step-up + enforce is
  // denied at mint when an agent is steered there (Intent) — while OAuth proceeds.
  async function assignGrantConfig(
    agentId: string, allowed: string[], stepUp: string[], mode: 'observe' | 'enforce',
  ) {
    if (!currentContext) return
    setRegBusy(agentId); setError(null); setNotice(null)
    try {
      await assignGrant(currentContext, agentId, allowed,
        { appId: profile?.app_id ?? undefined, replace: true, stepUp, mode })
      setNotice(`Updated grant for "${agentId}" — ${allowed.length} allowed, ${stepUp.length} step-up, ${mode}.`)
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
        {(['usecases', 'agents'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-[13px] -mb-px border-b-2 ${tab === t ? 'border-c-accent text-c-text font-medium' : 'border-transparent text-c-text-3 hover:text-c-text-2'}`}>
            {t === 'usecases' ? `Use cases (${profile.programs.length})` : `Agents (${roster.length})`}
          </button>
        ))}
      </div>

      {tab === 'usecases' && (
        <div className="mt-4 space-y-3">
          <p className="text-[12px] text-c-text-3">
            Open a use case to run it — clean, or as an attack scenario contrasting OAuth vs Intent.
          </p>
          {profile.programs.length === 0 && (
            <div className="rounded-xl border border-c-border px-4 py-8 text-center text-[13px] text-c-text-3">This pack has no use cases.</div>
          )}
          {profile.programs.map((p) => {
            const entry = p.entry_agent || undefined
            const entryRegistered = !entry || registeredIds.has(entry)
            const prev = runsByUseCase.get(p.title)
            const scenarios = (profile.scenarios ?? []).filter((s) => s.use_case_id === p.id)
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
                    onClick={() => router.push(`/console/workforce/${encodeURIComponent(id)}/${encodeURIComponent(p.id)}`)}
                    className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 shrink-0">
                    Open →
                  </button>
                </div>
                {!entryRegistered && (
                  <div className="mt-2 text-[11px] text-c-warning">Entry agent <span className="font-mono">{entry}</span> is not registered — register it in the Agents tab first.</div>
                )}
                <DelegationTree entryId={p.entry_agent} members={p.members} agents={roster} />
                {/* Compact preview: last run per mode + saved attack scenarios. */}
                {(prev?.intent || prev?.oauth || scenarios.length > 0) && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                    {prev?.intent && <PreviewChip mode="Intent" status={prev.intent} />}
                    {prev?.oauth && <PreviewChip mode="OAuth" status={prev.oauth} />}
                    {scenarios.map((s) => (
                      <button key={s.id}
                        onClick={() => router.push(`/console/workforce/${encodeURIComponent(id)}/${encodeURIComponent(p.id)}`)}
                        title="Open this saved attack scenario"
                        className="rounded border border-c-danger/30 bg-c-danger/5 px-1.5 py-0.5 font-mono text-c-danger hover:bg-c-danger/10">
                        ⚠ {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
                onAssign={(allowed, stepUp, mode) => assignGrantConfig(a.id, allowed, stepUp, mode)}
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

// ── use-case preview chip (last run per mode) ──
function PreviewChip({ mode, status }: { mode: string; status: string }) {
  const cls = status === 'done' ? 'text-c-success border-c-success/30 bg-c-success/10'
    : status === 'error' ? 'text-c-danger border-c-danger/30 bg-c-danger/10'
    : status === 'paused' ? 'text-c-warning border-c-warning/30 bg-c-warning/10'
    : 'text-c-text-3 border-c-border bg-c-surface-2'
  const label = status === 'done' ? 'ran' : status === 'error' ? 'blocked' : status
  return <span className={`rounded border px-1.5 py-0.5 font-mono ${cls}`}>{mode}: {label}</span>
}

// ── One agent row (roster) ──
function AgentRow({ agent, ctx, appId, registration, grant, busy, onRegister, onUnregister, onGrant, onAssign }: {
  agent: AgentSpec
  ctx: ReturnType<typeof useControlPlane>['currentContext']
  appId?: string | null
  registration: Registration | null
  grant: GrantView | null
  busy: boolean
  onRegister: () => void
  onUnregister: () => void
  onGrant: () => void
  onAssign: (allowed: string[], stepUp: string[], mode: 'observe' | 'enforce') => void
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ChecksumPreview | 'loading' | 'error' | null>(null)
  const isRegistered = registration !== null

  // Least-privilege editor state — which scopes are gated behind step-up, + mode.
  // Re-syncs from the persisted grant after an Apply (version bump), not on unrelated
  // reloads (so mid-edit isn't clobbered).
  const [stepUp, setStepUp] = useState<Set<string>>(() => new Set(grant?.step_up_scopes ?? []))
  const [enforce, setEnforce] = useState(grant?.mode === 'enforce')
  useEffect(() => {
    setStepUp(new Set(grant?.step_up_scopes ?? []))
    setEnforce(grant?.mode === 'enforce')
  }, [grant?.version]) // eslint-disable-line react-hooks/exhaustive-deps

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
          {isRegistered && declared.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-c-text-3">Capability grant · least-privilege</div>
                <div className="inline-flex rounded-md border border-c-border overflow-hidden">
                  {(['observe', 'enforce'] as const).map((m) => (
                    <button key={m} onClick={() => setEnforce(m === 'enforce')} disabled={busy}
                      className={`px-2 py-0.5 text-[10px] ${enforce === (m === 'enforce') ? 'bg-c-accent text-white' : 'bg-c-bg text-c-text-2 hover:bg-c-surface-2'} disabled:opacity-50`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                {declared.map((sc) => {
                  const gated = stepUp.has(sc)
                  const t = agent.tools.find((tt) => tt.op?.scope === sc)
                  const lbl = t?.op ? `${t.op.method.toUpperCase()} ${t.op.path}` : sc
                  return (
                    <div key={sc} className="flex items-center gap-2 text-[11px]">
                      <span className="flex-1 truncate font-mono text-c-text-2" title={sc}>{lbl}</span>
                      <div className="inline-flex shrink-0 overflow-hidden rounded border border-c-border">
                        <button onClick={() => setStepUp((s) => { const n = new Set(s); n.delete(sc); return n })} disabled={busy}
                          className={`px-1.5 py-0.5 text-[10px] ${!gated ? 'bg-c-success/20 text-c-success' : 'text-c-text-3 hover:bg-c-surface-2'}`}>allow</button>
                        <button onClick={() => setStepUp((s) => { const n = new Set(s); n.add(sc); return n })} disabled={busy}
                          className={`px-1.5 py-0.5 text-[10px] ${gated ? 'bg-c-warning/20 text-c-warning' : 'text-c-text-3 hover:bg-c-surface-2'}`}>step-up</button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onAssign(declared.filter((s) => !stepUp.has(s)), declared.filter((s) => stepUp.has(s)), enforce ? 'enforce' : 'observe')}
                  disabled={busy}
                  className="rounded-md border border-c-accent/50 px-2.5 py-1 text-[11px] text-c-accent hover:bg-c-accent/10 disabled:opacity-40">
                  {busy ? '…' : 'Apply grant'}
                </button>
                <span className="text-[10px] text-c-text-3">Move a destructive op to <b>step-up</b> + <b>enforce</b> — an agent steered there is denied at mint (Intent); OAuth ignores it.</span>
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
