import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Apps',
  description: 'Auth51 operator console — manage registered agents, workflows, and policies.',
}

export default function AppsPage() {
  return (
    <Container width="prose">
      <div className="py-section">
        <p className="eyebrow font-mono mb-3">OPERATOR CONSOLE</p>
        <h1 className="text-display-lg text-ink text-balance">
          Apps
        </h1>
        <p className="mt-4 text-body-lg text-ink-secondary">
          The Auth51 operator console — registered agents, live workflows,
          audit logs, and policy management.
        </p>

        <div className="mt-12 rounded-lg border-2 border-dashed border-line bg-bg-subtle p-8 text-center">
          <p className="text-body text-ink-tertiary">
            Deferred to Phase 2. The operator console will be auth-gated and
            connect to a live Auth51 Authority instance.
          </p>
        </div>
      </div>
    </Container>
  )
}
