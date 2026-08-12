'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'

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

/** Pull the SYSTEM message out of an LLM span's `input.value` (the LangChain
 *  messages payload) so the operator sees the exact system prompt sent to the model
 *  — which is where prompt-injection tampering shows up — without digging through a
 *  giant JSON blob. Returns null for non-LLM spans (e.g. a delegation's state dict). */
function extractSystemPrompt(inputValue: unknown): string | null {
  let obj: unknown = inputValue
  if (typeof inputValue === 'string') {
    try { obj = JSON.parse(inputValue) } catch { return null }
  }
  let msgs: unknown = (obj as { messages?: unknown } | null)?.messages
  if (Array.isArray(msgs) && Array.isArray(msgs[0])) msgs = msgs[0] // langchain nests
  if (!Array.isArray(msgs)) return null
  for (const m of msgs) {
    const mm = m as { kwargs?: { type?: string; content?: unknown }; type?: string; content?: unknown; id?: unknown }
    const idArr = Array.isArray(mm.id) ? (mm.id as unknown[]) : []
    const typeStr = String(mm.kwargs?.type ?? mm.type ?? (idArr.length ? idArr[idArr.length - 1] : '')).toLowerCase()
    const content = mm.kwargs?.content ?? mm.content
    if (typeStr.includes('system') && typeof content === 'string') return content
  }
  return null
}

// ── real in-browser signature verification (the "this is a real backend" proof) ──
function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

type VerifyResult = {
  ok: boolean; alg?: string; kid?: string; iss?: string; jwksUrl?: string; reason?: string
  header?: unknown; payload?: unknown; jwk?: JsonWebKey
}

function decodeSeg(seg: string): unknown {
  try { return JSON.parse(new TextDecoder().decode(b64urlToBytes(seg))) } catch { return undefined }
}

/** Decode a JWT AND verify its signature entirely in the browser: pull the
 *  Authority's PUBLIC JWKS (via a thin proxy) and check the signature with Web
 *  Crypto. If `ok`, the token was really signed by the Authority's private key — no
 *  simulation can forge that, and jwt.io can't do the JWKS half automatically. */
async function verifyJwtSignature(token: string): Promise<VerifyResult> {
  try {
    const [h, p, sig] = token.split('.')
    if (!h || !p || !sig) return { ok: false, reason: 'not a JWT' }
    const header = decodeSeg(h) as { alg?: string; kid?: string } | undefined
    const payload = decodeSeg(p) as { iss?: string } | undefined
    const alg = header?.alg, kid = header?.kid, iss = payload?.iss
    const base = { header, payload, alg, kid, iss }
    if (!iss) return { ok: false, ...base, reason: 'token has no iss claim' }
    const res = await fetch(`/api/cp/jwks?iss=${encodeURIComponent(iss)}`, { cache: 'no-store' })
    const data = await res.json() as { jwks?: { keys?: JsonWebKey[] }; jwks_url?: string; error?: string }
    if (!res.ok) return { ok: false, ...base, jwksUrl: data.jwks_url, reason: data.error || 'JWKS fetch failed' }
    const keys = data.jwks?.keys ?? []
    const jwk = keys.find((k) => (k as { kid?: string }).kid === kid) ?? keys[0]
    if (!jwk) return { ok: false, ...base, jwksUrl: data.jwks_url, reason: 'no key in JWKS' }
    const isEc = alg === 'ES256' || (jwk as { kty?: string }).kty === 'EC'
    const importAlg: EcKeyImportParams | RsaHashedImportParams = isEc
      ? { name: 'ECDSA', namedCurve: 'P-256' }
      : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    const verifyAlg: EcdsaParams | AlgorithmIdentifier = isEc
      ? { name: 'ECDSA', hash: 'SHA-256' }
      : { name: 'RSASSA-PKCS1-v1_5' }
    const key = await crypto.subtle.importKey('jwk', jwk, importAlg, false, ['verify'])
    const ok = await crypto.subtle.verify(
      verifyAlg, key,
      b64urlToBytes(sig) as unknown as BufferSource,
      new TextEncoder().encode(`${h}.${p}`) as unknown as BufferSource)
    return { ok, ...base, jwksUrl: data.jwks_url, jwk }
  } catch (e) {
    return { ok: false, reason: String(e) }
  }
}

// ── token inspector modal: decode (like jwt.io) + live JWKS signature verify ──
function InspectorBlock({ title, value }: { title: string; value: unknown }) {
  if (value === undefined) return null
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-c-text-3 mb-0.5">{title}</div>
      <pre className="max-h-72 overflow-auto rounded-md border border-c-border bg-c-surface-2 p-2 text-[11px] font-mono text-c-text-2 whitespace-pre-wrap break-words">{asText(value)}</pre>
    </div>
  )
}

function TokenInspector({ token, kind, onClose }: { token: string; kind: string; onClose: () => void }) {
  const [r, setR] = useState<VerifyResult | null>(null)
  const label = kind === 'oauth' ? 'OAuth bearer token' : 'Intent token'
  useEffect(() => {
    let cancelled = false
    verifyJwtSignature(token).then((res) => { if (!cancelled) setR(res) })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { cancelled = true; window.removeEventListener('keydown', onKey) }
  }, [token, onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-4" onClick={onClose}>
      <div className="my-6 w-full max-w-3xl rounded-xl border border-c-border bg-c-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-c-border px-4 py-2.5">
          <span className="text-[13px] font-semibold text-c-text">{label} — decode &amp; verify</span>
          <div className="flex items-center gap-3">
            <a href={`https://jwt.io/#debugger-io?token=${encodeURIComponent(token)}`} target="_blank" rel="noreferrer"
              className="text-[11px] text-c-accent hover:underline">open in jwt.io ↗</a>
            <button onClick={onClose} className="text-[16px] leading-none text-c-text-2 hover:text-c-text">×</button>
          </div>
        </div>
        <div className="max-h-[80vh] space-y-3 overflow-auto p-4">
          {r === null ? (
            <div className="text-[12px] text-c-text-3">Fetching the Authority’s public keys and verifying the signature…</div>
          ) : (
            <div className={`rounded-md border px-3 py-2 text-[12px] ${r.ok ? 'border-c-success/40 bg-c-success/10 text-c-success' : 'border-c-danger/40 bg-c-danger/10 text-c-danger'}`}>
              {r.ok
                ? <>✓ <b>Signature verified</b> — really signed by the Authority’s private key ({r.alg}, kid {String(r.kid)}).</>
                : <>✗ {r.reason || 'signature did not verify'}</>}
              {r.jwksUrl && <div className="mt-0.5 break-all font-mono text-[10px] text-c-text-3">public keys fetched live from {r.jwksUrl}</div>}
              <div className="mt-0.5 text-[10px] text-c-text-3">This JWKS step is the part jwt.io can’t do for you — verified against the issuer’s live keys, not a pasted one.</div>
            </div>
          )}
          <InspectorBlock title="Header" value={r?.header} />
          <InspectorBlock title="Payload (claims)" value={r?.payload} />
          {r?.jwk && <InspectorBlock title={`Public key used (JWK, kid ${String((r.jwk as { kid?: string }).kid ?? '')})`} value={r.jwk} />}
        </div>
      </div>
    </div>
  )
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
  const sysPrompt = input !== undefined ? extractSystemPrompt(input) : null
  const [rawOpen, setRawOpen] = useState(false)
  const [inspect, setInspect] = useState(false)
  // Token label is mode-aware: the mint hop carries an INTENT token; the oauth hop
  // carries a plain OAuth bearer.
  const tokenWord = kind === 'oauth' ? 'OAuth token' : 'intent token'

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
        <Field label={`${tokenWord} — decoded claims`}>
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
        <Field label={`raw ${tokenWord} — a real signed JWT`}>
          <textarea readOnly rows={3} value={tokenRaw}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-md border border-c-border bg-c-bg p-2 font-mono text-[10px] text-c-text-2 break-all resize-y" />
          <button
            onClick={() => setInspect(true)}
            className="mt-1.5 rounded-md border border-c-accent/50 px-2.5 py-1 text-[11px] text-c-accent hover:bg-c-accent/10">
            Inspect &amp; verify token
          </button>
          {inspect && <TokenInspector token={tokenRaw} kind={kind} onClose={() => setInspect(false)} />}
        </Field>
      )}

      {(model !== undefined || pTok !== undefined || cTok !== undefined) && (
        <Field label="llm">
          {model ? `${String(model)} · ` : ''}
          {pTok !== undefined ? `${pTok} in` : ''}{cTok !== undefined ? ` / ${cTok} out` : ''}
          {tTok !== undefined ? ` (${tTok} total)` : ''}
        </Field>
      )}

      {sysPrompt !== null && (
        <Field label="system prompt sent to the model — the identity the embed hashes (prompt-injection tampering shows HERE)">
          <pre className="max-h-[32rem] overflow-auto rounded-md border border-c-danger/40 bg-c-danger/5 p-2 text-[11px] font-mono text-c-text whitespace-pre-wrap break-words">{sysPrompt.slice(0, 60000)}</pre>
        </Field>
      )}
      {input !== undefined && (
        <Field label={sysPrompt !== null ? 'raw input (full messages + state)' : 'input — state / messages sent to the model'}>
          <pre className="max-h-80 overflow-auto rounded-md border border-c-border bg-c-bg p-2 text-[11px] font-mono text-c-text-2 whitespace-pre-wrap break-words">{asText(input).slice(0, 60000)}</pre>
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
// `showDetail=false` renders the tree with INLINE expansion — clicking a span opens
// its detail right beneath it, so it's never off-screen and two trees can sit side by
// side and each be inspected in place. `selectedId`/`onSelectSpan` optionally lift
// selection; omit them for independent inline selection (the default, per instance).
export function TraceWaterfall({ spans, selectedId, onSelectSpan, showDetail = true, highlightAgents }: {
  spans: Span[]
  selectedId?: string | null
  onSelectSpan?: (id: string | null) => void
  showDetail?: boolean
  highlightAgents?: Set<string> // agent ids tampered this run — flag their spans
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
          <Fragment key={n.span_id}>
            <div
              onClick={() => select(isSel ? null : n.span_id)}
              className={`flex items-center gap-2 px-2 py-1 cursor-pointer border-b border-c-border/50 ${isSel ? 'bg-c-accent/10' : 'hover:bg-c-surface-2'}`}>
              <div className="flex items-center gap-1 min-w-0" style={{ paddingLeft: n.depth * 12 }}>
                {hasKids ? (
                  <button onClick={(e) => { e.stopPropagation(); setCollapsed((c) => { const x = new Set(c); if (x.has(n.span_id)) x.delete(n.span_id); else x.add(n.span_id); return x }) }}
                    className="text-[10px] text-c-text-3 w-3">{collapsed.has(n.span_id) ? '▸' : '▾'}</button>
                ) : <span className="w-3" />}
                {!showDetail && <span className="text-[10px] text-c-text-3 w-3">{isSel ? '▾' : '▸'}</span>}
                {kind && <span className={`shrink-0 rounded border px-1 text-[9px] font-mono ${KIND_STYLE[kind] ?? 'border-c-border text-c-text-3'}`}>{kind}</span>}
                {highlightAgents && (highlightAgents.has(n.name ?? '') || highlightAgents.has(String(attr(n, 'auth51.agent_id') ?? ''))) && (
                  <span title="Tampered for this run — its system prompt is on the consult_llm/ChatOpenAI span below" className="shrink-0 text-c-danger">●</span>
                )}
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
            {/* Inline expansion: the detail opens right under the span you clicked, so
                it's never off-screen and you can open the matching span in BOTH lanes. */}
            {!showDetail && isSel && (
              <div className="border-b border-c-border bg-c-surface-2 px-3 py-3 max-h-[70vh] overflow-auto">
                <SpanDetail s={n} />
              </div>
            )}
          </Fragment>
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
