'use client'

import { useEffect, useState } from 'react'

/**
 * Animated hero illustration — interconnected agent nodes with trust paths.
 *
 * Shows a network of agent nodes connected by signed trust paths,
 * with a central Authority node and shield motif. Animated on mount:
 * nodes fade in, connections draw themselves, a verification pulse travels
 * along the paths.
 *
 * Palette: navy (#0a2540), brand blue (#2563eb), warm stone grays.
 * No external dependencies — pure SVG + CSS animations.
 */
export function HeroGraphic() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative w-full max-w-[560px]" aria-hidden="true">
      <svg
        viewBox="0 0 560 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Background grid — subtle, editorial */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e7e5e4" strokeWidth="0.5" />
          </pattern>

          {/* Glow filter for active nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Animated dash for trust paths */}
          <style>{`
            @keyframes dash-flow {
              to { stroke-dashoffset: -20; }
            }
            @keyframes pulse-node {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 1; }
            }
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .trust-path {
              stroke-dasharray: 8 6;
              animation: dash-flow 1.5s linear infinite;
            }
            .node-pulse {
              animation: pulse-node 3s ease-in-out infinite;
            }
            .hero-fade {
              opacity: 0;
              animation: fade-in-up 0.6s ease-out forwards;
            }
          `}</style>
        </defs>

        {/* Grid background */}
        <rect width="560" height="420" fill="url(#grid)" opacity="0.4" />

        {/* ── Trust paths (connections) ── */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.3s' }}>
          {/* Authority → Agent 1 */}
          <path d="M 280 160 L 140 260" stroke="#2563eb" strokeWidth="2" className="trust-path" />
          {/* Authority → Agent 2 */}
          <path d="M 280 160 L 280 280" stroke="#2563eb" strokeWidth="2" className="trust-path" />
          {/* Authority → Agent 3 */}
          <path d="M 280 160 L 420 260" stroke="#2563eb" strokeWidth="2" className="trust-path" />
          {/* Agent 1 → Resource */}
          <path d="M 140 290 L 80 360" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Agent 2 → Resource */}
          <path d="M 280 310 L 220 360" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Agent 3 → Resource */}
          <path d="M 420 290 L 460 360" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Agent 2 → Agent 2b (delegation) */}
          <path d="M 310 295 L 360 340" stroke="#047857" strokeWidth="1.5" className="trust-path" />
        </g>

        {/* ── Central Authority Node ── */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.1s' }}>
          {/* Glow ring */}
          <circle cx="280" cy="140" r="48" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.2" className="node-pulse" />
          <circle cx="280" cy="140" r="38" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.1" className="node-pulse" style={{ animationDelay: '0.5s' }} />

          {/* Shield shape */}
          <path
            d="M 280 108 L 308 120 L 308 148 C 308 164 280 176 280 176 C 280 176 252 164 252 148 L 252 120 Z"
            fill="#0a2540"
            stroke="#2563eb"
            strokeWidth="2"
          />
          {/* Checkmark inside shield */}
          <path
            d="M 268 140 L 276 148 L 292 132"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Label */}
          <text x="280" y="195" textAnchor="middle" fill="#0a2540" fontSize="12" fontWeight="600" fontFamily="var(--font-sans)">
            Auth51 Authority
          </text>
          <text x="280" y="210" textAnchor="middle" fill="#78716c" fontSize="10" fontFamily="var(--font-sans)">
            Control Plane
          </text>
        </g>

        {/* ── Agent Nodes ── */}
        {/* Agent 1 */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.5s' }}>
          <rect x="100" y="250" width="80" height="40" rx="8" fill="#fafaf9" stroke="#1e3a5f" strokeWidth="1.5" />
          <circle cx="120" cy="265" r="6" fill="#2563eb" opacity="0.15" />
          <circle cx="120" cy="265" r="3" fill="#2563eb" />
          <text x="140" y="268" textAnchor="middle" fill="#1c1917" fontSize="10" fontWeight="500" fontFamily="var(--font-sans)">
            Agent
          </text>
          <text x="140" y="280" textAnchor="middle" fill="#78716c" fontSize="8" fontFamily="var(--font-mono)">
            PoP ✓
          </text>
        </g>

        {/* Agent 2 */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.6s' }}>
          <rect x="240" y="270" width="80" height="40" rx="8" fill="#fafaf9" stroke="#1e3a5f" strokeWidth="1.5" />
          <circle cx="260" cy="285" r="6" fill="#2563eb" opacity="0.15" />
          <circle cx="260" cy="285" r="3" fill="#2563eb" />
          <text x="280" y="288" textAnchor="middle" fill="#1c1917" fontSize="10" fontWeight="500" fontFamily="var(--font-sans)">
            Agent
          </text>
          <text x="280" y="300" textAnchor="middle" fill="#78716c" fontSize="8" fontFamily="var(--font-mono)">
            Scoped ✓
          </text>
        </g>

        {/* Agent 3 */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.7s' }}>
          <rect x="380" y="250" width="80" height="40" rx="8" fill="#fafaf9" stroke="#1e3a5f" strokeWidth="1.5" />
          <circle cx="400" cy="265" r="6" fill="#2563eb" opacity="0.15" />
          <circle cx="400" cy="265" r="3" fill="#2563eb" />
          <text x="420" y="268" textAnchor="middle" fill="#1c1917" fontSize="10" fontWeight="500" fontFamily="var(--font-sans)">
            Agent
          </text>
          <text x="420" y="280" textAnchor="middle" fill="#78716c" fontSize="8" fontFamily="var(--font-mono)">
            Audited ✓
          </text>
        </g>

        {/* Delegated sub-agent */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.9s' }}>
          <rect x="330" y="330" width="70" height="34" rx="6" fill="#ecfdf5" stroke="#047857" strokeWidth="1" />
          <text x="365" y="350" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="500" fontFamily="var(--font-sans)">
            Sub-agent
          </text>
          <text x="365" y="360" textAnchor="middle" fill="#047857" fontSize="7" fontFamily="var(--font-mono)">
            delegated
          </text>
        </g>

        {/* ── Resource nodes (small, at bottom) ── */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '1.0s' }}>
          {/* Resource 1 */}
          <rect x="50" y="355" width="60" height="28" rx="4" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" />
          <text x="80" y="373" textAnchor="middle" fill="#78716c" fontSize="9" fontFamily="var(--font-sans)">
            API
          </text>

          {/* Resource 2 */}
          <rect x="190" y="355" width="60" height="28" rx="4" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" />
          <text x="220" y="373" textAnchor="middle" fill="#78716c" fontSize="9" fontFamily="var(--font-sans)">
            Database
          </text>

          {/* Resource 3 */}
          <rect x="430" y="355" width="60" height="28" rx="4" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" />
          <text x="460" y="373" textAnchor="middle" fill="#78716c" fontSize="9" fontFamily="var(--font-sans)">
            Service
          </text>
        </g>

        {/* ── Verifier badges on trust paths ── */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '0.8s' }}>
          <circle cx="115" cy="325" r="10" fill="#ecfdf5" stroke="#047857" strokeWidth="1" />
          <text x="115" y="329" textAnchor="middle" fill="#047857" fontSize="9">🛡</text>

          <circle cx="250" cy="340" r="10" fill="#ecfdf5" stroke="#047857" strokeWidth="1" />
          <text x="250" y="344" textAnchor="middle" fill="#047857" fontSize="9">🛡</text>

          <circle cx="445" cy="325" r="10" fill="#ecfdf5" stroke="#047857" strokeWidth="1" />
          <text x="445" y="329" textAnchor="middle" fill="#047857" fontSize="9">🛡</text>
        </g>

        {/* ── Floating JWT token ── */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '1.1s' }}>
          <rect x="460" y="100" width="80" height="50" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
          <text x="500" y="118" textAnchor="middle" fill="#1e3a5f" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">
            Agentic JWT
          </text>
          <text x="500" y="132" textAnchor="middle" fill="#2563eb" fontSize="8" fontFamily="var(--font-mono)">
            intent: &quot;read&quot;
          </text>
          <text x="500" y="143" textAnchor="middle" fill="#2563eb" fontSize="8" fontFamily="var(--font-mono)">
            pop: ✓ signed
          </text>
        </g>

        {/* Connecting line from JWT to agent 3 */}
        <g className={mounted ? 'hero-fade' : 'opacity-0'} style={{ animationDelay: '1.2s' }}>
          <path d="M 480 150 L 440 250" stroke="#2563eb" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </g>
      </svg>
    </div>
  )
}
