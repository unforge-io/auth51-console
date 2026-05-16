import type { Metadata } from 'next'
import { ConsoleThemeProvider, themeBootScript } from '@/lib/console/ThemeProvider'
import { ControlPlaneProvider } from '@/lib/console/controlPlane'
import { SidebarWidthProvider } from '@/lib/console/sidebarWidth'
import { Sidebar } from '@/components/console/Sidebar'
import { ConsoleHeader } from '@/components/console/ConsoleHeader'

export const metadata: Metadata = {
  title: 'Auth51 Console',
  description: 'Identity, authorization, and audit for AI agents.',
}

/**
 * Console layout — completely separate from the marketing site.
 *
 * - No marketing header / footer
 * - Inline theme boot script avoids flash-of-wrong-theme
 * - Full-bleed flex layout: Sidebar | { Header / Main }
 */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Inline script: set dark/light class before first paint */}
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />

      <ConsoleThemeProvider>
        <ControlPlaneProvider>
          <SidebarWidthProvider>
            <div className="h-screen w-screen flex bg-c-bg text-c-text overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <ConsoleHeader />
                <main className="flex-1 overflow-y-auto bg-c-bg">
                  {children}
                </main>
              </div>
            </div>
          </SidebarWidthProvider>
        </ControlPlaneProvider>
      </ConsoleThemeProvider>
    </>
  )
}
