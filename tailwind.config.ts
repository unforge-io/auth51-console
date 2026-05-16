import type { Config } from 'tailwindcss'

/**
 * Auth51 design tokens.
 *
 * Philosophy: warm-neutral surface + restrained brand color.
 * - 90% of the screen is grayscale (warm stone, not cold zinc).
 * - Brand navy and accent blue used sparingly for emphasis.
 * - Semantic colors (success/warning/danger) appear only where they carry meaning.
 *
 * Reference aesthetic: Anthropic + Linear + Stripe. Editorial, technical, considered.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        // Map common semantic names to CSS custom properties so Tailwind classes
        // remain ergonomic while values come from globals.css.
        bg: {
          DEFAULT: 'rgb(var(--bg-primary) / <alpha-value>)',
          subtle: 'rgb(var(--bg-subtle) / <alpha-value>)',
          muted: 'rgb(var(--bg-muted) / <alpha-value>)',
          inverted: 'rgb(var(--bg-inverted) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          inverted: 'rgb(var(--text-inverted) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--border-default) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
          emphasis: 'rgb(var(--border-emphasis) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
        },
        signal: {
          success: 'rgb(var(--color-success) / <alpha-value>)',
          warning: 'rgb(var(--color-warning) / <alpha-value>)',
          danger: 'rgb(var(--color-danger) / <alpha-value>)',
          info: 'rgb(var(--color-info) / <alpha-value>)',
        },
        // ─── Console palette (Linear-style, theme-aware) ───
        c: {
          bg:        'rgb(var(--c-bg) / <alpha-value>)',
          surface:   'rgb(var(--c-surface) / <alpha-value>)',
          'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
          border:    'rgb(var(--c-border) / <alpha-value>)',
          'border-2':'rgb(var(--c-border-2) / <alpha-value>)',
          text:      'rgb(var(--c-text) / <alpha-value>)',
          'text-2':  'rgb(var(--c-text-2) / <alpha-value>)',
          'text-3':  'rgb(var(--c-text-3) / <alpha-value>)',
          accent:    'rgb(var(--c-accent) / <alpha-value>)',
          'accent-2':'rgb(var(--c-accent-2) / <alpha-value>)',
          success:   'rgb(var(--c-success) / <alpha-value>)',
          warning:   'rgb(var(--c-warning) / <alpha-value>)',
          danger:    'rgb(var(--c-danger) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Modern type scale — heroes are larger than the old Google Workspaces era.
        // Pairs with Inter; line-heights tuned for editorial readability.
        'display-2xl': ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-lg':  ['3rem',    { lineHeight: '1.1',  letterSpacing: '-0.022em', fontWeight: '600' }],
        'display':     ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'h1':          ['2rem',    { lineHeight: '1.2',  letterSpacing: '-0.018em', fontWeight: '600' }],
        'h2':          ['1.5rem',  { lineHeight: '1.3',  letterSpacing: '-0.015em', fontWeight: '600' }],
        'h3':          ['1.25rem', { lineHeight: '1.4',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'body-lg':     ['1.125rem',{ lineHeight: '1.65' }],
        'body':        ['1rem',    { lineHeight: '1.65' }],
        'body-sm':     ['0.875rem',{ lineHeight: '1.55' }],
        'caption':     ['0.8125rem',{ lineHeight: '1.45', letterSpacing: '0.005em' }],
        'eyebrow':     ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.08em',   fontWeight: '500' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        prose: '40rem',     // 640px — comfortable reading column
        narrative: '46rem', // 736px — slightly wider for walkthrough body text
        content: '64rem',   // 1024px — diagrams, side-by-side panels
      },
      spacing: {
        // Section rhythm — 96/128px between major sections on desktop.
        section: '6rem',
        'section-lg': '8rem',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        // Very subtle — used sparingly. Most surfaces use borders, not shadows.
        sm:  '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        // Focus ring used by inputs/buttons.
        focus: '0 0 0 3px rgb(var(--brand-accent) / 0.18)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
