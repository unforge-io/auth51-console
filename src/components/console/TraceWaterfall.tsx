'use client'

import { useMemo, useState } from 'react'

/** A persisted OTel span from a run (as served by GET /run/{id}/trace). */
export type Span = {
  span_id: string
  parent_span_id?: string | null
  trace_id?: string
  name?: string
  kind?: number
  start_unix_nano?: number
  end_unix_nano?: number
  attributes?: Record<string, unknown>
}

type Node = Span & { depth: number; children: Node[] }

// ── helpers ────────────────────────────────────────────────────────────────
function attr(s: Span, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = s.attributes?.[k]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}
const durMs = (s: Span) =>
  s.start_unix_nano && s.end_unix_nano ? (s.end_unix_nano - s.start_unix_nano) / 1e6 : 0

function kindOf(s: Span): string {
  const hop = attr(s, 'auth51.hop')
  if (hop) return String(hop) // mint | dpop | rs
  if (attr(s, 'auth51.tool') !== undefined) return 'tool' // our explicit tool-call span
  const oi = attr(s, 'openinference.span.kind')
  if (oi) return String(oi).toLowerCase() // llm | tool | chain | agent
  return ''
}

const KIND_STYLE: Record<string, string> = {
  mint: 'bg-c-accent/15 text-c-accent-2 border-c-accent/40',
  dpop: 'bg-c-accent/10 text-c-accent-2 border-c-accent/30',
  rs: 'bg-c-success/15 text-c-success border-c-success/40',
  llm: 'bg-c-warning/15 text-c-text border-c-border',
  tool: 'bg-c-surface-2 text-c-text-2 border-c-border',
}

// The workforce opens an explicit `tool <name>` span (carrying `auth51.tool`) around
// each tool call, so the embed's mint/dpop/rs hops nest under it. But that span is
// created via the run tracer under whatever OTel span is active — the `agent.run`
// root — because OpenInference nests its own nodes by LangChain run-tree lineage, not
// by the active OTel context. So the tool span (with its hops) ends up "pulled out" of
// the node tree. Reparent each such span under the TIGHTEST non-auth51 span whose time
// interval contains it — the `run_tool` node that actually invoked it. The hops keep
// their (unchanged) parent = the tool span, so the whole subtree moves together.
function reparentAuth51Tools(spans: Span[]): Map<string, string> {
  const overrides = new Map<string, string>()
  const isAuth51 = (s: Span) =>
    attr(s, 'auth51.tool') !== undefined || attr(s, 'auth51.hop') !== undefined
  const contains = (a: Span, b: Span) =>
    a.span_id !== b.span_id &&
    (a.start_unix_nano ?? 0) <= (b.start_unix_nano ?? 0) &&
    (a.end_unix_nano ?? 0) >= (b.end_unix_nano ?? 0)
  for (const s of spans) {
    if (attr(s, 'auth51.tool') === undefined) continue // only the tool-call spans
    let best: Span | undefined
    for (const c of spans) {
      if (isAuth51(c) || !contains(c, s)) continue
      if (best === undefined || durMs(c) < durMs(best)) best = c // tightest container
    }
    if (best) overrides.set(s.span_id, best.span_id)
  }
  return overrides
}

function buildForest(spans: Span[]): Node[] {
  const parentOverride = reparentAuth51Tools(spans)
  const byId = new Map<string, Node>()
  spans.forEach((s) => byId.set(s.span_id, { ...s, depth: 0, children: [] }))
  const roots: Node[] = []
  for (const n of byId.values()) {
    const pid = parentOverride.get(n.span_id) ?? n.parent_span_id
    const p = pid ? byId.get(pid) : undefined
    if (p && p !== n) p.children.push(n)
    else roots.push(n)
  }
  const sortRec = (n: Node, d: number) => {
    n.depth = d
    n.children.sort((a, b) => (a.start_unix_nano ?? 0) - (b.start_unix_nano ?? 0))
    n.children.forEach((c) => sortRec(c, d + 1))
  }
  roots.sort((a, b) => (a.start_unix_nano ?? 0) - (b.start_unix_nano ?? 0))
  roots.forEach((r) => sortRec(r, 0))
  return roots
}

function flatten(roots: Node[], collapsed: Set<string>): Node[] {
  const out: Node[] = []
  const walk = (n: Node) => {
    out.push(n)
    if (!collapsed.has(n.span_id)) n.children.forEach(walk)
  }
  roots.forEach(walk)
  return out
}

function decodeJwt(tok: string): { header?: unknown; payload?: unknown } | null {
  try {
    const [h, p] = tok.split('.')
    const dec = (s: string) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')))
    return { header: dec(h), payload: dec(p) }
  } catch {
    return null
  }
}

function asText(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

// ── detail panel ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] uppercase tracking-wide text-c-text-3">{label}</div>
      <div className="text-[12px] text-c-text-2 break-words">{children}</div>
    </div>
  )
}

export function SpanDetail({ s }: { s: Span }) {
  const kind = kindOf(s)
  const label = attr(s, 'auth51.label')
  const decision = attr(s, 'auth51.decision.result')
  const decisionReason = attr(s, 'auth51.decision.reason')
  const tokenRaw = attr(s, 'auth51.token.raw') as string | undefined
  const claims = tokenRaw ? decodeJwt(tokenRaw)?.payload as Record<string, unknown> | undefined : undefined
  const model = attr(s, 'llm.model_name', 'llm.model')
  const pTok = attr(s, 'llm.token_count.prompt')
  const cTok = attr(s, 'llm.token_count.completion')
  const tTok = attr(s, 'llm.token_count.total')
  const input = attr(s, 'input.value')
  const output = attr(s, 'output.value')
  const [rawOpen, setRawOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2.5 text-c-text">
      <div className="flex items-center gap-2 flex-wrap">
        {kind && <span className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${KIND_STYLE[kind] ?? 'border-c-border text-c-text-2'}`}>{kind}</span>}
        <span className="text-[13px] font-medium font-mono break-all">{s.name}</span>
        <span className="text-[11px] text-c-text-3 tabular-nums">{durMs(s).toFixed(1)}ms</span>
      </div>

      {label !== undefined && <Field label="label">{String(label)}</Field>}

      {decision !== undefined && (
        <Field label="decision">
          <span className={`rounded px-1.5 py-0.5 text-[11px] ${String(decision) === 'deny' ? 'bg-c-danger/15 text-c-danger' : 'bg-c-success/15 text-c-success'}`}>
            {String(decision)}
          </span>
          {decisionReason !== undefined && <span className="ml-2 text-c-text-3">{String(decisionReason)}</span>}
        </Field>
      )}

      {claims && (
        <Field label="intent token — decoded claims">
          <div className="rounded-md border border-c-border bg-c-bg p-2 font-mono text-[11px] space-y-0.5 break-all">
            {['sub', 'aud', 'scope', 'iss', 'cnf', 'checksum', 'computed_checksum', 'iat', 'exp', 'jti'].map((k) =>
              claims[k] !== undefined ? (
                <div key={k}><span className="text-c-text-3">{k}: </span>{asText(claims[k])}</div>
              ) : null,
            )}
          </div>
        </Field>
      )}

      {tokenRaw && (
        <Field label="raw token — a real signed JWT (select-all + paste into jwt.io to verify the signature)">
          <textarea readOnly rows={3} value={tokenRaw}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-md border border-c-border bg-c-bg p-2 font-mono text-[10px] text-c-text-2 break-all resize-y" />
        </Field>
      )}

      {(model !== undefined || pTok !== undefined || cTok !== undefined) && (
        <Field label="llm">
          {model ? `${String(model)} · ` : ''}
          {pTok !== undefined ? `${pTok} in` : ''}{cTok !== undefined ? ` / ${cTok} out` : ''}
          {tTok !== undefined ? ` (${tTok} total)` : ''}
        </Field>
      )}

      {input !== undefined && (
        <Field label="input — the system prompt + state actually sent to the model (tampering shows here)">
          <pre className="max-h-[32rem] overflow-auto rounded-md border border-c-border bg-c-bg p-2 text-[11px] font-mono text-c-text-2 whitespace-pre-wrap break-words">{asText(input).slice(0, 60000)}</pre>
        </Field>
      )}
      {output !== undefined && (
        <Field label="output">
          <pre className="max-h-[32rem] overflow-auto rounded-md border border-c-border bg-c-bg p-2 text-[11px] font-mono text-c-text-2 whitespace-pre-wrap break-words">{asText(output).slice(0, 60000)}</pre>
        </Field>
      )}

      <button onClick={() => setRawOpen((v) => !v)} className="self-start text-[11px] text-c-text-3 hover:text-c-text-2">
        {rawOpen ? '▾' : '▸'} all attributes ({Object.keys(s.attributes ?? {}).length})
      </button>
      {rawOpen && (
        <div className="rounded-md border border-c-border bg-c-bg p-2 font-mono text-[10px] space-y-0.5 max-h-[32rem] overflow-auto">
          {Object.entries(s.attributes ?? {}).map(([k, v]) => (
            <div key={k} className="break-all"><span className="text-c-text-3">{k}: </span>{asText(v).slice(0, 4000)}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── waterfall ───────────────────────────────────────────────────────────────
// `showDetail=false` renders ONLY the tree (full width) and drives selection via
// `selectedId`/`onSelectSpan` — so a caller (the scenario workspace) can put two
// trees side by side and share ONE full-width detail panel below them.
export function TraceWaterfall({ spans, selectedId, onSelectSpan, showDetail = true }: {
  spans: Span[]
  selectedId?: string | null
  onSelectSpan?: (id: string | null) => void
  showDetail?: boolean
}) {
  const roots = useMemo(() => buildForest(spans), [spans])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [internalSel, setInternalSel] = useState<string | null>(null)
  const selected = onSelectSpan ? (selectedId ?? null) : internalSel
  const select = (id: string | null) => (onSelectSpan ? onSelectSpan(id) : setInternalSel(id))

  const rows = useMemo(() => flatten(roots, collapsed), [roots, collapsed])
  const t0 = useMemo(() => Math.min(...spans.map((s) => s.start_unix_nano ?? Infinity)), [spans])
  const t1 = useMemo(() => Math.max(...spans.map((s) => s.end_unix_nano ?? -Infinity)), [spans])
  const span = Math.max(t1 - t0, 1)

  if (!spans.length) {
    return <div className="text-[11px] text-c-text-3">Waiting for trace spans…</div>
  }
  const selSpan = spans.find((s) => s.span_id === selected)

  const tree = (
    <div className="rounded-md border border-c-border bg-c-bg overflow-auto">
      {rows.map((n) => {
        const kind = kindOf(n)
        const left = (((n.start_unix_nano ?? t0) - t0) / span) * 100
        const width = Math.max((durMs(n) * 1e6 / span) * 100, 0.6)
        const hasKids = n.children.length > 0
        const isSel = n.span_id === selected
        return (
          <div key={n.span_id}
            onClick={() => select(n.span_id)}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer border-b border-c-border/50 ${isSel ? 'bg-c-accent/10' : 'hover:bg-c-surface-2'}`}>
            <div className="flex items-center gap-1 min-w-0" style={{ paddingLeft: n.depth * 12 }}>
              {hasKids ? (
                <button onClick={(e) => { e.stopPropagation(); setCollapsed((c) => { const x = new Set(c); if (x.has(n.span_id)) x.delete(n.span_id); else x.add(n.span_id); return x }) }}
                  className="text-[10px] text-c-text-3 w-3">{collapsed.has(n.span_id) ? '▸' : '▾'}</button>
              ) : <span className="w-3" />}
              {kind && <span className={`shrink-0 rounded border px-1 text-[9px] font-mono ${KIND_STYLE[kind] ?? 'border-c-border text-c-text-3'}`}>{kind}</span>}
              <span className="truncate text-[11px] font-mono text-c-text-2" title={n.name}>{n.name}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0 w-[38%] min-w-[120px]">
              <div className="relative h-2 flex-1 rounded bg-c-surface-2">
                <div className={`absolute h-2 rounded ${kind === 'rs' ? 'bg-c-success' : kind && KIND_STYLE[kind] ? 'bg-c-accent' : 'bg-c-text-3/50'}`}
                  style={{ left: `${left}%`, width: `${width}%` }} />
              </div>
              <span className="text-[10px] text-c-text-3 tabular-nums w-12 text-right">{durMs(n).toFixed(0)}ms</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  if (!showDetail) return tree

  return (
    <div className="grid grid-cols-[1fr] gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {tree}
      <div className="rounded-md border border-c-border bg-c-surface-2 p-3 overflow-auto max-h-[70vh]">
        {selSpan ? <SpanDetail s={selSpan} /> : <div className="text-[11px] text-c-text-3">Select a span to inspect its tokens, mint/DPoP/RS hops, and attributes.</div>}
      </div>
    </div>
  )
}
