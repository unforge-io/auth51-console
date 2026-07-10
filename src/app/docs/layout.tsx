import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { DocsSidebar } from '@/components/docs/DocsSidebar'
import { OnThisPage } from '@/components/docs/OnThisPage'

export const metadata: Metadata = {
  title: { default: 'Docs', template: '%s · auth51 docs' },
}

/**
 * Three-column docs shell (Kubernetes / Stripe style). Uses the same
 * <Container> as the marketing header — same 1360px cap with padding *outside*
 * the cap — so the docs columns line up edge-to-edge with the header: the left
 * nav's left edge sits under the logo, the right rail's right edge under the
 * "Open Console" button. pt-14 clears the fixed h-14 header; every page shares
 * the same py-12 so titles start at a consistent height.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-14">
      <Container>
        <div className="flex gap-10 xl:gap-12">
          {/* left — section navigation */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-12">
              <DocsSidebar />
            </div>
          </aside>

          {/* center — content */}
          <main className="min-w-0 flex-1 py-12">
            <div data-doc-content className="max-w-3xl">{children}</div>
          </main>

          {/* right — on this page */}
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-12">
              <OnThisPage />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  )
}
