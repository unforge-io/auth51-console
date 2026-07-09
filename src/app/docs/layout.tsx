import type { Metadata } from 'next'
import { DocsSidebar } from '@/components/docs/DocsSidebar'

export const metadata: Metadata = {
  title: { default: 'Docs', template: '%s · auth51 docs' },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-16">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 flex gap-12">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 py-10 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <DocsSidebar />
          </div>
        </aside>
        <div className="min-w-0 flex-1 py-10 max-w-3xl">{children}</div>
      </div>
    </div>
  )
}
