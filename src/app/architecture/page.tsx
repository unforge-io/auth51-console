import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'Auth51 deployment topology — components, Kubernetes mapping, HA story, and deployment options.',
}

export default function ArchitecturePage() {
  return (
    <Container width="prose">
      <div className="py-section">
        <p className="eyebrow font-mono mb-3">ARCHITECTURE</p>
        <h1 className="text-display-lg text-ink text-balance">
          Deployment Topology
        </h1>
        <p className="mt-4 text-body-lg text-ink-secondary">
          Auth51 deploys like Kubernetes itself. If your operations team can run
          K8s, they can run Auth51 — same Helm charts, same CRDs, same
          DaemonSet/Sidecar/Gateway patterns, same HA primitives.
        </p>

        <div className="mt-12 rounded-lg border-2 border-dashed border-line bg-bg-subtle p-8 text-center">
          <p className="text-body text-ink-tertiary">
            Coming in Session 2. The architecture page will include the K8s
            component mapping, HA story, and deployment topology diagram.
          </p>
        </div>
      </div>
    </Container>
  )
}
