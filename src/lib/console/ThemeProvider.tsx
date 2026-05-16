'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

/**
 * Theme provider for the Auth51 Console.
 *
 * - Default: dark mode (Linear-style).
 * - Persisted to localStorage under `auth51.console.theme`.
 * - Applied via `dark` class on <html> so Tailwind's darkMode: 'class' picks it up.
 * - Initial render uses an inline script in `<head>` to avoid a flash of wrong theme.
 *
 * The provider is *scoped to the Console route*. The marketing site keeps its
 * light editorial palette and is unaffected.
 */

type Theme = 'dark' | 'light'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'auth51.console.theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ConsoleThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read persisted preference on mount
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const initial: Theme = stored === 'light' || stored === 'dark' ? stored : 'dark'
    setThemeState(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, t)
    }
    applyTheme(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  // Render nothing until mounted to avoid SSR-mismatch flicker
  // (the inline script in layout.tsx handles initial paint)
  if (!mounted) {
    return <ThemeContext.Provider value={{ theme: 'dark', setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (t === 'dark') html.classList.add('dark')
  else html.classList.remove('dark')
}

export function useConsoleTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useConsoleTheme must be used inside ConsoleThemeProvider')
  return ctx
}

/**
 * Inline script for the document head — runs synchronously before paint
 * to set the correct theme class. Prevents flash-of-wrong-theme.
 *
 * Render this in the Console layout's <head> via dangerouslySetInnerHTML.
 */
export const themeBootScript = `
(function() {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`
