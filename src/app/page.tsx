import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AnimatedConsolePreview } from '@/components/marketing/AnimatedConsolePreview'
import {
  RuntimeIdentitySection,
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
 * deep sections explaining runtime identity and per-action authorization.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <RuntimeIdentitySection />
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
              Climbs to ~32% white at the viewer's feet. Almost very
              light grey at the bottom so the floor reads as a clearly
              lit surface, not just darker bg. */}
        <div
          className="absolute inset-x-0 bottom-0 h-full"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(255,255,255,0) 0%,
                rgba(255,255,255,0.018) 14%,
                rgba(255,255,255,0.048) 30%,
                rgba(255,255,255,0.105) 48%,
                rgba(255,255,255,0.180) 66%,
                rgba(255,255,255,0.265) 84%,
                rgba(255,255,255,0.320) 100%
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
              Runtime identity · Per-action authorization · for AI agents
            </p>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] font-semibold text-white leading-[1.04] tracking-tight text-balance">
              Verify the agent behind every action.
            </h1>
            <p className="mt-7 text-[17px] sm:text-[20px] text-[#b6bbc5] leading-relaxed text-pretty max-w-[680px] mx-auto">
              Valid credentials do not prove which agent is actually acting. Auth51 derives identity
              from the running agent&apos;s observed system prompt, tools, and configuration, then binds
              each approved action to a per-action token enforced at the resource server.
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
            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-[#8a8f98] justify-center">
              <Stat number="12/12" label="implemented scenarios blocked" />
              <Sep />
              <Stat number="+2.1ms" label="per token mint" />
              <Sep />
              <Stat number="1" label="client import" />
              <Sep />
              <span className="font-mono text-[#8a8f98]">OAuth 2.0 compatible</span>
            </div>
          </div>

          {/* ──────────── The screenshot, placed on the floor ────────
              Linear-style ambient occlusion: the floor is LIT in front
              of the screen (no shadow in the center) and DARK only at
              the two bottom corners, where it both extends outward
              along the floor and climbs briefly up the side edges. */}
          <div
            className="relative mt-20 sm:mt-24"
            style={{ perspective: '2400px' }}
          >
            {/* (1) Center light spill — the floor directly in front of
                  the screen is BRIGHTER than the rest. Replaces the
                  old dark-under-the-screen ellipse. */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-[62%] h-[180px] pointer-events-none
                bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.13),rgba(255,255,255,0.05)_45%,transparent_78%)]
                blur-2xl"
              aria-hidden="true"
            />

            {/* (2) LEFT CORNER ambient-occlusion L
                  ─ A flat dark patch on the floor extending LEFT
                    from the screen's lower-left corner.
                  ─ A small vertical climb up the screen's left edge
                    (~25 px), the height the user asked for. */}
            <div
              className="absolute -left-[140px] -bottom-1 w-[260px] h-[42px] pointer-events-none
                bg-[radial-gradient(ellipse_at_right,rgba(0,0,0,0.95),rgba(0,0,0,0.55)_30%,rgba(0,0,0,0.18)_60%,transparent_82%)]
                blur-[10px]"
              aria-hidden="true"
            />
            <div
              className="absolute -left-[6px] -bottom-1 w-[28px] h-[64px] pointer-events-none
                bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),rgba(0,0,0,0.55)_28%,rgba(0,0,0,0.18)_60%,transparent_82%)]
                blur-md"
              aria-hidden="true"
            />

            {/* (3) RIGHT CORNER ambient-occlusion L — mirror of (2) */}
            <div
              className="absolute -right-[140px] -bottom-1 w-[260px] h-[42px] pointer-events-none
                bg-[radial-gradient(ellipse_at_left,rgba(0,0,0,0.95),rgba(0,0,0,0.55)_30%,rgba(0,0,0,0.18)_60%,transparent_82%)]
                blur-[10px]"
              aria-hidden="true"
            />
            <div
              className="absolute -right-[6px] -bottom-1 w-[28px] h-[64px] pointer-events-none
                bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),rgba(0,0,0,0.55)_28%,rgba(0,0,0,0.18)_60%,transparent_82%)]
                blur-md"
              aria-hidden="true"
            />

            {/* The frame — slight backward tilt for 3D. We deliberately
                avoid a deep y-offset drop shadow because that would
                throw a halo onto the lit floor in front of the screen.
                Body weight + corner anchoring is done by the L-shaped
                shadows above. Only inset highlights here. */}
            <div
              className="relative rounded-2xl overflow-hidden
                border border-[rgb(56_58_66)]
                bg-gradient-to-b from-[rgb(20_22_28)] via-[rgb(16_17_22)] to-[rgb(12_13_17)]
                shadow-[
                  0_2px_0_0_rgba(255,255,255,0.07)_inset,
                  0_-1px_0_0_rgba(0,0,0,0.5)_inset,
                  0_0_0_1px_rgba(255,255,255,0.04)_inset,
                  0_10px_30px_-15px_rgba(0,0,0,0.5)
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

            {/* Extra reflection bloom further down the floor —
                continues the lit-area illusion away from the screen */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-32 w-[78%] h-[180px] pointer-events-none
                bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_45%,transparent_78%)]
                blur-3xl"
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
