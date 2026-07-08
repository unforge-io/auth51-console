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
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-c-accent mb-3">ARCHITECTURE</p>
        <h1 className="text-display-lg text-c-text text-balance">
          Deployment Topology
        </h1>
        <p className="mt-4 text-body-lg text-c-text-2">
          Auth51 deploys like Kubernetes itself. If your operations team can run
          K8s, they can run Auth51 — same Helm charts, same CRDs, same
          DaemonSet/Sidecar/Gateway patterns, same HA primitives.
        </p>

        <div className="mt-12 rounded-lg border-2 border-dashed border-c-border bg-c-surface p-8 text-center">
          <p className="text-body text-c-text-3">
            Coming in Session 2. The architecture page will include the K8s
            component mapping, HA story, and deployment topology diagram.
          </p>
        </div>
      </div>
    </Container>
  )
}
