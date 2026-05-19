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
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1100px] h-[800px] bg-gradient-radial from-[#6366f1]/20 via-[#6366f1]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      </div>

      <Container>
        <div className="relative pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-16">
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

          {/* Full-width animated Console preview */}
          <div className="relative mt-16 sm:mt-20">
            {/* Subtle bottom-fade so it merges into the next section */}
            <div className="absolute inset-x-0 -bottom-px h-32 pointer-events-none bg-gradient-to-b from-transparent to-[rgb(10_11_13)] z-10" />
            <div className="relative rounded-2xl border border-[rgb(46_48_54)] bg-[rgb(14_15_18)] shadow-[0_30px_120px_-20px_rgba(99,102,241,0.25)] overflow-hidden">
              <AnimatedConsolePreview />
            </div>
          </div>
        </div>
      </Container>
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
