import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  wordmarkOnly?: boolean
}

/**
 * Auth51 wordmark — uses Stripe's #0a2540 navy.
 * The triangle mark references the three anchors (A2, A6, A8).
 */
export function Logo({ className, wordmarkOnly = false }: LogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[#4338ca] font-sans font-semibold tracking-tight',
        className,
      )}
    >
      {!wordmarkOnly && (
        <svg
          width="22"
          height="22"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="10" cy="3.5" r="2" fill="#4338ca" />
          <circle cx="3.5" cy="15" r="2" fill="#4338ca" />
          <circle cx="16.5" cy="15" r="2" fill="#4338ca" />
          <path
            d="M10 5.5L4 13.5M10 5.5L16 13.5M5 15H15"
            stroke="#4338ca"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      )}
      <span>Auth51</span>
    </span>
  )
}
