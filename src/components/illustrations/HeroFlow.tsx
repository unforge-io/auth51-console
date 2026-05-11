'use client'

import { useEffect, useState, type CSSProperties } from 'react'

type Phase = 'idle' | 'delegate' | 'attest' | 'mint' | 'call' | 'verify' | 'blocked' | 'success'

const GOOD: { phase: Phase; ms: number }[] = [
  { phase: 'idle', ms: 900 },
  { phase: 'delegate', ms: 1200 },
  { phase: 'attest', ms: 1100 },
  { phase: 'mint', ms: 1300 },
  { phase: 'call', ms: 1100 },
  { phase: 'verify', ms: 1400 },
  { phase: 'success', ms: 2200 },
]

const BAD: { phase: Phase; ms: number }[] = [
  { phase: 'idle', ms: 900 },
  { phase: 'delegate', ms: 1000 },
  { phase: 'attest', ms: 900 },
  { phase: 'mint', ms: 1100 },
  { phase: 'call', ms: 900 },
  { phase: 'verify', ms: 1200 },
  { phase: 'blocked', ms: 2400 },
]

const SEQS = [GOOD, BAD]

function useLoop() {
  const [si, setSi] = useState(0)
  const [pi, setPi] = useState(0)
  const seq = SEQS[si]
  const cur = seq[pi]
  useEffect(() => {
    const t = setTimeout(() => {
      if (pi < seq.length - 1) setPi(pi + 1)
      else { setSi((si + 1) % SEQS.length); setPi(0) }
    }, cur.ms)
    return () => clearTimeout(t)
  }, [si, pi, seq, cur.ms])
  return { phase: cur.phase, threat: si === 1 }
}

const F = 'Inter, system-ui, -apple-system, sans-serif'
const M = 'var(--font-mono), ui-monospace, monospace'

function Box({ x, y, w, h, label, sub, icon, active, color, glow, shake, children }: {
  x: number; y: number; w: number; h: number
  label: string; sub?: string; icon: string
  active: boolean; color: string; glow?: string; shake?: boolean
  children?: React.ReactNode
}) {
  const s: CSSProperties = {
    position: 'absolute', left: x, top: y, width: w, height: h,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
    borderRadius: 8,
    border: `1.5px solid ${active ? color : '#e2e8f0'}`,
    backgroundColor: active ? `${color}08` : '#fff',
    boxShadow: glow ? `0 0 14px ${glow}` : active ? '0 2px 8px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.03)',
    transition: 'all 0.35s ease',
    fontFamily: F,
    animation: shake ? 'hfShake 0.5s ease-in-out' : undefined,
  }
  return (
    <div style={s}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#0a2540', letterSpacing: '0.01em' }}>{label}</span>
      {sub && <span style={{ fontSize: 8, color: '#8898aa', fontFamily: M, fontWeight: 500 }}>{sub}</span>}
      {children}
    </div>
  )
}

function Line({ x1, y1, x2, y2, active, color, dashed }: {
  x1: number; y1: number; x2: number; y2: number
  active: boolean; color?: string; dashed?: boolean
}) {
  const c = active ? (color || '#4338ca') : '#e2e8f0'
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  return (
    <>
      <div style={{
        position: 'absolute', left: x1, top: y1,
        width: len, height: 0,
        borderTop: `1.5px ${dashed ? 'dashed' : 'solid'} ${c}`,
        transformOrigin: '0 0',
        transform: `rotate(${angle}deg)`,
        transition: 'border-color 0.3s',
      }} />
      {active && (
        <div style={{
          position: 'absolute',
          left: x2 - 4, top: y2 - 4,
          width: 0, height: 0,
          borderLeft: `5px solid ${c}`,
          borderTop: '3.5px solid transparent',
          borderBottom: '3.5px solid transparent',
          transform: `rotate(${angle}deg)`,
          transition: 'border-color 0.3s',
        }} />
      )}
    </>
  )
}

function Dot({ x, y, active, color }: { x: number; y: number; active: boolean; color: string }) {
  return (
    <div style={{
      position: 'absolute', left: x - 4, top: y - 4,
      width: 8, height: 8, borderRadius: '50%',
      backgroundColor: active ? color : 'transparent',
      boxShadow: active ? `0 0 6px ${color}80` : 'none',
      transition: 'all 0.4s ease',
    }} />
  )
}

function Badge({ x, y, text, variant }: { x: number; y: number; text: string; variant: 'ok' | 'err' | 'info' }) {
  const s = {
    ok: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    err: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    info: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  }[variant]
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: M, fontSize: 8, fontWeight: 600,
      padding: '2px 7px', borderRadius: 10,
      backgroundColor: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
      animation: 'hfFade 0.3s ease',
    }}>
      {text}
    </div>
  )
}

function StepNum({ x, y, n, active, color }: { x: number; y: number; n: number; active: boolean; color?: string }) {
  const c = active ? (color || '#4338ca') : '#cbd5e1'
  return (
    <div style={{
      position: 'absolute', left: x - 8, top: y - 8,
      width: 16, height: 16, borderRadius: '50%',
      backgroundColor: active ? c : '#f1f5f9',
      border: `1.5px solid ${c}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 8, fontWeight: 700, color: active ? '#fff' : c,
      fontFamily: M, transition: 'all 0.3s ease',
    }}>
      {n}
    </div>
  )
}

export function HeroFlow() {
  const { phase, threat } = useLoop()

  const p = (from: Phase) => {
    const order: Phase[] = ['idle', 'delegate', 'attest', 'mint', 'call', 'verify', 'success', 'blocked']
    return order.indexOf(phase) >= order.indexOf(from)
  }

  // Layout constants (540 x 460 canvas)
  // Agents column (left): x=10
  // Shim column (center): x=200
  // IDP (right): x=390
  // Resource server (bottom center): x=200

  const threatColor = '#ef4444'
  const okColor = '#4338ca'
  const greenColor = '#059669'

  return (
    <div style={{ position: 'relative', width: 540, height: 470, fontFamily: F }}>
      <style>{`
        @keyframes hfShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes hfFade {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hfPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── Container labels ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 165, height: 280,
        border: '1px dashed #cbd5e1', borderRadius: 10,
        backgroundColor: '#fafbfc',
      }}>
        <span style={{
          position: 'absolute', top: 6, left: 10,
          fontSize: 8, fontWeight: 600, color: '#94a3b8',
          fontFamily: M, letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Agentic App
        </span>
      </div>

      <div style={{
        position: 'absolute', left: 185, top: 0, width: 180, height: 280,
        border: '1px dashed #93c5fd', borderRadius: 10,
        backgroundColor: '#f8faff',
      }}>
        <span style={{
          position: 'absolute', top: 6, left: 10,
          fontSize: 8, fontWeight: 600, color: '#60a5fa',
          fontFamily: M, letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Auth51 Shim
        </span>
      </div>

      {/* ── Agent nodes (left column) ── */}
      <Box x={20} y={28} w={130} h={52}
        label={threat ? 'Rogue Agent' : 'Supervisor'}
        sub="orchestrator"
        icon={threat ? '💀' : '🧠'}
        active={phase === 'idle' || phase === 'delegate'}
        color={threat ? threatColor : '#7c3aed'}
      />
      <Box x={20} y={95} w={130} h={52}
        label="Planner"
        sub="agent B₁"
        icon="📋"
        active={phase === 'delegate' || phase === 'attest'}
        color="#7c3aed"
      />
      <Box x={20} y={162} w={130} h={52}
        label="Patcher"
        sub="agent B₂"
        icon="🔧"
        active={phase === 'call'}
        color="#7c3aed"
      />
      <Box x={20} y={229} w={130} h={40}
        label="LLM"
        icon="✦"
        active={phase === 'delegate' || phase === 'attest'}
        color="#94a3b8"
      />

      {/* ── Shim components (center column) ── */}
      <Box x={200} y={28} w={150} h={48}
        label="Integrity Verifier"
        sub="checksum"
        icon="🔍"
        active={phase === 'attest'}
        color={okColor}
      />
      <Box x={200} y={92} w={150} h={48}
        label="Workflow Tracker"
        sub="state machine"
        icon="📊"
        active={phase === 'attest' || phase === 'mint'}
        color={okColor}
      />
      <Box x={200} y={156} w={150} h={48}
        label="Secure Client"
        sub="token + PoP"
        icon="🛡️"
        active={phase === 'mint' || phase === 'call' || phase === 'verify'}
        color={okColor}
        glow={phase === 'success' ? '#05966940' : phase === 'blocked' ? '#ef444440' : undefined}
        shake={phase === 'blocked'}
      />
      <Box x={200} y={220} w={150} h={48}
        label="Workflow State"
        sub="delegation chain"
        icon="🔗"
        active={phase === 'mint'}
        color={okColor}
      />

      {/* ── IDP (right) ── */}
      <Box x={400} y={60} w={130} h={70}
        label="Auth51 IDP"
        sub="authorization server"
        icon="🏛️"
        active={phase === 'mint' || phase === 'verify'}
        color={greenColor}
      />

      {/* ── Resource Server (bottom) ── */}
      <Box x={175} y={310} w={180} h={60}
        label="Resource Server"
        sub="API endpoint"
        icon="🔌"
        active={phase === 'verify' || phase === 'success'}
        color={greenColor}
        glow={phase === 'success' && !threat ? '#05966930' : undefined}
      />

      {/* External APIs (bottom right) */}
      <Box x={400} y={310} w={130} h={55}
        label="External API"
        sub="github · osv.dev"
        icon="☁️"
        active={phase === 'success' && !threat}
        color="#94a3b8"
      />

      {/* ── Connection lines ── */}

      {/* Agents → Shim: delegate/attest */}
      <Line x1={150} y1={54} x2={200} y2={52} active={p('attest')} dashed />
      <Line x1={150} y1={121} x2={200} y2={116} active={p('attest')} dashed />

      {/* Agent → LLM */}
      <Line x1={85} y1={80} x2={85} y2={95} active={phase === 'delegate'} color="#94a3b8" dashed />
      <Line x1={85} y1={214} x2={85} y2={229} active={phase === 'delegate'} color="#94a3b8" dashed />

      {/* Shim internal: verifier → tracker → secure client → state */}
      <Line x1={275} y1={76} x2={275} y2={92} active={p('attest')} color={okColor} />
      <Line x1={275} y1={140} x2={275} y2={156} active={p('mint')} color={okColor} />
      <Line x1={275} y1={204} x2={275} y2={220} active={p('mint')} color={okColor} dashed />

      {/* Secure Client → IDP (mint token) */}
      <Line x1={350} y1={180} x2={400} y2={120} active={p('mint')} color={threat ? threatColor : okColor} />

      {/* IDP → Secure Client (token response) */}
      {p('call') && (
        <Line x1={400} y1={105} x2={350} y2={165} active color={threat ? threatColor : greenColor} dashed />
      )}

      {/* Secure Client → Resource Server (API call) */}
      <Line x1={275} y1={204} x2={265} y2={310} active={p('call')} color={threat ? threatColor : okColor} />

      {/* Resource Server → External API */}
      <Line x1={355} y1={340} x2={400} y2={337} active={phase === 'success' && !threat} color={greenColor} />

      {/* ── Step numbers ── */}
      <StepNum x={160} y={50} n={1} active={p('attest')} />
      <StepNum x={340} y={148} n={2} active={p('mint')} color={threat ? threatColor : undefined} />
      <StepNum x={380} y={108} n={3} active={p('call')} color={threat ? threatColor : greenColor} />
      <StepNum x={250} y={295} n={4} active={p('call')} color={threat ? threatColor : undefined} />
      <StepNum x={370} y={325} n={5} active={phase === 'success' && !threat} color={greenColor} />

      {/* ── Flow dots ── */}
      <Dot x={175} y={52} active={phase === 'attest'} color={okColor} />
      <Dot x={375} y={150} active={phase === 'mint'} color={threat ? threatColor : okColor} />
      <Dot x={375} y={108} active={phase === 'call'} color={threat ? threatColor : greenColor} />
      <Dot x={270} y={300} active={phase === 'call' || phase === 'verify'} color={threat ? threatColor : okColor} />

      {/* ── Status badge ── */}
      {phase === 'attest' && (
        <Badge x={195} y={285} text="◆ computing agent checksum" variant="info" />
      )}
      {phase === 'mint' && (
        <Badge x={195} y={285}
          text={threat ? '⚠ requesting scope:* (all)' : '◆ minting intent token'}
          variant={threat ? 'err' : 'info'}
        />
      )}
      {phase === 'call' && (
        <Badge x={195} y={285}
          text="→ API call + PoP signature"
          variant="info"
        />
      )}
      {phase === 'verify' && (
        <Badge x={195} y={285}
          text={threat ? '✕ scope exceeds delegation' : '◆ verifying intent + chain'}
          variant={threat ? 'err' : 'info'}
        />
      )}
      {phase === 'success' && (
        <Badge x={195} y={285} text="✓ verified — audit logged" variant="ok" />
      )}
      {phase === 'blocked' && (
        <Badge x={195} y={285} text="✕ blocked — agent revoked" variant="err" />
      )}

      {/* ── Scenario indicator ── */}
      <div style={{
        position: 'absolute', right: 8, top: 8,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: threat ? '#ef4444' : '#10b981',
          boxShadow: `0 0 5px ${threat ? '#ef444460' : '#10b98160'}`,
          display: 'inline-block',
          animation: 'hfPulse 2s ease infinite',
        }} />
        <span style={{
          fontFamily: M, fontSize: 8, fontWeight: 600,
          color: threat ? '#991b1b' : '#065f46',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {threat ? 'Threat' : 'Verified'}
        </span>
      </div>

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute', bottom: 60, left: 10,
        display: 'flex', gap: 12,
        fontFamily: M, fontSize: 8, color: '#94a3b8', fontWeight: 500,
      }}>
        <span>── data flow</span>
        <span>- - control plane</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4338ca', display: 'inline-block' }} /> step
        </span>
      </div>
    </div>
  )
}
