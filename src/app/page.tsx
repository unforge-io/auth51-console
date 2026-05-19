import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { ConsolePreview } from '@/components/marketing/ConsolePreview'
import { LiveApi } from '@/components/marketing/LiveApi'
import {
  ThreatsHomeSection,
  KubernetesAnalogySection,
  ProtocolSection,
  InstallSection,
} from '@/components/marketing/HomeSections'

/**
 * Auth51 homepage.
 *
 * Sequence:
 *  1. Hero — bold headline + live, embedded Console preview rendering the
 *     real agents table with the real classification components against a
 *     small synthetic snapshot. Same visual language as the running product.
 *  2. Live API — copy-pasteable curl commands against idp.auth51.com.
 *  3. Threats — 12 attacks, all blocked. Same data + visual as the Console
 *     threats catalog.
 *  4. K8s mental model — analogy table.
 *  5. Protocol — RFC 8693 + Agentic JWT draft credibility.
 *  6. Install — Python + a51 CLI samples.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <LiveApi />
      <ThreatsHomeSection />
      <KubernetesAnalogySection />
      <ProtocolSection />
      <InstallSection />
    </>
  )
}

function Hero() {
  return (
    <section className="relative bg-white border-b border-stone-200/60 overflow-hidden">
      {/* Subtle radial accent */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-30%] right-[-15%] w-[70%] h-[120%] bg-gradient-to-bl from-[#4338ca]/8 via-[#4338ca]/4 to-transparent rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="relative pt-32 sm:pt-36 lg:pt-40 pb-20 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1fr_540px] xl:grid-cols-[1fr_640px] gap-12 items-center">
          {/* Left — copy */}
          <div className="max-w-[560px]">
            <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-5">
              Identity · Intent · Audit · for AI agents
            </p>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[58px] font-semibold text-[#0a2540] leading-[1.04] tracking-tight text-balance">
              The control plane your AI agents need before production.
            </h1>
            <p className="mt-6 text-[17px] sm:text-[19px] text-[#425466] leading-relaxed text-pretty">
              Auth51 fingerprints every agent at runtime, binds every action to a declared intent,
              and rejects every call that doesn&apos;t match. Built on OAuth 2.0 Token Exchange
              and the Agentic JWT IETF draft. Running in production at <code className="font-mono text-[15px] text-[#0a2540]">idp.auth51.com</code>.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
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
            <div className="mt-10 flex items-center gap-4 text-[12px] text-[#8898aa]">
              <Stat number="12/12" label="threats blocked" />
              <Sep />
              <Stat number="+2.1ms" label="overhead" />
              <Sep />
              <Stat number="40+" label="live agents" />
            </div>
          </div>

          {/* Right — Console preview */}
          <div className="relative lg:translate-y-2">
            <ConsolePreview />
          </div>
        </div>
      </Container>
    </section>
  )
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[15px] font-semibold text-[#0a2540] tracking-tight font-mono">{number}</span>
      <span className="text-[#8898aa]">{label}</span>
    </span>
  )
}

function Sep() {
  return <span className="text-stone-300">·</span>
}
