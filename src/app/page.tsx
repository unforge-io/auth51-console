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
      {/* Ambient glow above — neutral cool-white, just enough to lift the
          area behind the headline above pure black. No saturated color
          (saturated bloom on black reads as artificial). */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1300px] h-[900px] bg-[radial-gradient(closest-side,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_45%,transparent_75%)] rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
      </div>

      {/* ──────────── Floor ────────────
          A pure neutral gradient. The base is rgb(10,11,13) — almost
          black. As the eye moves down the hero, the surface gradually
          lifts to a charcoal grey (rgb 24,26,30). No seam, no horizon
          line, no colored bloom — black-to-purple looks artificial.
          The depth comes from a very faint receding grid in the same
          neutral grey, just enough to feel like a surface. */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Lighter floor plane — long, smooth fade from bg to a slightly
            lighter charcoal. The change happens over the full height so
            it reads as gradient, not partition. */}
        <div
          className="absolute inset-x-0 bottom-0 h-full"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.012) 30%, rgba(255,255,255,0.028) 60%, rgba(255,255,255,0.045) 100%)',
          }}
        />

        {/* Receding grid — neutral grey, very low contrast. Just enough
            to suggest a surface beneath the screenshot. */}
        <div
          className="absolute left-1/2 bottom-0"
          style={{
            width: '260%',
            height: '1000px',
            marginLeft: '-130%',
            transform: 'perspective(800px) rotateX(62deg)',
            transformOrigin: '50% 100%',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '90px 90px',
            maskImage:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 35%, transparent 80%)',
            WebkitMaskImage:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 35%, transparent 80%)',
          }}
        />
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
            {/* Wide soft drop shadow — gives the frame its weight. Pure
                neutral; no colored bloom (would read as artificial). */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-[90%] h-[180px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65),rgba(0,0,0,0.25)_40%,transparent_75%)]
                blur-2xl"
              aria-hidden="true"
            />
            {/* Tight contact shadow right under the bottom edge */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-[75%] h-[50px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.75),transparent_70%)] blur-xl"
              aria-hidden="true"
            />

            {/* The frame — multi-layer neutral shadow, inner highlight on
                the top edge for ambient light catching the bezel. */}
            <div
              className="relative rounded-2xl overflow-hidden
                border border-[rgb(56_58_66)]
                bg-gradient-to-b from-[rgb(20_22_28)] via-[rgb(16_17_22)] to-[rgb(12_13_17)]
                shadow-[
                  0_2px_0_0_rgba(255,255,255,0.06)_inset,
                  0_-1px_0_0_rgba(0,0,0,0.5)_inset,
                  0_0_0_1px_rgba(255,255,255,0.04)_inset,
                  0_60px_140px_-30px_rgba(0,0,0,0.95),
                  0_30px_80px_-30px_rgba(0,0,0,0.7)
                ]"
            >
              {/* Subtle top highlight strip — ambient light on the bezel */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(255_255_255_/_0.12)] to-transparent" />
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
