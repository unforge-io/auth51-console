'use client'

import { ACT_CONTENT } from '@/lib/walkthrough/content'
import { RoadSign } from '../RoadSign'
import type { WalkthroughAction } from '@/lib/walkthrough/state'
import Link from 'next/link'

type Props = {
  dispatch: React.Dispatch<WalkthroughAction>
}

const content = ACT_CONTENT[6]

export function Act6TryItLive({ dispatch }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">{content.eyebrow}</p>
        <h2 className="text-display text-ink text-balance">{content.title}</h2>
      </div>

      <p className="max-w-narrative text-body-lg text-ink-secondary">
        {content.narrative}
      </p>

      {/* Coming soon placeholder */}
      <div className="rounded-lg border-2 border-dashed border-line bg-bg-subtle p-8 text-center">
        <div className="text-4xl mb-4">🚀</div>
        <p className="text-body text-ink-secondary">{content.placeholder}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/protocol"
            className="inline-flex items-center gap-2 rounded border border-line bg-bg px-4 py-2 text-body-sm font-medium text-ink no-underline hover:bg-bg-subtle transition-colors"
          >
            Protocol Spec →
          </Link>
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 rounded border border-line bg-bg px-4 py-2 text-body-sm font-medium text-ink no-underline hover:bg-bg-subtle transition-colors"
          >
            Architecture →
          </Link>
        </div>
      </div>

      {/* Restart */}
      <div className="pt-4 flex gap-3">
        <RoadSign variant="info" onClick={() => dispatch({ type: 'RESET' })}>
          ↺ Restart walkthrough
        </RoadSign>
      </div>
    </div>
  )
}
