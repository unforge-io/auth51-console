'use client'

import { ACT_CONTENT } from '@/lib/walkthrough/content'
import { RoadSign } from '../RoadSign'
import type { WalkthroughAction } from '@/lib/walkthrough/state'

type Props = {
  dispatch: React.Dispatch<WalkthroughAction>
}

const content = ACT_CONTENT[1]

export function Act1Setup({ dispatch }: Props) {
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

      {content.aside && (
        <aside className="rounded-md border border-line bg-bg-subtle px-5 py-4 text-body-sm text-ink-secondary">
          <span className="mr-2 text-ink-tertiary">ⓘ</span>
          {content.aside}
        </aside>
      )}

      <div className="pt-4">
        <RoadSign variant="continue" onClick={() => dispatch({ type: 'NEXT' })}>
          Continue — How authorization works today
        </RoadSign>
      </div>
    </div>
  )
}
