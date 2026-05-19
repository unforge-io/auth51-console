import { cn } from '@/lib/utils'

type ContainerProps = {
  children: React.ReactNode
  className?: string
  /**
   * Width preset for the inner content column.
   * - `default` — 1200px max, used for diagrams/grids
   * - `prose` — 640px max, used for body copy
   * - `narrative` — 736px max, used for the walkthrough body
   */
  width?: 'default' | 'prose' | 'narrative' | 'content'
}

/**
 * Standard page-content wrapper. Provides horizontal padding consistently
 * across pages and centers the inner content at the chosen max-width.
 */
export function Container({
  children,
  className,
  width = 'default',
}: ContainerProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div
        className={cn(
          'mx-auto w-full',
          width === 'default' && 'max-w-[1360px]',
          width === 'prose' && 'max-w-prose',
          width === 'narrative' && 'max-w-narrative',
          width === 'content' && 'max-w-content',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
