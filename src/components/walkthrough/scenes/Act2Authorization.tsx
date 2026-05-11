'use client'

import { ACT_CONTENT } from '@/lib/walkthrough/content'
import { RoadSign } from '../RoadSign'
import { SideBySidePanel } from '../SideBySidePanel'
import type { WalkthroughAction } from '@/lib/walkthrough/state'

type Props = {
  dispatch: React.Dispatch<WalkthroughAction>
}

const content = ACT_CONTENT[2]

export function Act2Authorization({ dispatch }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">{content.eyebrow}</p>
        <h2 className="text-display text-ink text-balance">{content.title}</h2>
      </div>

      <div className="max-w-narrative space-y-4 text-body-lg text-ink-secondary">
        {content.narrative.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <SideBySidePanel
        oauth={content.comparison.oauth}
        auth51={content.comparison.auth51}
      />

      <div className="pt-4">
        <RoadSign variant="continue" onClick={() => dispatch({ type: 'NEXT' })}>
          Continue — How delegation works
        </RoadSign>
      </div>
    </div>
  )
}
