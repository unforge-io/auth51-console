'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useControlPlane } from '@/lib/console/controlPlane'
import {
  deregisterWorkflow,
  listRegisteredWorkflows,
  type WorkflowDefinitionWire,
  type WorkflowStepWire,
} from '@/lib/console/api'
import type { Profile, UseCase } from '@/lib/console/workforceTypes'

/**
 * Workflow guard panel — the derive → review → approve → register loop for ONE use
 * case, in the browser (previously CLI-only via arm_workflow).
 *
 * The operator runs the use case CLEAN a few times (the run controls on this page),
 * then derives a GUARDED workflow from those traces: the observed flow stays free,
 * the roster's dangerous capabilities (never seen in a clean run) become red lines
 * held behind an approval gate. Approving registers it ENFORCE-first — loose but
 * enforcing — and a later re-derive registers a superseding version (tightening).
 *
 * The registered guard is what makes the Intent lane DENY the attack at mint while
 * OAuth proceeds — the contrast this page exists to show.
 */

type DerivedStep = WorkflowStepWire & { action: string }

type Proposal = {
  workflow: WorkflowDefinitionWire | null
  run_count: number
  sampled_runs?: string[]
  registered?: { status?: string; workflow_id?: string } | null
}

const isRedLine = (s: WorkflowStepWire) =>
  (s.dependencies?.length ?? 0) > 0 || !!s.requires_approval || !!s.approval_gate
const isApprovalGate = (s: WorkflowStepWire) => !!s.approval_gate

export function splitSteps(wf: WorkflowDefinitionWire | null): { red: DerivedStep[]; free: DerivedStep[]; gate: boolean } {
  if (!wf) return { red: [], free: [], gate: false }
  const red: DerivedStep[] = []
  const free: DerivedStep[] = []
  let gate = false
  for (const [, s] of Object.entries(wf.steps)) {
    if (isApprovalGate(s)) { gate = true; continue }
    const step = { ...s, action: s.action } as DerivedStep
    if (isRedLine(s)) red.push(step)
    else free.push(step)
  }
  return { red, free, gate }
}

export function WorkflowGuardPanel({ profile, program }: { profile: Profile; program: UseCase }) {
  const { currentContext } = useControlPlane()
  const workflowId = `guard-${program.id}`

  const [guards, setGuards] = useState<WorkflowDefinitionWire[] | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [busy, setBusy] = useState<null | 'derive' | 'commit' | 'deregister'>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const appId = profile.app_id ?? undefined

  const loadGuards = useCallback(async () => {
    if (!currentContext) { setGuards([]); return }
    try {
      const wfs = await listRegisteredWorkflows(currentContext, appId)
      setGuards(wfs)
    } catch {
      setGuards([]) // 404 (endpoint not deployed) / unreachable ⇒ treat as none
    }
  }, [currentContext, appId])

  useEffect(() => { loadGuards() }, [loadGuards])

  const active = useMemo(
    () => (guards ?? []).find((w) => w.workflow_id === workflowId) ?? null,
    [guards, workflowId])

  async function derive(commit: boolean) {
    setBusy(commit ? 'commit' : 'derive'); setError(null); setNotice(null)
    try {
      const res = await fetch(`/api/cp/profiles/${encodeURIComponent(profile.id)}/derive-workflow`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ use_case: program.title, commit, mode: 'enforce', workflow_id: workflowId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || `Derive failed (HTTP ${res.status})`); return }
      setProposal(data as Proposal)
      setOpen(true)
      if (commit) {
        const status = data.registered?.status ?? 'registered'
        setNotice(status === 'skipped'
          ? 'No change — the registered guard already matches.'
          : `Guard ${status} (enforce). The Intent lane now blocks the red lines at mint.`)
        setProposal(null)
        await loadGuards()
      }
    } catch (e) { setError(String(e)) }
    finally { setBusy(null) }
  }

  async function removeGuard(wfId: string) {
    if (!currentContext) return
    if (!window.confirm(`Deregister guard "${wfId}"? The Intent lane will stop enforcing it.`)) return
    setBusy('deregister'); setError(null); setNotice(null)
    try {
      await deregisterWorkflow(currentContext, wfId, appId)
      setNotice(`Deregistered "${wfId}".`)
      await loadGuards()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(null) }
  }

  const prop = proposal?.workflow ?? null
  const { red, free, gate } = splitSteps(prop)
  const runCount = proposal?.run_count ?? 0

  return (
    <div className="rounded-xl border border-c-border">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-c-text">Workflow guard</span>
          {active ? (
            <GuardBadge wf={active} />
          ) : guards === null ? (
            <span className="text-[11px] text-c-text-3">checking…</span>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-border bg-c-surface-2 text-c-text-3">
              none registered
            </span>
          )}
        </div>
        <span className="text-[11px] text-c-accent-2">{open ? 'hide' : 'manage'}</span>
      </button>

      {open && (
        <div className="border-t border-c-border px-4 py-3 space-y-3">
          <p className="text-[11.5px] text-c-text-2 leading-relaxed">
            Derive a guard from this use case&apos;s <b>clean runs</b>: the observed flow stays free,
            the roster&apos;s dangerous capabilities become red lines behind an approval gate. Registered
            enforce-first — a later re-derive supersedes it (tightening).
          </p>

          {error && <div className="rounded-md border border-c-danger/30 bg-c-danger/5 px-3 py-2 text-[12px] text-c-danger">{error}</div>}
          {notice && <div className="rounded-md border border-c-success/30 bg-c-success/5 px-3 py-2 text-[12px] text-c-success">{notice}</div>}

          {/* Currently-registered guard */}
          {active && (
            <div className="rounded-lg border border-c-border bg-c-bg px-3 py-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono text-[12px] text-c-text">{active.workflow_id}</span>
                <div className="flex items-center gap-2">
                  <GuardBadge wf={active} />
                  <button onClick={() => removeGuard(active.workflow_id)} disabled={busy !== null}
                    className="rounded-md border border-c-danger/40 px-2 py-0.5 text-[11px] text-c-danger hover:bg-c-danger/10 disabled:opacity-40">
                    {busy === 'deregister' ? '…' : 'Deregister'}
                  </button>
                </div>
              </div>
              <GuardSteps wf={active} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => derive(false)} disabled={busy !== null}
              className="rounded-md border border-c-border px-3 py-1.5 text-[12px] text-c-text-2 hover:bg-c-surface-2 disabled:opacity-40">
              {busy === 'derive' ? 'Deriving…' : 'Derive from clean runs'}
            </button>
            {prop && red.length > 0 && (
              <button onClick={() => derive(true)} disabled={busy !== null || runCount === 0}
                className="rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">
                {busy === 'commit' ? 'Registering…' : active ? 'Approve & supersede (enforce)' : 'Approve & register (enforce)'}
              </button>
            )}
          </div>

          {/* Proposal (dry-run) */}
          {proposal && (
            <div className="rounded-lg border border-c-accent/30 bg-c-accent/5 px-3 py-2.5 space-y-2">
              <div className="text-[11px] text-c-text-2">
                Sampled <b>{runCount}</b> clean run{runCount === 1 ? '' : 's'} of <span className="font-mono">{program.title}</span>.
                {runCount === 0 && (
                  <span className="text-c-warning"> Run the use case clean a few times first — then derive.</span>
                )}
              </div>
              {red.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-c-danger mb-1">
                    Red lines · guarded {gate && '(approval gate)'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {red.map((s) => (
                      <span key={s.action} title={`${s.agent} · deps: ${(s.dependencies ?? []).join(', ') || 'approval'}`}
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-c-danger/30 bg-c-danger/10 text-c-danger">
                        {s.action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {free.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-c-text-3 mb-1">Free · observed flow</div>
                  <div className="flex flex-wrap gap-1">
                    {free.map((s) => (
                      <span key={s.action} title={s.agent}
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-c-border bg-c-bg text-c-text-2">
                        {s.action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {red.length === 0 && (
                <div className="text-[11px] text-c-text-3">
                  No red lines found — the roster has no dangerous capabilities to guard for this use case.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function GuardBadge({ wf }: { wf: WorkflowDefinitionWire }) {
  const enforce = wf.mode !== 'observe'  // default/undefined ⇒ enforce (enforce-first)
  const hitl = Object.values(wf.steps).some((s) => s.approval_gate)
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
        enforce ? 'border-c-success/30 bg-c-success/10 text-c-success' : 'border-c-warning/30 bg-c-warning/10 text-c-warning'}`}>
        {enforce ? 'enforce' : 'observe'}
      </span>
      {wf.control && (
        <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-c-border bg-c-surface-2 text-c-text-3">
          {wf.control}
        </span>
      )}
      {hitl && <span className="text-[9.5px] font-mono uppercase tracking-wider text-c-warning">HITL</span>}
    </span>
  )
}

export function GuardSteps({ wf }: { wf: WorkflowDefinitionWire }) {
  const { red, free } = splitSteps(wf)
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {red.map((s) => (
        <span key={`r-${s.action}`} className="text-[10.5px] font-mono px-1.5 py-0.5 rounded border border-c-danger/30 bg-c-danger/10 text-c-danger">{s.action}</span>
      ))}
      {free.map((s) => (
        <span key={`f-${s.action}`} className="text-[10.5px] font-mono px-1.5 py-0.5 rounded border border-c-border bg-c-bg text-c-text-3">{s.action}</span>
      ))}
    </div>
  )
}
