'use client'

import { useEffect, useState } from 'react'

export function HeroVisual() {
  const [step, setStep] = useState(-1)

  useEffect(() => {
    const delays = [800, 1600, 2400, 3200, 4000]
    const timers = delays.map((d, i) =>
      setTimeout(() => setStep(i), d),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Mesh gradient background — vibrant orbs */}
      <div className="absolute inset-0 bg-[#0a0e27]">
        {/* Primary orb — large purple/violet, top-center */}
        <div
          className="absolute w-[900px] h-[900px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, #4f46e5 30%, transparent 70%)',
            top: '-20%',
            left: '30%',
            animation: 'hero-drift-1 20s ease-in-out infinite',
          }}
        />
        {/* Secondary orb — teal/cyan, center-right */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #0891b2 30%, transparent 70%)',
            top: '10%',
            right: '-10%',
            animation: 'hero-drift-2 25s ease-in-out infinite',
          }}
        />
        {/* Tertiary orb — pink/magenta, bottom-left */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, #db2777 30%, transparent 70%)',
            bottom: '-10%',
            left: '-5%',
            animation: 'hero-drift-3 22s ease-in-out infinite',
          }}
        />
        {/* Accent orb — green, center */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #10b981 0%, #059669 30%, transparent 70%)',
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'hero-drift-4 18s ease-in-out infinite',
          }}
        />
        {/* Deep blue orb — depth layer */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, #1e40af 0%, #1e3a8a 25%, transparent 65%)',
            top: '20%',
            left: '10%',
            animation: 'hero-drift-5 28s ease-in-out infinite',
          }}
        />
      </div>

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating verification indicators — glass cards */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right: checksum verified */}
        <div
          className={`absolute top-[18%] right-[8%] transition-all duration-1000 ${
            step >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ animation: step >= 0 ? 'hero-float-1 6s ease-in-out infinite' : 'none' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.08] px-4 py-2.5 shadow-2xl">
            <div className="w-5 h-5 rounded-full bg-emerald-500/80 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
            <div>
              <div className="text-[12px] font-medium text-white/90">Checksum verified</div>
              <div className="text-[10px] text-white/40 font-mono">sha256:f7b8a5cf…</div>
            </div>
          </div>
        </div>

        {/* Left: intent token */}
        <div
          className={`absolute top-[45%] left-[5%] transition-all duration-1000 ${
            step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ animation: step >= 1 ? 'hero-float-2 7s ease-in-out infinite' : 'none' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.08] px-4 py-2.5 shadow-2xl">
            <div className="w-5 h-5 rounded-full bg-violet-500/80 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
            <div>
              <div className="text-[12px] font-medium text-white/90">Intent token minted</div>
              <div className="text-[10px] text-white/40 font-mono">action: read:code</div>
            </div>
          </div>
        </div>

        {/* Bottom-right: PoP verified */}
        <div
          className={`absolute bottom-[28%] right-[12%] transition-all duration-1000 ${
            step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ animation: step >= 2 ? 'hero-float-3 8s ease-in-out infinite' : 'none' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/[0.08] px-4 py-2.5 shadow-2xl">
            <div className="w-5 h-5 rounded-full bg-cyan-500/80 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
            <div>
              <div className="text-[12px] font-medium text-white/90">PoP signature valid</div>
              <div className="text-[10px] text-white/40 font-mono">0.2ms · Ed25519</div>
            </div>
          </div>
        </div>

        {/* Bottom-left: threat blocked */}
        <div
          className={`absolute bottom-[18%] left-[10%] transition-all duration-1000 ${
            step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ animation: step >= 3 ? 'hero-float-4 6.5s ease-in-out infinite' : 'none' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-red-500/[0.08] backdrop-blur-md border border-red-400/[0.12] px-4 py-2.5 shadow-2xl">
            <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center text-white text-[9px] font-bold">✗</div>
            <div>
              <div className="text-[12px] font-medium text-red-300/90">Replay blocked</div>
              <div className="text-[10px] text-red-400/40 font-mono">PoP mismatch</div>
            </div>
          </div>
        </div>

        {/* Center-bottom: stats */}
        <div
          className={`absolute bottom-[8%] left-1/2 -translate-x-1/2 transition-all duration-1000 ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-8 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/[0.06] px-6 py-3 shadow-2xl">
            {[
              { value: '12', label: 'threats blocked' },
              { value: '18ms', label: 'overhead' },
              { value: '0.5%', label: 'at 50K req/s' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-[15px] font-semibold text-white/90">{stat.value}</div>
                <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes hero-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, 20px) scale(1.05); }
          66% { transform: translate(-20px, -10px) scale(0.95); }
        }
        @keyframes hero-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(20px, -20px) scale(0.92); }
        }
        @keyframes hero-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(25px, -25px) scale(1.06); }
          66% { transform: translate(-15px, 15px) scale(0.94); }
        }
        @keyframes hero-drift-4 {
          0%, 100% { transform: translateX(-50%) translate(0, 0) scale(1); }
          33% { transform: translateX(-50%) translate(-20px, 15px) scale(1.04); }
          66% { transform: translateX(-50%) translate(15px, -10px) scale(0.96); }
        }
        @keyframes hero-drift-5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 25px) scale(1.03); }
        }
        @keyframes hero-float-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes hero-float-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes hero-float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes hero-float-4 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }
      `}</style>
    </div>
  )
}
