import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AnimatedConsolePreview } from '@/components/marketing/AnimatedConsolePreview'
import {
  ControlPlaneSection,
  LiveRegistrySection,
  DiscoverySection,
  WorkflowsSection,
  ThreatsSection,
  FederationSection,
  InstallSection,
  CtaSection,
} from '@/components/marketing/Sections'

/**
 * Auth51 homepage — Linear-style dark, full-width hero with the animated
 * Console preview placed below the headline (not side-by-side), followed by
 * deep sections explaining the control plane.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <ControlPlaneSection />
      <LiveRegistrySection />
      <DiscoverySection />
      <WorkflowsSection />
      <ThreatsSection />
      <FederationSection />
      <InstallSection />
      <CtaSection />
    </>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[rgb(10_11_13)]">
      {/* Ambient glow above */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[1200px] h-[900px] bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),rgba(99,102,241,0.06)_45%,transparent_70%)] rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
      </div>

      {/* ──────────── 3D Floor ────────────
          A perspective-projected grid plane that recedes from the bottom
          of the hero toward a vanishing point near the horizon. Sits
          behind the screenshot. Above the grid is a strong horizon glow;
          the floor itself is a clearly lighter band so it actually reads
          as a separate plane. */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Lighter floor plane fading into the back wall */}
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent from-0% via-[rgb(22_24_34)] via-45% to-[rgb(30_32_44)] to-100%" />

        {/* Perspective grid — the synthwave-style floor. A flat grid
            painted on a div that's rotated about its NEAR edge (bottom)
            so the FAR edge tilts back into the distance and the lines
            converge toward a vanishing point on the horizon. */}
        <div
          className="absolute left-1/2 bottom-0"
          style={{
            width: '260%',
            height: '900px',
            marginLeft: '-130%',
            transform: 'perspective(700px) rotateX(60deg)',
            transformOrigin: '50% 100%',
            backgroundImage: `
              linear-gradient(to right, rgba(165,180,252,0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(165,180,252,0.26) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            maskImage:
              'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.2) 60%, transparent 90%)',
            WebkitMaskImage:
              'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.2) 60%, transparent 90%)',
          }}
        />

        {/* Strong horizon glow — a wide warm bloom right at the seam */}
        <div
          className="absolute inset-x-0 top-0 h-[200px]"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(129,140,248,0.55) 0%, rgba(99,102,241,0.28) 25%, rgba(99,102,241,0.10) 50%, transparent 80%)',
            filter: 'blur(8px)',
          }}
        />

        {/* The horizon line itself — bright filament */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(199_210_254)] to-transparent opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[2px] blur-md bg-gradient-to-r from-transparent via-[rgb(165_180_252)] to-transparent opacity-80" />
      </div>

      <Container>
        <div className="relative pt-32 sm:pt-40 lg:pt-48 pb-32 sm:pb-44">
          {/* Headline — centered, above the screenshot */}
          <div className="mx-auto max-w-[860px] text-center">
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#818cf8] uppercase mb-6">
              Identity · Intent · Audit · for AI agents
            </p>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] font-semibold text-white leading-[1.02] tracking-tight text-balance">
              The control plane your AI agents need before production.
            </h1>
            <p className="mt-7 text-[17px] sm:text-[20px] text-[#b6bbc5] leading-relaxed text-pretty max-w-[680px] mx-auto">
              Auth51 fingerprints every agent at runtime, binds every action to a declared intent,
              and rejects every call that doesn&apos;t match. Built on OAuth 2.0 Token Exchange
              and the Agentic JWT IETF draft.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link href="/console">
                <Button variant="primary" size="lg">
                  Open the Console →
                </Button>
              </Link>
              <Link href="/walkthrough">
                <Button variant="secondary" size="lg">
                  How it works
                </Button>
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex items-center gap-4 text-[12.5px] text-[#8a8f98] justify-center">
              <Stat number="12/12" label="threats blocked" />
              <Sep />
              <Stat number="+2.1ms" label="overhead" />
              <Sep />
              <Stat number="40+" label="live agents" />
              <Sep />
              <span className="font-mono text-[#8a8f98]">idp.auth51.com</span>
            </div>
          </div>

          {/* ──────────── The screenshot on its stage ──────────── */}
          <div className="relative mt-20 sm:mt-24">
            {/* Soft top spotlight that lights the screenshot from above */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-32 w-[80%] h-[260px] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(165,180,252,0.18),transparent_60%)] blur-2xl"
              aria-hidden="true"
            />

            {/* Pool of light / contact shadow beneath the screenshot —
                this is what makes it look "placed" on a floor instead of
                floating against the wall. */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-12 w-[85%] h-[140px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.35),rgba(99,102,241,0.10)_45%,transparent_75%)]
                blur-2xl"
              aria-hidden="true"
            />
            {/* Tight contact shadow right under the screen — gives it weight */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-[75%] h-[60px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7),transparent_70%)] blur-xl"
              aria-hidden="true"
            />

            {/* The frame — multi-layer shadow, inner highlight on top edge,
                slightly lighter top-stripe to simulate ambient light. */}
            <div
              className="relative rounded-2xl overflow-hidden
                border border-[rgb(56_58_66)]
                bg-gradient-to-b from-[rgb(20_22_28)] via-[rgb(16_17_22)] to-[rgb(12_13_17)]
                shadow-[
                  0_2px_0_0_rgba(255,255,255,0.06)_inset,
                  0_-1px_0_0_rgba(0,0,0,0.5)_inset,
                  0_0_0_1px_rgba(255,255,255,0.04)_inset,
                  0_50px_120px_-30px_rgba(0,0,0,0.95),
                  0_30px_80px_-20px_rgba(99,102,241,0.40),
                  0_80px_140px_-40px_rgba(99,102,241,0.25)
                ]"
            >
              {/* Subtle top highlight strip — ambient light catching the bezel */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(165_180_252_/_0.6)] to-transparent" />
              <AnimatedConsolePreview />
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom merge into next section */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-[rgb(38_39_43_/_0.7)]" aria-hidden="true" />
    </section>
  )
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[14px] font-semibold text-white tracking-tight font-mono">{number}</span>
      <span className="text-[#8a8f98]">{label}</span>
    </span>
  )
}

function Sep() {
  return <span className="text-[#46484e]">·</span>
}
