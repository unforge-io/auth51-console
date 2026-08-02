'use client'

import { useState } from 'react'

/**
 * A structured-elicitation field, as declared by a paused agent (Yield.fields).
 * Modeled on MCP elicitation: a flat, typed field the UI renders as a control.
 */
export type ElicitField = {
  name: string
  label?: string
  type?: string // string | number | integer | boolean
  required?: boolean
  enum?: (string | number)[]
  format?: string // for string: email | tel | url | date | multiline
  placeholder?: string
  description?: string
}

const INPUT_CLS =
  'rounded-md border border-c-border bg-c-bg px-3 py-2 text-[13px] text-c-text outline-none focus:border-c-accent'

function Control({ f, value, onChange }: {
  f: ElicitField
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (f.type === 'boolean') {
    return (
      <input type="checkbox" checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-c-accent" />
    )
  }
  if (f.enum && f.enum.length > 0) {
    return (
      <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS}>
        <option value="">Select…</option>
        {f.enum.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
      </select>
    )
  }
  if (f.format === 'multiline') {
    return (
      <textarea value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}
        placeholder={f.placeholder} rows={3} className={INPUT_CLS} />
    )
  }
  const inputType =
    f.type === 'number' || f.type === 'integer' ? 'number'
    : f.format === 'email' ? 'email'
    : f.format === 'tel' ? 'tel'
    : f.format === 'url' ? 'url'
    : f.format === 'date' ? 'date'
    : 'text'
  return (
    <input type={inputType} value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder={f.placeholder} className={INPUT_CLS} />
  )
}

/**
 * Renders a typed form from an agent's elicitation schema and returns the
 * collected answers (keyed by field name, coerced to the declared type) on Send.
 * Mount once per pause — the parent should `key` it on the field set so a new
 * pause starts fresh.
 */
export function ElicitForm({ fields, busy, onSubmit }: {
  fields: ElicitField[]
  busy?: boolean
  onSubmit: (answers: Record<string, unknown>) => void
}) {
  const [vals, setVals] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? false : ''])))
  const set = (name: string, v: unknown) => setVals((s) => ({ ...s, [name]: v }))

  const complete = fields
    .filter((f) => f.required !== false)
    .every((f) => (f.type === 'boolean' ? true : String(vals[f.name] ?? '').trim() !== ''))

  function submit() {
    const out: Record<string, unknown> = {}
    for (const f of fields) {
      if (f.type === 'boolean') { out[f.name] = !!vals[f.name]; continue }
      const s = String(vals[f.name] ?? '').trim()
      if (s === '') continue // drop empty optionals
      out[f.name] = f.type === 'number' || f.type === 'integer' ? Number(s) : s
    }
    onSubmit(out)
  }

  return (
    <div className="mt-2 space-y-2">
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-[11px] text-c-text-2">
            {f.label || f.name}
            {f.required !== false && <span className="text-c-danger"> *</span>}
          </label>
          <Control f={f} value={vals[f.name]} onChange={(v) => set(f.name, v)} />
          {f.description && <span className="text-[10px] text-c-text-3">{f.description}</span>}
        </div>
      ))}
      <button onClick={submit} disabled={busy || !complete}
        className="mt-1 rounded-md bg-c-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-c-accent-2 disabled:opacity-40">
        Send
      </button>
    </div>
  )
}
