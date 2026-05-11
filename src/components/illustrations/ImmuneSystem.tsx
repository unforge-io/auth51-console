'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── Threat lifecycle ──

type ThreatPhase = 'red' | 'amber' | 'green' | 'fading'

type Threat = {
  id: number
  xNorm: number          // 0..1 horizontal position
  label: string
  resolvedLabel: string
  startTime: number      // ms
  phase: ThreatPhase
  phaseTimestamps: { red: number; amber: number; green: number; fading: number }
}

const THREAT_SCENARIOS: { label: string; resolvedLabel: string }[] = [
  { label: 'Prompt injection rising',     resolvedLabel: 'Prompt injection blocked' },
  { label: 'Agent impersonation rising',  resolvedLabel: 'Impersonation neutralized' },
  { label: 'Privilege escalation rising', resolvedLabel: 'Escalation denied' },
  { label: 'Data exfiltration rising',    resolvedLabel: 'Exfiltration prevented' },
  { label: 'Jailbreak attempt rising',    resolvedLabel: 'Jailbreak blocked' },
  { label: 'Identity spoofing rising',    resolvedLabel: 'Spoofing neutralized' },
]

const MAX_THREATS = 3

// ── Shaders ──

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMoonPos;          // in uv space (0..1)
  uniform float uMoonRadius;      // in uv space

  // Threat arrays
  uniform int uThreatCount;
  uniform float uThreatX[3];      // xNorm 0..1
  uniform float uThreatPhase[3];  // 0=red, 1=amber, 2=green, 3=fading
  uniform float uThreatRise[3];   // 0..1 rise progress
  uniform float uThreatFade[3];   // 0..1 fade-out progress
  uniform float uThreatIntensity[3]; // 0..1 intensity

  // ── Noise ──
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  // ── Wave field: returns the height of the water surface at this x ──
  // We treat uv.x as world-x and time animates the wave field.
  float waveHeight(float x, float t) {
    // Long base swell
    float base = 0.0;
    base += 0.55 * sin(x * 2.2 + t * 0.45);
    base += 0.35 * sin(x * 3.7 + t * 0.62 + 1.3);
    base += 0.20 * sin(x * 6.1 + t * 0.85 + 2.6);
    base += 0.10 * sin(x * 11.0 + t * 1.1 + 4.1);
    // FBM detail (small ripples)
    float ripple = fbm(vec3(x * 4.0, t * 0.4, 0.0)) * 0.4;
    return base + ripple;
  }

  // Moon's gravitational influence on wave height (pull upward toward moon-x)
  float moonInfluence(float x) {
    float dx = (x - uMoonPos.x) * 1.5;
    return exp(-dx * dx * 3.0);
  }

  // Threat wave contribution — local upward bulge near threat position
  // Returns extra height (positive = upward in screen-space => smaller y in uv if y goes up)
  float threatBulge(float xNorm) {
    float total = 0.0;
    for (int i = 0; i < 3; i++) {
      if (i >= uThreatCount) break;
      float dx = xNorm - uThreatX[i];
      float env = exp(-dx * dx * 280.0);
      float rise = uThreatRise[i];
      float fade = 1.0 - uThreatFade[i];
      total += env * rise * fade * 0.55 * uThreatIntensity[i];
    }
    return total;
  }

  // Threat color injection — returns (rgb, alpha) of threat color at this uv
  vec4 threatColor(vec2 uv, float waterY) {
    vec4 result = vec4(0.0);
    for (int i = 0; i < 3; i++) {
      if (i >= uThreatCount) break;
      float dx = uv.x - uThreatX[i];
      float dyFromSurface = max(0.0, uv.y - waterY);

      // Bleed downward from the threat peak into the water
      float horizEnv = exp(-dx * dx * 90.0);
      float vertEnv = exp(-dyFromSurface * dyFromSurface * 8.0);
      float envelope = horizEnv * vertEnv;

      float rise = uThreatRise[i];
      float fade = 1.0 - uThreatFade[i];
      float intensity = uThreatIntensity[i] * rise * fade * envelope;

      // Phase color
      vec3 col = vec3(0.0);
      float phase = uThreatPhase[i];
      if (phase < 0.5) {
        // Red
        col = vec3(0.90, 0.18, 0.22);
      } else if (phase < 1.5) {
        // Amber
        col = vec3(0.92, 0.62, 0.10);
      } else {
        // Green
        col = vec3(0.10, 0.72, 0.42);
      }

      // Add ink-like noisy diffusion
      vec2 swirl = vec2(uv.x * 6.0 + uTime * 0.15, uv.y * 6.0 - uTime * 0.10);
      float ink = fbm(vec3(swirl, uTime * 0.2)) * 0.35 + 0.65;
      intensity *= ink;

      result.rgb = max(result.rgb, col);
      result.a = max(result.a, intensity);
    }
    return result;
  }

  void main() {
    // Flip Y so (0,0) is top-left for our conceptual model (y grows downward)
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    // Aspect-correct x for waves
    float aspect = uResolution.x / uResolution.y;
    float x = uv.x * aspect;
    float t = uTime;

    // Sky / paper background — very soft warm white at top, cooler pale violet at horizon
    vec3 skyTop = vec3(0.985, 0.984, 0.989);
    vec3 skyBot = vec3(0.945, 0.948, 0.965);
    vec3 sky = mix(skyTop, skyBot, smoothstep(0.0, 0.55, uv.y));

    // ── Subtle sky shimmer ──
    float skyNoise = fbm(vec3(uv * vec2(3.0, 5.0), uTime * 0.05)) * 0.012;
    sky += skyNoise;

    // ── Moon ──
    vec2 moonDelta = uv - uMoonPos;
    moonDelta.x *= aspect;
    float dToMoon = length(moonDelta);
    // Soft halo
    float halo = exp(-dToMoon * dToMoon * 14.0) * 0.55;
    halo += exp(-dToMoon * dToMoon * 80.0) * 0.35;
    sky += vec3(0.88, 0.92, 0.96) * halo * 0.15;

    // Moon disc with shading
    float moonMask = smoothstep(uMoonRadius + 0.005, uMoonRadius - 0.005, dToMoon);
    // Soft pencil-shaded moon: dark on lower-right, light on upper-left
    vec2 moonLocal = moonDelta / uMoonRadius;
    float shade = 0.5 - 0.4 * moonLocal.x + 0.3 * moonLocal.y;
    shade = clamp(shade, 0.0, 1.0);
    // Crater hints
    float crater1 = smoothstep(0.18, 0.16, length(moonLocal - vec2(-0.25, -0.10)));
    float crater2 = smoothstep(0.22, 0.20, length(moonLocal - vec2(0.18, 0.20)));
    float crater3 = smoothstep(0.14, 0.12, length(moonLocal - vec2(-0.08, 0.35)));
    float craters = (crater1 + crater2 + crater3) * 0.18;

    vec3 moonCol = mix(vec3(0.55, 0.58, 0.70), vec3(0.97, 0.98, 1.00), shade);
    moonCol -= craters * 0.20;
    // Rim light
    float rim = smoothstep(uMoonRadius - 0.012, uMoonRadius - 0.002, dToMoon);
    rim *= smoothstep(uMoonRadius + 0.002, uMoonRadius - 0.008, dToMoon);
    moonCol += vec3(0.7, 0.75, 0.85) * rim * 0.55;

    sky = mix(sky, moonCol, moonMask);

    // ── Gravitational pull lines (faint dashed curves from moon downward) ──
    // We compute a stylized curve: vertical band fade from moon to waterline
    float curveX = (uv.x - uMoonPos.x) * aspect;
    float curveY = uv.y - uMoonPos.y;
    float curveFalloff = exp(-curveX * curveX * 6.0);
    float gravBeam = curveFalloff * smoothstep(0.0, 0.05, curveY) * smoothstep(0.55, 0.4, uv.y);
    // Animated dashes along the beam
    float dashes = step(0.55, fract(curveY * 18.0 - uTime * 0.45));
    sky += vec3(0.40, 0.46, 0.65) * gravBeam * dashes * 0.18;

    // ── Water ──
    // Water surface is at: yBase + waveHeight scaled
    // We define the water region as uv.y > waterLevel(x).
    float t2 = t * 0.5;
    // Base water level — pushed below the hero text area
    float baseLevel = 0.62; // 0 = top, 1 = bottom (uv.y)
    // Wave height in uv-space
    float h = waveHeight(x * 1.6, t2);
    // Moon tidal pull: raise the water slightly under the moon
    float moonPull = moonInfluence(x) * 0.06;
    // Threat bulge
    float threatPeak = threatBulge(uv.x);

    float surface = baseLevel - h * 0.03 - moonPull - threatPeak * 0.20;

    // Distance below surface (positive = underwater)
    float underwater = uv.y - surface;

    if (underwater > 0.0) {
      // We're under the water surface — render water
      // Layer-based shading using FBM
      float depth = clamp(underwater / (1.0 - baseLevel), 0.0, 1.0);

      // Watercolor / pencil-shaded indigo water
      vec3 waterDeep    = vec3(0.18, 0.22, 0.42);
      vec3 waterMid     = vec3(0.42, 0.48, 0.66);
      vec3 waterShallow = vec3(0.74, 0.79, 0.90);
      vec3 waterCrest   = vec3(0.94, 0.95, 0.99);

      // Mix by depth
      vec3 water = mix(waterShallow, waterMid, smoothstep(0.0, 0.35, depth));
      water = mix(water, waterDeep, smoothstep(0.35, 1.0, depth));

      // Crest highlight (near surface)
      float crestBand = smoothstep(0.04, 0.0, underwater);
      water = mix(water, waterCrest, crestBand * 0.7);

      // FBM caustic / texture
      vec2 textureUv = vec2(uv.x * 6.0 + t * 0.2, underwater * 18.0 - t * 0.3);
      float caustic = fbm(vec3(textureUv, t * 0.1));
      water += caustic * vec3(0.10, 0.12, 0.16) * (0.5 + depth * 0.5);

      // Pencil-line wave bands (horizontal-ish lines following sub-surface waves)
      for (int li = 0; li < 5; li++) {
        float fi = float(li);
        float lineOffset = (fi + 1.0) * 0.07;
        float lineLevel = surface + lineOffset;
        float lineWave = waveHeight(x * (1.2 + fi * 0.4) + fi * 7.0, t2 * (0.6 + fi * 0.15));
        lineLevel -= lineWave * 0.012;
        float lineDist = abs(uv.y - lineLevel);
        float line = smoothstep(0.003, 0.0, lineDist);
        water -= vec3(0.06, 0.07, 0.10) * line * (0.4 + fi * 0.1);
      }

      // Moonlight reflection — bright band beneath the moon
      float moonRefl = exp(-pow((uv.x - uMoonPos.x) * aspect, 2.0) * 18.0);
      moonRefl *= smoothstep(0.0, 0.18, underwater) * smoothstep(0.55, 0.18, underwater);
      moonRefl *= 0.5 + 0.5 * fbm(vec3(uv.x * 30.0, uv.y * 40.0 - t * 0.8, 0.0));
      water += vec3(0.75, 0.82, 1.00) * moonRefl * 0.18;

      // Foam right at the surface
      float foamBand = smoothstep(0.012, 0.0, underwater);
      float foamNoise = fbm(vec3(uv.x * 24.0 + t * 0.4, uv.y * 18.0, 0.0));
      water += foamBand * vec3(1.0, 1.0, 1.0) * smoothstep(0.4, 0.7, foamNoise) * 0.25;

      // ── Threat color injection on water ──
      vec4 tc = threatColor(uv, surface);
      water = mix(water, water * 0.55 + tc.rgb * 1.0, tc.a * 0.92);
      // Add bright crest of color right at the surface peak
      water += tc.rgb * smoothstep(0.04, 0.0, underwater) * tc.a * 0.6;

      gl_FragColor = vec4(water, 1.0);
    } else {
      // We're above the water — render sky/moon
      // Threat color leaking into the sky just above the threat peak
      vec4 tc = threatColor(uv, surface);
      float aboveThreat = exp(-pow(uv.y - surface, 2.0) * 35.0);
      sky = mix(sky, sky * 0.6 + tc.rgb * 1.1, tc.a * aboveThreat * 0.85);

      gl_FragColor = vec4(sky, 1.0);
    }
  }
`

// ── Scene Component ──

function WaterScene({ threatsRef }: { threatsRef: React.MutableRefObject<Threat[]> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uMoonPos: { value: new THREE.Vector2(0.78, 0.28) }, // y in flipped uv (0=top)
    uMoonRadius: { value: 0.085 },
    uThreatCount: { value: 0 },
    uThreatX: { value: [0, 0, 0] },
    uThreatPhase: { value: [0, 0, 0] },
    uThreatRise: { value: [0, 0, 0] },
    uThreatFade: { value: [0, 0, 0] },
    uThreatIntensity: { value: [0, 0, 0] },
  }), [])

  useEffect(() => {
    if (!matRef.current) return
    matRef.current.uniforms.uResolution.value.set(size.width, size.height)
  }, [size])

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime
    matRef.current.uniforms.uTime.value = t

    // Update threat uniforms
    const now = performance.now()
    const xs: number[] = [0, 0, 0]
    const phases: number[] = [0, 0, 0]
    const rises: number[] = [0, 0, 0]
    const fades: number[] = [0, 0, 0]
    const intensities: number[] = [0, 0, 0]
    let count = 0

    for (const threat of threatsRef.current) {
      if (count >= MAX_THREATS) break
      xs[count] = threat.xNorm
      // Phase number
      let phaseN = 0
      if (threat.phase === 'amber') phaseN = 1
      else if (threat.phase === 'green' || threat.phase === 'fading') phaseN = 2
      phases[count] = phaseN

      const elapsed = now - threat.startTime
      const rise = Math.min(elapsed / 1500, 1)
      rises[count] = rise

      let fade = 0
      if (threat.phase === 'fading') {
        fade = Math.min((now - threat.phaseTimestamps.fading) / 1800, 1)
      }
      fades[count] = fade
      intensities[count] = 1.0
      count++
    }

    matRef.current.uniforms.uThreatCount.value = count
    matRef.current.uniforms.uThreatX.value = xs
    matRef.current.uniforms.uThreatPhase.value = phases
    matRef.current.uniforms.uThreatRise.value = rises
    matRef.current.uniforms.uThreatFade.value = fades
    matRef.current.uniforms.uThreatIntensity.value = intensities
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={false}
      />
    </mesh>
  )
}

// ── Main Component (manages threats + label overlays) ──

export function ImmuneSystem() {
  const threatsRef = useRef<Threat[]>([])
  const threatIdRef = useRef(0)
  const nextThreatRef = useRef(0)
  const [, setTick] = useState(0)

  // Threat spawn + lifecycle loop — refs only, ticks force re-render
  useEffect(() => {
    let raf = 0
    nextThreatRef.current = performance.now() + 1500
    const loop = () => {
      const now = performance.now()
      const list = threatsRef.current

      // Phase transitions
      for (const t of list) {
        if (t.phase === 'red' && now >= t.phaseTimestamps.amber) t.phase = 'amber'
        else if (t.phase === 'amber' && now >= t.phaseTimestamps.green) t.phase = 'green'
        else if (t.phase === 'green' && now >= t.phaseTimestamps.fading) t.phase = 'fading'
      }

      // Remove fully-faded
      threatsRef.current = list.filter((t) => !(t.phase === 'fading' && now >= t.phaseTimestamps.fading + 2000))

      // Spawn new threat
      if (now >= nextThreatRef.current && threatsRef.current.length < MAX_THREATS) {
        const id = ++threatIdRef.current
        const scenario = THREAT_SCENARIOS[(id - 1) % THREAT_SCENARIOS.length]
        const xNorm = 0.30 + Math.random() * 0.35
        threatsRef.current.push({
          id,
          xNorm,
          label: scenario.label,
          resolvedLabel: scenario.resolvedLabel,
          startTime: now,
          phase: 'red',
          phaseTimestamps: {
            red: now,
            amber: now + 2200,
            green: now + 3800,
            fading: now + 5200,
          },
        })
        nextThreatRef.current = now + 6500
      }

      setTick((x) => (x + 1) & 0xffff)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const threats = threatsRef.current

  return (
    <div className="absolute inset-0">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: 0.1, far: 10 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <WaterScene threatsRef={threatsRef} />
      </Canvas>

      {/* Threat label overlays — DOM, positioned in % */}
      <div className="absolute inset-0 pointer-events-none">
        {threats.map((threat) => (
          <ThreatLabel key={threat.id} threat={threat} />
        ))}
      </div>
    </div>
  )
}

// ── Label component ──

function ThreatLabel({ threat }: { threat: Threat }) {
  const now = performance.now()
  const elapsed = now - threat.startTime
  const rise = Math.min(elapsed / 1500, 1)

  let label = threat.label
  let dot = '#dc2626'
  let bg = 'rgba(254, 242, 242, 0.96)'
  let border = 'rgba(220, 38, 38, 0.5)'
  let text = '#991b1b'
  let shadow = 'rgba(220, 38, 38, 0.20)'

  if (threat.phase === 'amber') {
    label = threat.label.replace('rising', 'detected')
    dot = '#d97706'
    bg = 'rgba(255, 251, 235, 0.96)'
    border = 'rgba(217, 119, 6, 0.5)'
    text = '#92400e'
    shadow = 'rgba(217, 119, 6, 0.22)'
  } else if (threat.phase === 'green') {
    label = threat.resolvedLabel
    dot = '#10b981'
    bg = 'rgba(236, 253, 245, 0.96)'
    border = 'rgba(16, 185, 129, 0.5)'
    text = '#065f46'
    shadow = 'rgba(16, 185, 129, 0.22)'
  } else if (threat.phase === 'fading') {
    label = threat.resolvedLabel
    dot = '#10b981'
    bg = 'rgba(236, 253, 245, 0.96)'
    border = 'rgba(16, 185, 129, 0.5)'
    text = '#065f46'
    shadow = 'rgba(16, 185, 129, 0.22)'
  }

  const fadeIn = Math.min(elapsed / 500, 1)
  let opacity = fadeIn
  if (threat.phase === 'fading') {
    const f = Math.min((now - threat.phaseTimestamps.fading) / 1800, 1)
    opacity = 1 - f
  }

  // Position: vertically just above the wave crest
  // Water base is around 58% from top, threat rises ~10% above that
  const leftPct = threat.xNorm * 100
  const topPct = 50 - rise * 8 // % from top

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-50%, -100%)',
        opacity,
        transition: 'opacity 250ms ease',
      }}
    >
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          color: text,
          padding: '7px 14px 7px 12px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          whiteSpace: 'nowrap',
          boxShadow: `0 8px 24px ${shadow}, 0 2px 6px rgba(0,0,0,0.06)`,
          backdropFilter: 'blur(6px)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dot,
            boxShadow: threat.phase === 'red'
              ? `0 0 0 4px ${dot}33, 0 0 12px ${dot}66`
              : `0 0 0 2px ${dot}22`,
          }}
        />
        {label}
      </div>
    </div>
  )
}
