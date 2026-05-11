import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { WalkthroughClient } from '@/components/walkthrough/WalkthroughClient'
import { WALKTHROUGH_INTRO } from '@/lib/walkthrough/content'

export const metadata: Metadata = {
  title: 'Walkthrough',
  description: WALKTHROUGH_INTRO.subtitle,
}

/**
 * /walkthrough — full-width layout matching header content area.
 * The flow diagram takes the full container width.
 */
export default function WalkthroughPage() {
  return (
    <Container>
      <div className="pt-10 sm:pt-14 pb-4">
        <p className="font-mono text-[11px] font-semibold tracking-wider text-[#635bff] uppercase mb-3">
          INTERACTIVE WALKTHROUGH
        </p>
        <h1 className="text-[36px] sm:text-[44px] font-semibold text-[#0a2540] text-balance leading-[1.1] tracking-tight">
          {WALKTHROUGH_INTRO.title}
        </h1>
        <p className="mt-4 max-w-[600px] text-[16px] text-[#425466] text-pretty leading-relaxed">
          {WALKTHROUGH_INTRO.subtitle}
        </p>
      </div>

      <div className="pb-16">
        <WalkthroughClient />
      </div>
    </Container>
  )
}
