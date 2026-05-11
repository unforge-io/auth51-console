'use client'

import { cn } from '@/lib/utils'
import { type Act, ACT_TITLES } from '@/lib/walkthrough/state'

type Props = {
  currentAct: Act
  onJump: (act: Act) => void
}

const ACTS: Act[] = [1, 2, 3, 4, 5, 6]

/**
 * Horizontal progress bar showing all 6 acts.
 * Current act is highlighted with brand navy; completed acts are filled.
 * Each act is clickable for non-linear navigation.
 */
export function ProgressIndicator({ currentAct, onJump }: Props) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {ACTS.map((act) => {
        const isCurrent = act === currentAct
        const isCompleted = act < currentAct

        return (
          <button
            key={act}
            onClick={() => onJump(act)}
            className={cn(
              'group flex flex-1 flex-col items-center gap-1.5 transition-colors',
            )}
            aria-label={`Act ${act}: ${ACT_TITLES[act]}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {/* Progress bar segment */}
            <div
              className={cn(
                'h-1 w-full rounded-full transition-colors',
                isCurrent && 'bg-brand',
                isCompleted && 'bg-brand/40',
                !isCurrent && !isCompleted && 'bg-line',
              )}
            />
            {/* Label — visible on sm+ */}
            <span
              className={cn(
                'hidden sm:block text-[11px] font-medium transition-colors',
                isCurrent && 'text-brand',
                isCompleted && 'text-ink-secondary',
                !isCurrent && !isCompleted && 'text-ink-muted',
                'group-hover:text-ink-secondary',
              )}
            >
              {ACT_TITLES[act]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
