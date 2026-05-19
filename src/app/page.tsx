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
          No grid, no perspective tricks. The floor is established by:
            1. A long, smooth color fade — bg through ~9% white over the
               bottom 75% of the hero. Continuous contrast, no seam.
            2. A wide soft spotlight on the floor where the screen sits,
               reading as the screen casting light forward onto the
               ground in front of it.
       */}
      <div className="absolute inset-x-0 bottom-0 h-[75%] pointer-events-none overflow-hidden" aria-hidden="true">
        {/* 1. Floor plane — long multi-stop fade, neutral cool grey.
              Brighter terminal stop (~15% white) so the floor reads as
              clearly lit at the viewer's feet. */}
        <div
          className="absolute inset-x-0 bottom-0 h-full"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(255,255,255,0) 0%,
                rgba(255,255,255,0.008) 18%,
                rgba(255,255,255,0.028) 36%,
                rgba(255,255,255,0.058) 56%,
                rgba(255,255,255,0.098) 76%,
                rgba(255,255,255,0.135) 92%,
                rgba(255,255,255,0.155) 100%
              )`,
          }}
        />

        {/* 2. Spotlight on the floor — the screen casting light onto
              the ground in front of it. Warm-white, very wide, blurred. */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[40%] w-[78%] h-[520px]"
          style={{
            background:
              'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 35%, transparent 72%)',
            filter: 'blur(28px)',
          }}
        />
      </div>

      <Container>
        <div className="relative pt-32 sm:pt-40 lg:pt-48 pb-32 sm:pb-44">
          {/* Headline — centered, above the screenshot. Wide enough that
              the headline breaks into 2 lines at lg, not 3. */}
          <div className="mx-auto max-w-[1120px] text-center">
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#818cf8] uppercase mb-6">
              Identity · Intent · Audit · for AI agents
            </p>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] font-semibold text-white leading-[1.04] tracking-tight text-balance">
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

          {/* ──────────── The screenshot, placed on the floor ────────
              Three contact-shadow layers anchor it where it touches the
              ground, plus a wide ambient drop shadow for body weight,
              plus a faint ground reflection beneath. */}
          <div
            className="relative mt-20 sm:mt-24"
            style={{ perspective: '2400px' }}
          >
            {/* (a) Wide ambient — soft body shadow spreading outward */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-20 w-[110%] h-[300px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85),rgba(0,0,0,0.35)_40%,transparent_78%)]
                blur-3xl"
              aria-hidden="true"
            />
            {/* (b) Medium — softer, narrower band right under */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-[92%] h-[140px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.95),rgba(0,0,0,0.45)_45%,transparent_78%)]
                blur-2xl"
              aria-hidden="true"
            />
            {/* (c) Razor contact line — the thing that anchors it. A
                  very tight ellipse hugging the base edge, FULL black,
                  almost not blurred. This is the "object on a table"
                  shadow that sells it. */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-px w-[78%] h-[28px] pointer-events-none
                bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,1),rgba(0,0,0,0.7)_30%,transparent_72%)]
                blur-md"
              aria-hidden="true"
            />

            {/* The frame — slight backward tilt for 3D, multi-layer
                neutral shadow, top-edge highlight for ambient light */}
            <div
              className="relative rounded-2xl overflow-hidden
                border border-[rgb(56_58_66)]
                bg-gradient-to-b from-[rgb(20_22_28)] via-[rgb(16_17_22)] to-[rgb(12_13_17)]
                shadow-[
                  0_2px_0_0_rgba(255,255,255,0.07)_inset,
                  0_-1px_0_0_rgba(0,0,0,0.5)_inset,
                  0_0_0_1px_rgba(255,255,255,0.04)_inset,
                  0_70px_160px_-30px_rgba(0,0,0,0.95),
                  0_30px_80px_-25px_rgba(0,0,0,0.8)
                ]"
              style={{
                transform: 'rotateX(2.5deg)',
                transformOrigin: '50% 100%',
              }}
            >
              {/* Subtle top highlight strip — ambient light on the bezel */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(255_255_255_/_0.14)] to-transparent" />
              <AnimatedConsolePreview />
            </div>

            {/* Faint reflection on the floor — a darkened, gradient-faded
                copy of the bottom strip of the screenshot's surface,
                mirrored. We can't easily mirror a live React component,
                so simulate the effect with a soft warm-white horizontal
                band that reads as floor catching the screen's light. */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-24 w-[80%] h-[160px] pointer-events-none rounded-[40%]
                bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_40%,transparent_75%)]
                blur-2xl"
              aria-hidden="true"
            />
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
