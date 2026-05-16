import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { LayoutShell } from '@/components/layout/LayoutShell'
import './globals.css'

/**
 * Inter — primary typeface. Variable font, optimized via next/font.
 * Same family Linear, Stripe Docs, and Vercel use.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

/**
 * JetBrains Mono — used in code blocks, inline code, mono eyebrows.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://auth51.com'),
  title: {
    default: 'Auth51 — Identity, authorization, and audit for AI agents',
    template: '%s · Auth51',
  },
  description:
    'Auth51 is the control plane that lets your enterprise deploy AI agents safely — registered, scope-bound, and provably tied to approved code.',
  applicationName: 'Auth51',
  keywords: [
    'agent identity',
    'agentic JWT',
    'AI agent security',
    'OAuth for agents',
    'agent authorization',
    'IETF',
    'draft-goswami-agentic-jwt',
  ],
  authors: [{ name: 'Unforge' }],
  creator: 'Unforge',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://auth51.com',
    siteName: 'Auth51',
    title: 'Auth51 — Identity, authorization, and audit for AI agents',
    description:
      'The control plane that lets your enterprise deploy AI agents safely.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auth51 — Identity, authorization, and audit for AI agents',
    description:
      'The control plane that lets your enterprise deploy AI agents safely.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
