'use client'

/**
 * Control Plane architecture poster.
 *
 * Visual: Authority at the top center (control plane), Console + CLI flanking
 * above the line, Runtime + Verifier below the line on the data plane.
 * Routing is orthogonal — sharp L-shaped paths, not curves. Labels sit on
 * the rails, never on top of an arrow, with generous spacing so nothing
 * collides.
 */
export function ControlPlaneDiagram() {
  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 880 560"
        className="w-full h-auto"
        role="img"
        aria-label="Auth51 control plane architecture"
      >
        <defs>
          {/* Soft fills */}
          <linearGradient id="boxFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.22)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.04)" />
          </linearGradient>
          <linearGradient id="authorityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(129, 140, 248, 0.38)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.08)" />
          </linearGradient>
          {/* Edge gradients */}
          <linearGradient id="edgeGradH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(165, 180, 252, 0.85)" />
            <stop offset="100%" stopColor="rgba(129, 140, 248, 0.55)" />
          </linearGradient>
          <linearGradient id="edgeGradV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(165, 180, 252, 0.85)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.45)" />
          </linearGradient>
          {/* Arrowhead */}
          <marker
            id="arr"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(165, 180, 252, 0.95)" />
          </marker>
          {/* Premium drop shadow for boxes */}
          <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dx="0" dy="4" result="off" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.55" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Authority glow */}
          <radialGradient id="authGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(129,140,248,0.30)" />
            <stop offset="100%" stopColor="rgba(129,140,248,0)" />
          </radialGradient>
        </defs>

        {/* Backdrop grid */}
        <g opacity="0.14">
          {Array.from({ length: 19 }, (_, i) => (
            <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="560" stroke="#2e3036" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 48} x2="880" y2={i * 48} stroke="#2e3036" strokeWidth="0.5" />
          ))}
        </g>

        {/* Authority ambient glow */}
        <ellipse cx="440" cy="120" rx="260" ry="120" fill="url(#authGlow)" />

        {/* Plane labels */}
        <text x="28" y="56" fill="#5c6168" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="2.5">
          CONTROL PLANE
        </text>
        <text x="28" y="332" fill="#5c6168" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="2.5">
          DATA PLANE
        </text>

        {/* Dividing rail between planes */}
        <line x1="28" y1="300" x2="852" y2="300" stroke="rgba(99,102,241,0.25)" strokeWidth="1" strokeDasharray="2 5" />

        {/* ───────────────────── Edges (drawn first so boxes sit on top) ───────────────────── */}

        {/* Console → Authority (horizontal, top row) — label above so shaft is unbroken */}
        <OrthoEdge points={[[224, 130], [316, 130]]} />
        <EdgeLabel x={270} y={106} text="RFC 8693" />

        {/* CLI ← Authority (horizontal, top row) */}
        <OrthoEdge points={[[656, 130], [564, 130]]} />
        <EdgeLabel x={610} y={106} text="OAuth 2.0" />

        {/* Authority → Runtime (down then left) — label sits in the bend's quiet quadrant */}
        <OrthoEdge points={[[400, 204], [400, 260], [240, 260], [240, 376]]} />
        <EdgeLabel x={320} y={244} text="register · mint" />

        {/* Authority → Verifier (down then right) */}
        <OrthoEdge points={[[480, 204], [480, 260], [640, 260], [640, 376]]} />
        <EdgeLabel x={560} y={244} text="verify · enforce" />

        {/* Runtime → Verifier (horizontal, bottom row) — label above the line */}
        <OrthoEdge points={[[344, 434], [536, 434]]} />
        <EdgeLabel x={438} y={418} text="intent token" />

        {/* ───────────────────── Boxes ───────────────────── */}

        {/* Top row: Console — Authority — CLI */}
        <Box x={60}  y={92}  w={160} h={76} title="Console"    subtitle="auth51.com/console"        badge="web" />
        <Box x={320} y={72}  w={240} h={128} title="Authority"  subtitle="ReplicaSet · 3+ replicas"  badge="control" featured />
        <Box x={660} y={92}  w={160} h={76} title="a51 CLI"     subtitle="local binary"              badge="cli" />

        {/* Bottom row: Runtime — Verifier */}
        <Box x={140} y={380} w={200} h={108} title="Runtime"  subtitle="in-process library on every agent" badge="data" />
        <Box x={540} y={380} w={200} h={108} title="Verifier" subtitle="sidecar · DaemonSet · gateway"     badge="data" />

        {/* Agentic application backdrop */}
        <rect
          x="120" y="510" width="640" height="34" rx="10"
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(46,48,54,0.9)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <text
          x="440" y="532" textAnchor="middle"
          fill="#8a8f98" fontSize="11"
          fontFamily="ui-monospace, monospace" letterSpacing="1.5"
        >
          AGENTIC APPLICATION
        </text>
      </svg>

      <style jsx>{`
        @keyframes flow {
          to { stroke-dashoffset: -18; }
        }
        :global(.cp-edge) {
          stroke-dasharray: 6 6;
          animation: flow 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

// ── Atoms ─────────────────────────────────────────────────────────────────

function Box({
  x, y, w, h, title, subtitle, badge, featured,
}: {
  x: number; y: number; w: number; h: number
  title: string; subtitle: string; badge?: string; featured?: boolean
}) {
  return (
    <g filter="url(#boxShadow)">
      <rect
        x={x} y={y} width={w} height={h} rx={12}
        fill={featured ? 'url(#authorityFill)' : 'url(#boxFill)'}
        stroke={featured ? 'rgba(165,180,252,0.7)' : 'rgba(99,102,241,0.4)'}
        strokeWidth={featured ? 1.5 : 1}
      />
      {/* Inner highlight */}
      <rect
        x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={11.5}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
      <text
        x={x + 16} y={y + 28}
        fill="#ffffff"
        fontSize={featured ? 17 : 15}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        {title}
      </text>
      <text
        x={x + 16} y={y + 48}
        fill="#b6bbc5"
        fontSize="11.5"
        fontFamily="Inter, sans-serif"
      >
        {subtitle}
      </text>
      {badge && (
        <g>
          <rect
            x={x + w - 62} y={y + 14}
            width="48" height="18" rx="4"
            fill="rgba(99,102,241,0.22)"
            stroke="rgba(129,140,248,0.45)"
            strokeWidth="1"
          />
          <text
            x={x + w - 38} y={y + 26.5} textAnchor="middle"
            fill="#a5b4fc" fontSize="9"
            fontFamily="ui-monospace, monospace" letterSpacing="1.2"
          >
            {badge.toUpperCase()}
          </text>
        </g>
      )}
      {/* Authority replica chiclets */}
      {featured && (
        <g>
          <circle cx={x + 22} cy={y + h - 22} r="4" fill="#34d399" />
          <circle cx={x + 36} cy={y + h - 22} r="4" fill="#34d399" />
          <circle cx={x + 50} cy={y + h - 22} r="4" fill="#34d399" />
          <text
            x={x + 64} y={y + h - 18}
            fill="#8a8f98" fontSize="11"
            fontFamily="ui-monospace, monospace"
          >
            3/3 healthy
          </text>
        </g>
      )}
    </g>
  )
}

/**
 * Orthogonal poly-line edge. Builds an L-shape (or multi-segment L) from a
 * list of corner points, with the arrowhead on the last segment. Sharp
 * corners — no Bézier curves.
 */
function OrthoEdge({ points }: { points: Array<[number, number]> }) {
  if (points.length < 2) return null
  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const horizontal = prev[1] === last[1]
  const stroke = horizontal ? 'url(#edgeGradH)' : 'url(#edgeGradV)'
  const d = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      markerEnd="url(#arr)"
      className="cp-edge"
    />
  )
}

function EdgeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 6.6 + 14
  return (
    <g>
      <rect
        x={x - w / 2} y={y - 10}
        width={w} height="18" rx="4"
        fill="rgba(14,15,18,0.92)"
        stroke="rgba(99,102,241,0.35)"
        strokeWidth="0.75"
      />
      <text
        x={x} y={y + 3} textAnchor="middle"
        fill="#c7d2fe" fontSize="10"
        fontFamily="ui-monospace, monospace" letterSpacing="0.5"
      >
        {text}
      </text>
    </g>
  )
}
