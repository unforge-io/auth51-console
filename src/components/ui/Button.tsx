import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Auth51 Button — Stripe-inspired styling.
 *
 * Visual treatment:
 * - Primary:   bold, high-contrast. Dark near-black bg with white text, rounded-full.
 *              Stands out clearly against any surface. Stripe uses this for their main CTAs.
 * - Secondary: white bg, dark text, prominent border. Clear and professional.
 * - Ghost:     transparent, dark text. For tertiary actions.
 * - Accent:    brand accent blue bg, white text. For special highlight CTAs.
 *
 * All: generous padding, medium font weight, smooth transitions, pill shape on lg.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[#0a2540] text-white hover:bg-[#1a3a5c] shadow-sm hover:shadow-md rounded-full',
        secondary:
          'bg-white text-[#0a2540] border border-stone-300 hover:border-stone-400 hover:shadow-sm rounded-full',
        ghost:
          'text-ink hover:bg-bg-subtle rounded-md',
        accent:
          'bg-[#635bff] text-white hover:bg-[#5851db] shadow-sm hover:shadow-md rounded-full',
      },
      size: {
        sm: 'h-8 px-4 text-[13px]',
        md: 'h-10 px-5 text-[14px]',
        lg: 'h-12 px-8 text-[15px] font-semibold',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
