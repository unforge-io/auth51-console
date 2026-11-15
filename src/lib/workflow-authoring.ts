/**
 * Authored-workflow helpers — parse and check a workflow definition a person wrote
 * (or exported), and render its value bounds in plain words.
 *
 * Host-agnostic by design: a workflow is registered against an APP at the Authority,
 * so the same document governs a studio pack and a customer's own auth51-client app.
 * Nothing here knows about the workforce.
 *
 * The checks below are a convenience so obvious mistakes surface before a round trip.
 * The Authority remains the judge: it re-validates every step against its own tier
 * floor at registration and rejects a workflow that frees a dangerous operation.
 *
 * Pure TypeScript — no React/Next dependencies.
 */

import type { ValueBoundWire, WorkflowDefinitionWire, WorkflowStepWire } from './console/api'

export type DraftResult =
  | { ok: true; workflow: WorkflowDefinitionWire; warnings: string[] }
  | { ok: false; errors: string[] }

const MODES = ['observe', 'enforce']
const CONTROLS = ['strict', 'guarded']
const OPS = ['>', '>=', '<', '<=', '==', '!=', 'in', 'not_in']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

/** Parse a JSON workflow definition and check its shape. */
export function parseWorkflowDraft(text: string): DraftResult {
  if (!text.trim()) return { ok: false, errors: ['Paste a workflow definition, or load a file.'] }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (err) {
    return { ok: false, errors: [`Not valid JSON: ${err instanceof Error ? err.message : String(err)}`] }
  }
  if (!isRecord(raw)) return { ok: false, errors: ['The definition must be a JSON object.'] }

  const errors: string[] = []
  const warnings: string[] = []

  if (typeof raw.workflow_id !== 'string' || !raw.workflow_id.trim()) {
    errors.push('`workflow_id` is required (a non-empty string).')
  }
  if (raw.workflow_type !== undefined && raw.workflow_type !== 'dag') {
    errors.push('`workflow_type` must be "dag".')
  }
  if (raw.mode !== undefined && !MODES.includes(String(raw.mode))) {
    errors.push('`mode` must be "observe" or "enforce".')
  }
  if (raw.control !== undefined && !CONTROLS.includes(String(raw.control))) {
    errors.push('`control` must be "strict" or "guarded".')
  }
  if (raw.control === undefined) {
    warnings.push('No `control` given — the Authority defaults to "strict": every step a run takes must be declared here.')
  }
  if (raw.mode === 'observe') {
    warnings.push('`mode` is "observe" — violations are recorded but not blocked.')
  }

  if (!isRecord(raw.steps) || Object.keys(raw.steps).length === 0) {
    errors.push('`steps` is required (an object with at least one step).')
    return { ok: false, errors }
  }

  const stepNames = new Set(Object.keys(raw.steps))
  for (const [name, step] of Object.entries(raw.steps)) {
    const at = `steps.${name}`
    if (!isRecord(step)) { errors.push(`${at} must be an object.`); continue }
    if (typeof step.agent !== 'string' || !step.agent) errors.push(`${at}.agent is required.`)
    if (typeof step.action !== 'string' || !step.action) errors.push(`${at}.action is required.`)
    if (step.scopes !== undefined && !isStringArray(step.scopes)) errors.push(`${at}.scopes must be a list of strings.`)
    if (step.dependencies !== undefined) {
      if (!isStringArray(step.dependencies)) {
        errors.push(`${at}.dependencies must be a list of step names.`)
      } else {
        for (const dep of step.dependencies) {
          // A warning, not an error: the Authority decides what an unknown predecessor means.
          if (!stepNames.has(dep)) warnings.push(`${at}.dependencies names "${dep}", which is not a step in this workflow.`)
        }
      }
    }
    const bounds = step.value_bounds
    if (bounds !== undefined) {
      if (!Array.isArray(bounds)) {
        errors.push(`${at}.value_bounds must be a list.`)
      } else {
        bounds.forEach((b, i) => {
          const bat = `${at}.value_bounds[${i}]`
          if (!isRecord(b)) { errors.push(`${bat} must be an object.`); return }
          if (typeof b.target !== 'string' || !b.target) errors.push(`${bat}.target is required (for example "self.in.amount").`)
          if (typeof b.op !== 'string' || !OPS.includes(b.op)) errors.push(`${bat}.op must be one of ${OPS.join(', ')}.`)
          if (!isRecord(b.operand)) errors.push(`${bat}.operand is required (for example {"lit": 5000} or {"pin": true}).`)
        })
        if (bounds.length > 0 && step.value_bound !== true) {
          errors.push(`${at} has value_bounds but \`value_bound\` is not true — the bounds would not be enforced.`)
        }
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, workflow: raw as unknown as WorkflowDefinitionWire, warnings }
}

/** The last path segment of a selector: "self.in.amount" → "amount". */
function paramOf(target: string): string {
  return target.replace(/^self\.in\./, '')
}

function describeOperand(operand: Record<string, unknown>): string {
  if ('lit' in operand) return JSON.stringify(operand.lit)
  if (operand.pin) return 'the value a human pins'
  if ('ref' in operand) return String(operand.ref)
  if ('sel' in operand) return String(operand.sel)
  if ('fn' in operand) {
    const args = Array.isArray(operand.args)
      ? operand.args.map((a) => (isRecord(a) ? describeOperand(a) : String(a))).join(', ')
      : ''
    return `${String(operand.fn)}(${args})`
  }
  if (isRecord(operand.pref)) {
    const p = operand.pref
    return `${String(p.provider)}${p.field ? `.${String(p.field)}` : ''}`
  }
  return JSON.stringify(operand)
}

/** One value bound in plain words: `amount <= 5000`, `recipient == the value a human pins`. */
export function describeBound(b: ValueBoundWire): string {
  const op = b.op === 'not_in' ? 'not in' : b.op
  return `${paramOf(b.target)} ${op} ${describeOperand(b.operand ?? {})}`
}

/** True when the bound waits for a person to pin the value (T3). */
export function isHumanPin(b: ValueBoundWire): boolean {
  return Boolean(b.operand && (b.operand as Record<string, unknown>).pin)
}

export type StepSummary = {
  name: string
  agent: string
  action: string
  guards: string[]
  bounds: ValueBoundWire[]
}

/** What each step enforces, for the pre-registration review. */
export function summarizeSteps(wf: WorkflowDefinitionWire): StepSummary[] {
  return Object.entries(wf.steps).map(([name, step]: [string, WorkflowStepWire]) => {
    const guards: string[] = []
    if (step.approval_gate || step.requires_approval) guards.push('human approval')
    if ((step.dependencies?.length ?? 0) > 0) guards.push(`after ${step.dependencies!.join(', ')}`)
    if (step.required) guards.push('required')
    return {
      name,
      agent: step.agent,
      action: step.action,
      guards,
      bounds: step.value_bounds ?? [],
    }
  })
}
