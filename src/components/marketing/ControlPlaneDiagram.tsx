'use client'

/**
 * Control Plane architecture poster.
 *
 * Visual: Authority at the top (control plane), Console + CLI flanking
 * above-line, Runtime + Verifier below the line (data plane). Tokens
 * flow downward along edges with a subtle dashed-stroke animation.
 *
 * Pure SVG with CSS animations — no images, no canvas, no JS.
 */
export function ControlPlaneDiagram() {
  return (
    <div className="relative w-full">
      <svg viewBox="0 0 720 460" className="w-full h-auto" role="img" aria-label="Auth51 control plane architecture">
        <defs>
          <linearGradient id="boxFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.18)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.04)" />
          </linearGradient>
          <linearGradient id="authorityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(129, 140, 248, 0.30)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.10)" />
          </linearGradient>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(165, 180, 252, 0.7)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.2)" />
          </linearGradient>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(165, 180, 252, 0.7)" />
          </marker>
        </defs>

        {/* Backdrop grid */}
        <g opacity="0.18">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="460" stroke="#2e3036" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 48} x2="720" y2={i * 48} stroke="#2e3036" strokeWidth="0.5" />
          ))}
        </g>

        {/* Plane labels */}
        <text x="20" y="50" fill="#5c6168" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="2">CONTROL PLANE</text>
        <text x="20" y="290" fill="#5c6168" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="2">DATA PLANE</text>

        {/* Dividing line between planes */}
        <line x1="20" y1="260" x2="700" y2="260" stroke="rgba(46,48,54,0.8)" strokeWidth="1" strokeDasharray="2 4" />

        {/* ── Top row: Console — Authority — CLI ── */}
        <Box x={60}  y={70}  w={170} h={68} title="Console" subtitle="auth51.com/console" badge="web" />
        <Box x={275} y={60}  w={170} h={86} title="Authority"   subtitle="ReplicaSet · 3+ replicas" badge="control" featured />
        <Box x={490} y={70}  w={170} h={68} title="a51 CLI"      subtitle="local binary" badge="cli" />

        {/* ── Bottom row: Runtime — Verifier ── */}
        <Box x={130} y={310} w={200} h={86} title="Runtime"  subtitle="in-process library on every agent" badge="data" />
        <Box x={390} y={310} w={200} h={86} title="Verifier" subtitle="sidecar / DaemonSet / gateway" badge="data" />

        {/* ── Animated edges ── */}
        {/* Console ↔ Authority */}
        <AnimatedEdge d="M 230 104 Q 252 104, 275 104" />
        {/* CLI ↔ Authority */}
        <AnimatedEdge d="M 490 104 Q 468 104, 445 104" reverse />
        {/* Authority → Runtime */}
        <AnimatedEdge d="M 340 146 Q 340 220, 230 310" />
        {/* Authority → Verifier */}
        <AnimatedEdge d="M 400 146 Q 400 220, 490 310" />
        {/* Runtime ↔ Verifier (agent calls flow through verifier) */}
        <AnimatedEdge d="M 330 353 Q 360 353, 390 353" />

        {/* Edge labels */}
        <EdgeLabel x={252} y={94}  text="RFC 8693" />
        <EdgeLabel x={462} y={94}  text="OAuth" />
        <EdgeLabel x={252} y={240} text="register · mint" />
        <EdgeLabel x={478} y={240} text="verify · enforce" />
        <EdgeLabel x={360} y={343} text="intent token" />

        {/* Agentic application backdrop */}
        <rect x="130" y="416" width="460" height="32" rx="8"
              fill="rgba(255,255,255,0.02)" stroke="rgba(46,48,54,0.8)" strokeWidth="1" strokeDasharray="3 4" />
        <text x="360" y="436" textAnchor="middle" fill="#8a8f98" fontSize="11" fontFamily="ui-monospace, monospace">
          agentic application
        </text>
      </svg>

      <style jsx>{`
        @keyframes flow {
          to { stroke-dashoffset: -16; }
        }
        @keyframes flow-reverse {
          to { stroke-dashoffset: 16; }
        }
        :global(.cp-edge) {
          stroke-dasharray: 5 5;
          animation: flow 1.6s linear infinite;
        }
        :global(.cp-edge-reverse) {
          stroke-dasharray: 5 5;
          animation: flow-reverse 1.6s linear infinite;
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
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx={10}
        fill={featured ? 'url(#authorityFill)' : 'url(#boxFill)'}
        stroke={featured ? 'rgba(165,180,252,0.6)' : 'rgba(99,102,241,0.35)'}
        strokeWidth={featured ? 1.5 : 1}
      />
      <text x={x + 14} y={y + 22} fill="#ffffff" fontSize={featured ? 15 : 14} fontWeight="600" fontFamily="Inter, sans-serif">
        {title}
      </text>
      <text x={x + 14} y={y + 40} fill="#b6bbc5" fontSize="11" fontFamily="Inter, sans-serif">
        {subtitle}
      </text>
      {badge && (
        <g>
          <rect x={x + w - 56} y={y + 12} width="46" height="18" rx="4" fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.4)" strokeWidth="1" />
          <text x={x + w - 33} y={y + 24.5} textAnchor="middle" fill="#a5b4fc" fontSize="9" fontFamily="ui-monospace, monospace" letterSpacing="1">
            {badge.toUpperCase()}
          </text>
        </g>
      )}
      {/* For Authority, show 3-replica chiclets */}
      {featured && (
        <g>
          <circle cx={x + 20} cy={y + h - 16} r="3.5" fill="#34d399" />
          <circle cx={x + 32} cy={y + h - 16} r="3.5" fill="#34d399" />
          <circle cx={x + 44} cy={y + h - 16} r="3.5" fill="#34d399" />
          <text x={x + 56} y={y + h - 12} fill="#5c6168" fontSize="10" fontFamily="ui-monospace, monospace">3/3</text>
        </g>
      )}
    </g>
  )
}

function AnimatedEdge({ d, reverse }: { d: string; reverse?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="url(#edgeGrad)"
      strokeWidth="1.4"
      markerEnd="url(#arr)"
      className={reverse ? 'cp-edge-reverse' : 'cp-edge'}
    />
  )
}

function EdgeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x - text.length * 3 - 4} y={y - 9} width={text.length * 6 + 8} height="14" rx="3"
            fill="rgba(10,11,13,0.85)" stroke="rgba(46,48,54,0.8)" strokeWidth="0.5" />
      <text x={x} y={y + 1.5} textAnchor="middle" fill="#a5b4fc" fontSize="9" fontFamily="ui-monospace, monospace">
        {text}
      </text>
    </g>
  )
}
