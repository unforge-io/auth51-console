'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

const RADIUS = 1.8

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

function makeArc(a: THREE.Vector3, b: THREE.Vector3, segs: number, alt: number): Float32Array {
  const buf = new Float32Array((segs + 1) * 3)
  const tmp = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    tmp.lerpVectors(a, b, t)
    const lift = Math.sin(t * Math.PI) * alt
    tmp.normalize().multiplyScalar(a.length() + lift)
    buf[i * 3] = tmp.x
    buf[i * 3 + 1] = tmp.y
    buf[i * 3 + 2] = tmp.z
  }
  return buf
}

const NODES = [
  { lat: 40, lng: -74, ok: true, label: 'Attested' },
  { lat: 51, lng: 0, ok: true, label: 'Verified' },
  { lat: 35, lng: 139, ok: true, label: 'Scoped' },
  { lat: -33, lng: 151, ok: true, label: 'Audited' },
  { lat: 40, lng: -10, ok: true, label: 'Delegated' },
  { lat: 37, lng: -122, ok: true, label: 'Trusted' },
  { lat: 55, lng: 37, ok: false, label: 'Revoked' },
  { lat: 1, lng: 103, ok: true, label: 'Bound' },
  { lat: -23, lng: -46, ok: true, label: 'Signed' },
  { lat: 28, lng: 77, ok: true, label: 'Checked' },
  { lat: 19, lng: -99, ok: false, label: 'Denied' },
  { lat: 25, lng: 55, ok: true, label: 'Proven' },
]

const ARCS: [number, number][] = [
  [0, 1], [1, 4], [2, 7], [3, 8], [0, 5],
  [4, 9], [7, 11], [5, 8], [9, 11], [1, 2],
]
const THREAT_ARCS: [number, number][] = [[6, 1], [10, 0]]

function DotSphere() {
  const geo = useMemo(() => {
    const positions: number[] = []
    for (let i = 0; i < 36; i++) {
      const phi = (Math.PI * (i + 1)) / 37
      const y = RADIUS * Math.cos(phi)
      const ringR = RADIUS * Math.sin(phi)
      const count = Math.max(4, Math.round(64 * Math.sin(phi)))
      for (let j = 0; j < count; j++) {
        const theta = (2 * Math.PI * j) / count
        positions.push(ringR * Math.cos(theta), y, ringR * Math.sin(theta))
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [])

  return (
    <points geometry={geo}>
      <pointsMaterial color="#0f0d2e" size={0.025} transparent opacity={1} sizeAttenuation />
    </points>
  )
}

function WireframeRings() {
  const rings = useMemo(() => {
    const result: THREE.BufferGeometry[] = []
    for (let i = 1; i <= 5; i++) {
      const phi = (Math.PI * i) / 6
      const ringR = RADIUS * Math.sin(phi)
      const y = RADIUS * Math.cos(phi)
      const points: THREE.Vector3[] = []
      for (let j = 0; j <= 64; j++) {
        const theta = (2 * Math.PI * j) / 64
        points.push(new THREE.Vector3(ringR * Math.cos(theta), y, ringR * Math.sin(theta)))
      }
      result.push(new THREE.BufferGeometry().setFromPoints(points))
    }
    return result
  }, [])

  return (
    <>
      {rings.map((geo, i) => {
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#1e1b4b', transparent: true, opacity: 0.6 }))
        return <primitive key={`h-${i}`} object={line} />
      })}
    </>
  )
}

function GlobeAtmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[RADIUS * 1.02, 48, 48]} />
      <meshBasicMaterial color="#1e1b4b" transparent opacity={0.15} side={THREE.BackSide} />
    </mesh>
  )
}

function AgentNode({ pos, ok, delay, label }: { pos: THREE.Vector3; ok: boolean; delay: number; label: string }) {
  const ref = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = 1 + 0.3 * Math.sin((t - delay) * 2)
    ref.current?.scale.setScalar(s)
    if (glowRef.current) {
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin((t - delay) * 2)
    }
  })

  return (
    <group position={pos}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={ok ? '#047857' : '#b91c1c'} transparent opacity={0.5} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={ok ? '#047857' : '#b91c1c'} />
      </mesh>
      <Html
        position={[0, 0.1, 0]}
        center
        distanceFactor={5}
        zIndexRange={[1, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            padding: '2px 6px',
            borderRadius: '3px',
            color: ok ? '#065f46' : '#991b1b',
            backgroundColor: ok ? 'rgba(209, 250, 229, 0.95)' : 'rgba(254, 226, 226, 0.95)',
            border: ok ? '1px solid rgba(6, 95, 70, 0.15)' : '1px solid rgba(153, 27, 27, 0.15)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

function ArcLine({ from, to, color, speed }: { from: THREE.Vector3; to: THREE.Vector3; color: string; speed: number }) {
  const lineRef = useRef<THREE.Line>(null)
  const fullBuf = useMemo(() => makeArc(from, to, 60, 0.18), [from, to])

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
    return new THREE.Line(geo, mat)
  }, [color])

  useFrame(({ clock }) => {
    if (!lineRef.current) return
    const t = (clock.getElapsedTime() / speed) % 1
    const count = Math.max(2, Math.floor(t * 61))
    const geo = lineRef.current.geometry as THREE.BufferGeometry
    geo.setAttribute('position', new THREE.Float32BufferAttribute(fullBuf.slice(0, count * 3), 3))
  })

  return <primitive ref={lineRef} object={lineObj} />
}

function Pulse({ pos }: { pos: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() * 0.5) % 1
    ref.current.scale.setScalar(1 + t * 3)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t)
  })

  return (
    <mesh ref={ref} position={pos}>
      <ringGeometry args={[0.03, 0.04, 24]} />
      <meshBasicMaterial color="#dc2626" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Globe() {
  const groupRef = useRef<THREE.Group>(null)
  const positions = useMemo(() => NODES.map((n) => latLngToVec3(n.lat, n.lng, RADIUS)), [])

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.06
  })

  return (
    <group ref={groupRef} rotation={[0.41, 0, -0.41]}>
      <GlobeAtmosphere />
      <WireframeRings />
      <DotSphere />
      {NODES.map((n, i) => (
        <AgentNode key={i} pos={positions[i]} ok={n.ok} delay={i * 0.5} label={n.label} />
      ))}
      {ARCS.map(([a, b], i) => (
        <ArcLine key={`a-${i}`} from={positions[a]} to={positions[b]} color="#1e1b4b" speed={3 + i * 0.4} />
      ))}
      {THREAT_ARCS.map(([a, b], i) => (
        <ArcLine key={`t-${i}`} from={positions[a]} to={positions[b]} color="#dc2626" speed={2.5} />
      ))}
      {NODES.filter((n) => !n.ok).map((n, i) => (
        <Pulse key={i} pos={latLngToVec3(n.lat, n.lng, RADIUS)} />
      ))}
    </group>
  )
}

function GlobeTitle() {
  return (
    <Html position={[0, -2.4, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div
        style={{
          whiteSpace: 'nowrap',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: 'rgba(49, 46, 129, 0.5)',
        }}
      >
        Agent Trust Network
      </div>
    </Html>
  )
}

const EVENTS: { icon: string; text: string; type: 'ok' | 'warn' | 'info' }[] = [
  { icon: '✓', text: 'Scanner agent attested — checksum verified', type: 'ok' },
  { icon: '→', text: 'Intent token minted — scope: read:code', type: 'info' },
  { icon: '✓', text: 'API call verified — PoP signature valid', type: 'ok' },
  { icon: '✕', text: 'Blocked — scope escalation denied', type: 'warn' },
  { icon: '✓', text: 'Deployer agent attested — checksum verified', type: 'ok' },
  { icon: '→', text: 'Delegation chain extended — B₁ → B₂', type: 'info' },
  { icon: '✓', text: 'Audit logged — immutable trace recorded', type: 'ok' },
  { icon: '✕', text: 'Blocked — unregistered agent rejected', type: 'warn' },
  { icon: '✓', text: 'Reviewer agent attested — checksum verified', type: 'ok' },
  { icon: '→', text: 'Intent token minted — scope: write:patch', type: 'info' },
  { icon: '✓', text: 'Workflow step verified — plan → classify', type: 'ok' },
  { icon: '✕', text: 'Blocked — token replay detected', type: 'warn' },
  { icon: '✓', text: 'Tester agent attested — checksum verified', type: 'ok' },
  { icon: '→', text: 'Intent token minted — scope: read:vulns', type: 'info' },
]

function EventFeed() {
  const [events, setEvents] = useState<{ id: number; icon: string; text: string; type: string }[]>([])

  useEffect(() => {
    let n = 0
    const id = setInterval(() => {
      n++
      const ev = EVENTS[n % EVENTS.length]
      setEvents((prev) => [{ ...ev, id: Date.now() }, ...prev].slice(0, 4))
    }, 2400)
    return () => clearInterval(id)
  }, [])

  const colors = {
    ok: { dot: '#059669', text: '#065f46' },
    warn: { dot: '#dc2626', text: '#991b1b' },
    info: { dot: '#4338ca', text: '#1e3a5f' },
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        width: 230,
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          padding: '10px 12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: '#059669',
            boxShadow: '0 0 4px rgba(5, 150, 105, 0.5)',
            animation: 'hfPulse 2s ease infinite',
          }} />
          <span style={{
            fontSize: 9, fontWeight: 600, color: '#64748b',
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Live activity
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map((ev, i) => {
            const c = colors[ev.type as keyof typeof colors]
            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  opacity: 1 - i * 0.18,
                  transition: 'opacity 0.5s ease',
                  animation: i === 0 ? 'hfSlideIn 0.4s ease' : undefined,
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, color: c.dot,
                  lineHeight: '14px', flexShrink: 0, width: 10, textAlign: 'center',
                }}>
                  {ev.icon}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 500, color: c.text,
                  lineHeight: '14px',
                }}>
                  {ev.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`
        @keyframes hfPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes hfSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export function TrustGlobeScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.3} />
        <Globe />
        <GlobeTitle />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate rotateSpeed={0.3} />
      </Canvas>
      <EventFeed />
    </div>
  )
}
