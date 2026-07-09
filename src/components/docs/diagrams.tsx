/**
 * Theme-aware inline SVG diagrams for the docs. Server-safe (no client JS).
 *
 * Colors reference the c-* CSS custom properties via rgb(var(--c-…)) in inline
 * styles — inline SVG inherits the page's custom properties, so these follow
 * light/dark automatically. Style calibrated to the box-and-arrow figures in
 * draft-goswami-agentic-jwt.
 */

const ink = 'rgb(var(--c-text))'
const ink2 = 'rgb(var(--c-text-2))'
const ink3 = 'rgb(var(--c-text-3))'
const line = 'rgb(var(--c-border-2))'
const surface = 'rgb(var(--c-surface))'
const surface2 = 'rgb(var(--c-surface-2))'
const accent = 'rgb(var(--c-accent))'
const accentFaint = 'rgb(var(--c-accent) / 0.10)'
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace'
const sans = 'inherit'

/** Inputs → canonicalize → SHA3-512 → checksum. The identity fingerprint. */
export function ChecksumDiagram() {
  const inputs = [
    { y: 14, label: 'System prompt', sub: 'the instructions' },
    { y: 70, label: 'Tool interfaces', sub: 'names, signatures, code' },
    { y: 126, label: 'LLM config', sub: 'model, params' },
  ]
  return (
    <svg viewBox="0 0 720 196" width="100%" role="img" aria-label="Agent checksum computation" style={{ maxWidth: 720 }}>
      {/* input boxes */}
      {inputs.map((it) => (
        <g key={it.label}>
          <rect x="8" y={it.y} width="176" height="44" rx="8" style={{ fill: surface, stroke: line }} strokeWidth="1" />
          <text x="20" y={it.y + 20} style={{ fill: ink, font: `600 12px ${sans}` }}>{it.label}</text>
          <text x="20" y={it.y + 35} style={{ fill: ink3, font: `11px ${mono}` }}>{it.sub}</text>
          {/* connector into the canonicalize box */}
          <path d={`M184 ${it.y + 22} H236`} style={{ stroke: line }} strokeWidth="1.5" fill="none" />
        </g>
      ))}

      {/* canonicalize */}
      <rect x="236" y="52" width="150" height="70" rx="8" style={{ fill: surface2, stroke: line }} strokeWidth="1" />
      <text x="311" y="82" textAnchor="middle" style={{ fill: ink, font: `600 12px ${sans}` }}>Canonicalize</text>
      <text x="311" y="99" textAnchor="middle" style={{ fill: ink3, font: `10.5px ${mono}` }}>AST · sort · strip</text>
      <path d="M386 87 H438" style={{ stroke: line }} strokeWidth="1.5" fill="none" markerEnd="url(#ck-arrow)" />

      {/* hash */}
      <rect x="438" y="52" width="130" height="70" rx="8" style={{ fill: accentFaint, stroke: accent }} strokeWidth="1.25" />
      <text x="503" y="82" textAnchor="middle" style={{ fill: ink, font: `600 12px ${sans}` }}>SHA3-512</text>
      <text x="503" y="99" textAnchor="middle" style={{ fill: ink3, font: `10.5px ${mono}` }}>one-way hash</text>
      <path d="M568 87 H616" style={{ stroke: line }} strokeWidth="1.5" fill="none" markerEnd="url(#ck-arrow)" />

      {/* checksum output */}
      <rect x="616" y="60" width="96" height="54" rx="8" style={{ fill: surface, stroke: accent }} strokeWidth="1.25" />
      <text x="664" y="83" textAnchor="middle" style={{ fill: ink2, font: `10px ${mono}` }}>checksum</text>
      <text x="664" y="99" textAnchor="middle" style={{ fill: ink, font: `600 12px ${mono}` }}>a7f3…9c</text>

      <defs>
        <marker id="ck-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" style={{ fill: line }} />
        </marker>
      </defs>
    </svg>
  )
}

/**
 * DPoP sender-constraint (draft §4.4.2, RFC 9449). Two phases: at mint, the
 * agent's public-key thumbprint is stamped into the token as cnf.jkt; at use,
 * the agent signs a proof with the private key and the resource matches the two.
 */
export function DPoPBindingDiagram() {
  return (
    <svg viewBox="0 0 720 268" width="100%" role="img" aria-label="DPoP proof-of-possession binding" style={{ maxWidth: 720 }}>
      {/* ---- phase 1: mint ---- */}
      <text x="8" y="16" style={{ fill: ink3, font: `600 10.5px ${mono}` }}>1 · AT MINT</text>

      {/* agent process */}
      <rect x="8" y="26" width="188" height="74" rx="8" style={{ fill: surface, stroke: line }} strokeWidth="1" />
      <text x="20" y="46" style={{ fill: ink, font: `600 12px ${sans}` }}>Agent process</text>
      <text x="20" y="64" style={{ fill: ink2, font: `11px ${mono}` }}>private key — stays</text>
      <text x="20" y="80" style={{ fill: ink2, font: `11px ${mono}` }}>public key → thumbprint</text>

      {/* arrow to authority */}
      <path d="M196 63 H262" style={{ stroke: line }} strokeWidth="1.5" fill="none" markerEnd="url(#dpop-arrow)" />
      <text x="200" y="55" style={{ fill: ink3, font: `10px ${mono}` }}>jkt</text>

      {/* authority */}
      <rect x="262" y="34" width="150" height="58" rx="8" style={{ fill: surface2, stroke: line }} strokeWidth="1" />
      <text x="337" y="59" textAnchor="middle" style={{ fill: ink, font: `600 12px ${sans}` }}>Authority</text>
      <text x="337" y="76" textAnchor="middle" style={{ fill: ink3, font: `10.5px ${mono}` }}>mints & stamps</text>

      <path d="M412 63 H478" style={{ stroke: line }} strokeWidth="1.5" fill="none" markerEnd="url(#dpop-arrow)" />

      {/* intent token */}
      <rect x="478" y="34" width="234" height="58" rx="8" style={{ fill: accentFaint, stroke: accent }} strokeWidth="1.25" />
      <text x="494" y="57" style={{ fill: ink, font: `600 12px ${sans}` }}>Intent token</text>
      <text x="494" y="76" style={{ fill: ink2, font: `11.5px ${mono}` }}>cnf.jkt = thumbprint</text>

      {/* divider */}
      <line x1="8" y1="128" x2="712" y2="128" style={{ stroke: line }} strokeWidth="1" strokeDasharray="2 5" />

      {/* ---- phase 2: use ---- */}
      <text x="8" y="156" style={{ fill: ink3, font: `600 10.5px ${mono}` }}>2 · TO CALL A RESOURCE</text>

      {/* agent signs proof */}
      <rect x="8" y="168" width="188" height="74" rx="8" style={{ fill: surface, stroke: line }} strokeWidth="1" />
      <text x="20" y="188" style={{ fill: ink, font: `600 12px ${sans}` }}>Agent process</text>
      <text x="20" y="206" style={{ fill: ink2, font: `11px ${mono}` }}>signs DPoP proof</text>
      <text x="20" y="222" style={{ fill: ink3, font: `11px ${mono}` }}>with private key</text>

      {/* arrow carrying token + proof */}
      <path d="M196 205 H430" style={{ stroke: accent }} strokeWidth="1.5" fill="none" markerEnd="url(#dpop-arrow-a)" />
      <text x="212" y="197" style={{ fill: ink2, font: `10.5px ${mono}` }}>intent token + proof</text>

      {/* resource server */}
      <rect x="430" y="168" width="282" height="74" rx="8" style={{ fill: surface2, stroke: line }} strokeWidth="1" />
      <text x="446" y="188" style={{ fill: ink, font: `600 12px ${sans}` }}>Resource server</text>
      <text x="446" y="206" style={{ fill: ink2, font: `11px ${mono}` }}>token valid?</text>
      <text x="446" y="222" style={{ fill: ink2, font: `11px ${mono}` }}>proof key == cnf.jkt?  →  accept</text>

      <defs>
        <marker id="dpop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" style={{ fill: line }} />
        </marker>
        <marker id="dpop-arrow-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" style={{ fill: accent }} />
        </marker>
      </defs>
    </svg>
  )
}

/**
 * Anatomy of an intent token (draft §4.4.2). Grouped JWT claims — identity,
 * lifetime, key binding, the intent object, and the agent proof. Illustrative,
 * not a live token.
 */
export function IntentTokenAnatomy() {
  const groups: { label: string; rows: [string, string][] }[] = [
    { label: 'who & where', rows: [
      ['sub', 'the agent — its checksum identity'],
      ['aud', 'the single resource it is for'],
      ['iss', 'the authority that minted it'],
    ] },
    { label: 'lifetime', rows: [
      ['iat / exp', 'valid ~5 minutes  (exp = iat + 300s)'],
      ['jti', 'unique id — a replay is detected'],
    ] },
    { label: 'binding', rows: [
      ['cnf.jkt', 'DPoP key thumbprint — sender-constrained'],
    ] },
    { label: 'intent { }', rows: [
      ['workflow_step', 'the one action this token authorizes'],
      ['delegation_chain', 'hash of who delegated to whom'],
      ['step_sequence_hash', 'hash of the steps completed so far'],
    ] },
    { label: 'agent_proof { }', rows: [
      ['agent_checksum', 'the verified fingerprint'],
      ['registration_id', 'handle for revocation'],
    ] },
  ]

  type El = { kind: 'group'; label: string; y: number } | { kind: 'row'; k: string; v: string; y: number }
  const els: El[] = []
  let y = 52
  for (const g of groups) {
    els.push({ kind: 'group', label: g.label, y })
    y += 22
    for (const [k, v] of g.rows) {
      els.push({ kind: 'row', k, v, y })
      y += 21
    }
    y += 9
  }
  const H = y + 8

  return (
    <svg viewBox={`0 0 720 ${H}`} width="100%" role="img" aria-label="Intent token claim structure" style={{ maxWidth: 720 }}>
      {/* card */}
      <rect x="40" y="8" width="640" height={H - 16} rx="12" style={{ fill: surface, stroke: line }} strokeWidth="1" />
      {/* header strip */}
      <text x="64" y="34" style={{ fill: ink, font: `600 13px ${sans}` }}>intent token</text>
      <text x="150" y="34" style={{ fill: ink3, font: `11px ${mono}` }}>· JWT (RFC 7519)</text>
      <rect x="556" y="21" width="104" height="20" rx="10" style={{ fill: accentFaint, stroke: accent }} strokeWidth="1" />
      <text x="608" y="35" textAnchor="middle" style={{ fill: ink2, font: `10px ${mono}` }}>DPoP-bound</text>
      <line x1="64" y1="42" x2="656" y2="42" style={{ stroke: line }} strokeWidth="1" />

      {els.map((el) =>
        el.kind === 'group' ? (
          <text key={`g-${el.y}`} x="64" y={el.y} style={{ fill: accent, font: `600 10px ${mono}`, letterSpacing: '0.06em' }}>
            {el.label.toUpperCase()}
          </text>
        ) : (
          <g key={`r-${el.y}`}>
            <text x="80" y={el.y} style={{ fill: ink, font: `600 12px ${mono}` }}>{el.k}</text>
            <text x="248" y={el.y} style={{ fill: ink2, font: `12px ${sans}` }}>{el.v}</text>
          </g>
        )
      )}
    </svg>
  )
}

/** The A–F abstract protocol flow (draft §3.2), redrawn cleanly and theme-aware. */
export function ProtocolFlowDiagram() {
  const actors = [
    { x: 24, label: 'Client', sub: 'agent + embed' },
    { x: 300, label: 'Authorization Server', sub: 'auth51 authority' },
    { x: 576, label: 'Resource Server', sub: 'the API' },
  ]
  const W = 130
  return (
    <svg viewBox="0 0 720 240" width="100%" role="img" aria-label="Agentic JWT protocol flow" style={{ maxWidth: 720 }}>
      {actors.map((a) => (
        <g key={a.label}>
          <rect x={a.x} y="14" width={W} height="48" rx="8" style={{ fill: surface2, stroke: line }} strokeWidth="1" />
          <text x={a.x + W / 2} y="36" textAnchor="middle" style={{ fill: ink, font: `600 12px ${sans}` }}>{a.label}</text>
          <text x={a.x + W / 2} y="51" textAnchor="middle" style={{ fill: ink3, font: `10.5px ${mono}` }}>{a.sub}</text>
          {/* lifeline */}
          <line x1={a.x + W / 2} y1="62" x2={a.x + W / 2} y2="228" style={{ stroke: line }} strokeWidth="1" strokeDasharray="3 4" />
        </g>
      ))}

      {/* messages */}
      {[
        { y: 92, x1: 89, x2: 365, label: 'C · request intent token (agent_checksum grant)', dir: 1 },
        { y: 128, x1: 365, x2: 89, label: 'D · intent token — short-lived, DPoP-bound', dir: -1 },
        { y: 176, x1: 89, x2: 641, label: 'E · call resource, present intent token', dir: 1 },
        { y: 212, x1: 641, x2: 89, label: 'F · protected resource', dir: -1 },
      ].map((m) => (
        <g key={m.label}>
          <path d={`M${m.x1} ${m.y} H${m.x2}`} style={{ stroke: accent }} strokeWidth="1.5" fill="none" markerEnd="url(#pf-arrow)" />
          <text x={m.dir === 1 ? m.x1 + 6 : m.x2 + 6} y={m.y - 6} style={{ fill: ink2, font: `11px ${mono}` }}>{m.label}</text>
        </g>
      ))}

      <defs>
        <marker id="pf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" style={{ fill: accent }} />
        </marker>
      </defs>
    </svg>
  )
}
