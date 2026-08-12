'use client'

// Shared attack-surface editors — used by the scenario workspace and (until it's
// retired) the catalog page. An attack is authored against the agents' REAL
// components and sent as a RUN-ONLY override (never registered).

import type { AgentSpec } from '@/lib/console/workforceTypes'

export type AttackKind = 'prompt_injection' | 'excessive_agency' | 'custom'

/**
 * The attack catalog labels + explains each simulation. The injected CONTENT is not
 * here — it's the agent's own components, edited live and sent verbatim as a RUN-ONLY
 * override. `promptEditable` / `inputEditable` say which vectors the operator edits;
 * `ready` flags whether Intent blocks it today.
 */
export const KINDS: Record<AttackKind, {
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
      "Plant an injection in the agent's input to steer it toward a high-consequence op held " +
      "behind step-up. Identity is unchanged — the over-reach rides in DATA, not the prompt.",
    intent: 'DENIED at mint — the steered op is gated behind step-up (needs an enforce-mode grant).',
    oauth: 'Proceeds — OAuth ignores step-up / workflow, mints a per-op token regardless.',
    promptEditable: false, inputEditable: true, ready: true,
    note: 'Setup: gate the destructive op behind step-up + enforce on the target agent (Agents tab → Capability grant), so Intent denies the steer.',
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

// The a51:rs capability scopes an agent's tools declare (what its governed calls
// need). Shown read-only so the components are visible, not just editable.
export function declaredScopes(agent: AgentSpec): string[] {
  return Array.from(new Set(
    agent.tools.map((t) => t.op?.scope).filter((s): s is string => !!s),
  ))
}

/** One involved agent, with its live system prompt editable + an "Ask the LLM" row.
 *  Tools + config are shown read-only (editable + tool poisoning is a follow-up). */
export function AgentTamperCard({ agent, isEntry, prompt, modified, busy, onChange, onReset, instruction, onInstruction, asking, onAsk }: {
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
export function InputInjectionCard({ value, busy, onChange, instruction, onInstruction, asking, onAsk }: {
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
