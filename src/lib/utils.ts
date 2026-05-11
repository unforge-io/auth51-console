import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx-style conditional logic.
 * Standard utility used by every component in the codebase.
 *
 * Example:
 *   cn('text-ink', isActive && 'text-brand', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
