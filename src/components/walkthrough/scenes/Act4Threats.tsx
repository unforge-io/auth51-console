'use client'

import { ACT_CONTENT } from '@/lib/walkthrough/content'
import { RoadSign } from '../RoadSign'
import type { WalkthroughState, WalkthroughAction, ThreatBranch } from '@/lib/walkthrough/state'

type Props = {
  state: WalkthroughState
  dispatch: React.Dispatch<WalkthroughAction>
}

const content = ACT_CONTENT[4]
const BRANCHES: ThreatBranch[] = [
  'fraudulent-vendor',
  'rogue-assistant',
  'stolen-letter',
  'substituted-producer',
]

export function Act4Threats({ state, dispatch }: Props) {
  const activeBranch = state.threatBranch
  const branch = activeBranch ? content.branches[activeBranch] : null

  // If a branch is open, show it
  if (branch && activeBranch) {
    return (
      <div className="space-y-8">
        <div>
          <p className="eyebrow mb-3">{content.eyebrow}</p>
          <h2 className="text-display text-ink text-balance">
            {branch.icon} {branch.title}
          </h2>
          <p className="mt-2 text-body-sm text-ink-tertiary font-mono">
            Real-world parallel: {branch.realWorldParallel}
          </p>
        </div>

        {/* Without Auth51 */}
        <div className="rounded-lg border-2 border-signal-danger bg-red-50/50 p-6 space-y-3">
          <h3 className="text-h3 text-red-800">Without Auth51</h3>
          <p className="text-body text-red-700">{branch.withoutAuth51.narrative}</p>
          <RoadSign variant="failure">{branch.withoutAuth51.outcome}</RoadSign>
        </div>

        {/* With Auth51 */}
        <div className="rounded-lg border-2 border-signal-success bg-emerald-50/50 p-6 space-y-3">
          <h3 className="text-h3 text-emerald-800">With Auth51</h3>
          <p className="text-body text-emerald-700">{branch.withAuth51.narrative}</p>
          <RoadSign variant="success">{branch.withAuth51.outcome}</RoadSign>
          {branch.withAuth51.anchor && (
            <p className="text-caption text-emerald-600 font-mono mt-2">
              Anchor: {branch.withAuth51.anchor}
            </p>
          )}
        </div>

        <div className="pt-4">
          <RoadSign
            variant="continue"
            onClick={() => dispatch({ type: 'CLOSE_BRANCH' })}
          >
            ← Back to threat scenarios
          </RoadSign>
        </div>
      </div>
    )
  }

  // Branch selection view
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">{content.eyebrow}</p>
        <h2 className="text-display text-ink text-balance">{content.title}</h2>
      </div>

      <div className="max-w-narrative text-body-lg text-ink-secondary">
        <p>{content.narrative}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BRANCHES.map((branchKey) => {
          const b = content.branches[branchKey]
          const visited = state.branchesVisited.includes(branchKey)
          return (
            <RoadSign
              key={branchKey}
              variant="branch"
              onClick={() => dispatch({ type: 'OPEN_BRANCH', branch: branchKey })}
              className={visited ? 'opacity-60' : ''}
            >
              <span>
                {b.icon} {b.title}
                {visited && <span className="ml-2 text-xs opacity-70">✓ visited</span>}
              </span>
            </RoadSign>
          )
        })}
      </div>

      <div className="pt-4">
        <RoadSign variant="continue" onClick={() => dispatch({ type: 'NEXT' })}>
          Continue — The translation to real components
        </RoadSign>
      </div>
    </div>
  )
}
