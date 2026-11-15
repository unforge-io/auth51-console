'use client'

import { useMemo, useRef, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { registerWorkflow, AuthorityError, type WorkflowAck } from '@/lib/console/api'
import {
  describeBound,
  isHumanPin,
  parseWorkflowDraft,
  summarizeSteps,
} from '@/lib/workflow-authoring'
import { cn } from '@/lib/utils'

/**
 * Register an authored workflow under the active App.
 *
 * This is the host-agnostic registration path: the Console posts the definition
 * straight to the Authority, so it works the same for a studio pack and for a
 * customer's own auth51-client app. It is also the way to attach value bounds
 * (an amount cap, a human-pinned recipient) — derivation from clean runs never
 * produces those.
 *
 * Flow: paste or load JSON → local shape check → review what each step enforces →
 * register. The Authority re-validates against its own tier floor and can still
 * reject; its reasons are shown verbatim.
 */
export function RegisterWorkflowDialog({
  onClose,
  onRegistered,
  initialText = '',
}: {
  onClose: () => void
  onRegistered: (ack: WorkflowAck) => void
  initialText?: string
}) {
  const { currentContext } = useControlPlane()
  const [text, setText] = useState(initialText)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const draft = useMemo(() => parseWorkflowDraft(text), [text])
  const steps = useMemo(() => (draft.ok ? summarizeSteps(draft.workflow) : []), [draft])
  const appId = currentContext?.appId ?? 'Patchet'

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    setServerError(null)
    setText(await file.text())
  }

  const submit = async () => {
    if (!currentContext || !draft.ok) return
    setBusy(true); setServerError(null)
    try {
      const ack = await registerWorkflow(currentContext, draft.workflow, appId)
      onRegistered(ack)
    } catch (err) {
      setServerError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Register a workflow"
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-c-surface border border-c-border rounded-xl shadow-2xl"
      >
        <div className="px-5 pt-5 pb-3 border-b border-c-border">
          <h2 className="text-[16px] font-semibold text-c-text">Register a workflow</h2>
          <p className="text-[12.5px] text-c-text-2 mt-1 leading-relaxed">
            Registers under app <span className="font-mono text-c-text">{appId}</span> at the Authority.
            It applies to every agent in that app, wherever it runs. A changed definition becomes a new
            version; the latest one is enforced.
          </p>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2">
          {/* Editor */}
          <div className="flex flex-col min-h-0 md:border-r border-c-border">
            <div className="px-5 py-2 flex items-center justify-between gap-3 border-b border-c-border">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3">Definition · JSON</span>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[11.5px] text-c-accent hover:text-c-accent-2"
              >
                Load file…
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = '' }}
              />
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setServerError(null) }}
              spellCheck={false}
              placeholder={PLACEHOLDER}
              aria-label="Workflow definition JSON"
              className="flex-1 min-h-[260px] w-full resize-none px-5 py-3 bg-c-bg text-c-text font-mono text-[12px] leading-relaxed focus:outline-none"
            />
          </div>

          {/* Review */}
          <div className="min-h-0 overflow-y-auto px-5 py-3">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3">What it enforces</span>

            {!draft.ok && (
              <ul className="mt-2 space-y-1.5">
                {draft.errors.map((e) => (
                  <li key={e} className={cn(
                    'text-[12px] leading-relaxed',
                    text.trim() ? 'text-c-danger' : 'text-c-text-3',
                  )}>{e}</li>
                ))}
              </ul>
            )}

            {draft.ok && (
              <div className="mt-2 space-y-3">
                <div className="flex flex-wrap gap-1.5 text-[10.5px] font-mono">
                  <Chip>{draft.workflow.workflow_id}</Chip>
                  <Chip>{draft.workflow.mode ?? 'enforce'}</Chip>
                  <Chip>{draft.workflow.control ?? 'strict'}</Chip>
                  <Chip>{steps.length} step{steps.length === 1 ? '' : 's'}</Chip>
                </div>

                {draft.warnings.map((w) => (
                  <p key={w} className="text-[11.5px] text-c-warning leading-relaxed">{w}</p>
                ))}

                {steps.map((s) => (
                  <div key={s.name} className="rounded-md border border-c-border bg-c-bg px-3 py-2">
                    <div className="font-mono text-[12.5px] font-semibold text-c-text">{s.name}</div>
                    <div className="text-[11.5px] text-c-text-2 mt-0.5">
                      <span className="font-mono">{s.agent}</span> may call <span className="font-mono">{s.action}</span>
                      {s.guards.length > 0 && <span className="text-c-text-3"> · {s.guards.join(' · ')}</span>}
                    </div>
                    {s.bounds.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {s.bounds.map((b, i) => (
                          <li key={i} className="flex items-baseline gap-2 text-[11.5px]">
                            <span className="font-mono text-c-text">{describeBound(b)}</span>
                            <span className={cn(
                              'text-[10px] font-mono px-1 rounded border',
                              isHumanPin(b) ? 'border-c-warning/50 text-c-warning' : 'border-c-border text-c-text-3',
                            )}>
                              {isHumanPin(b) ? 'human pin' : (b.tier || 'bound')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.bounds.length === 0 && s.guards.length === 0 && (
                      <div className="text-[11px] text-c-text-3 mt-1">No guard on this step.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {serverError && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-md border border-c-danger/30 bg-c-danger/5 text-[12px] text-c-danger leading-relaxed" role="alert">
            <div className="font-medium mb-0.5">The Authority rejected this workflow</div>
            <div className="text-[11.5px] opacity-90 whitespace-pre-wrap break-words">{serverError}</div>
          </div>
        )}

        <div className="px-5 py-3 mt-3 border-t border-c-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-[12.5px] text-c-text-2 hover:bg-c-surface-2 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!draft.ok || busy || !currentContext}
            className="px-3 py-1.5 rounded-md text-[12.5px] font-medium text-white bg-c-accent hover:bg-c-accent-2 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Registering…' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="px-1.5 py-0.5 rounded border border-c-border bg-c-bg text-c-text-2">{children}</span>
}

/** The Authority's own words when it has them (FastAPI puts the reason in `detail`). */
function describeError(err: unknown): string {
  if (err instanceof AuthorityError) {
    const d = err.detail
    if (d && typeof d === 'object' && 'detail' in d) {
      const inner = (d as { detail: unknown }).detail
      return typeof inner === 'string' ? inner : JSON.stringify(inner, null, 2)
    }
    if (typeof d === 'string' && d) return d
    return err.message
  }
  return err instanceof Error ? err.message : String(err)
}

const PLACEHOLDER = `{
  "workflow_id": "clear-backlog",
  "mode": "enforce",
  "control": "guarded",
  "steps": {
    "disburse": {
      "agent": "disburser",
      "action": "process_payment",
      "tier": "FINANCIAL",
      "value_bound": true,
      "value_bounds": [
        { "target": "self.in.amount", "op": "<=", "operand": { "lit": 5000 }, "tier": "T1" },
        { "target": "self.in.recipient", "op": "==", "operand": { "pin": true }, "tier": "T3" }
      ]
    }
  }
}`
