'use client'

import { cn } from '@/lib/utils'

type RoadSignVariant = 'continue' | 'branch' | 'failure' | 'success' | 'info'

type Props = {
  variant: RoadSignVariant
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

/**
 * Road-sign navigation buttons — the walkthrough's signature element.
 *
 * - Continue ▶  navy border, white bg
 * - Branch  ◆  amber border, amber-50 bg (diamond shape via CSS)
 * - Failure ✗  red border, red-50 bg
 * - Success ✓  green border, green-50 bg
 * - Info    ⓘ  gray border, gray-50 bg
 */
const VARIANT_STYLES: Record<RoadSignVariant, string> = {
  continue:
    'border-brand bg-bg text-brand hover:bg-brand hover:text-ink-inverted',
  branch:
    'border-signal-warning bg-amber-50 text-amber-800 hover:bg-amber-100',
  failure:
    'border-signal-danger bg-red-50 text-red-800',
  success:
    'border-signal-success bg-emerald-50 text-emerald-800',
  info:
    'border-line-strong bg-bg-subtle text-ink-secondary',
}

const VARIANT_ICONS: Record<RoadSignVariant, string> = {
  continue: '▶',
  branch: '◆',
  failure: '✗',
  success: '✓',
  info: 'ⓘ',
}

export function RoadSign({ variant, children, onClick, className }: Props) {
  const isClickable = !!onClick
  const Component = isClickable ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md border-2 px-5 py-3.5 text-body-sm font-medium transition-colors',
        VARIANT_STYLES[variant],
        isClickable && 'cursor-pointer',
        className,
      )}
    >
      <span className="text-lg" aria-hidden="true">
        {VARIANT_ICONS[variant]}
      </span>
      <span>{children}</span>
    </Component>
  )
}
