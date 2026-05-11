import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Enterprise Deployment',
  description:
    'Deploy Auth51 on your Kubernetes cluster or as containers — on-prem or any cloud.',
}

export default function DeployEnterprisePage() {
  return (
    <Container width="prose">
      <div className="py-section">
        <p className="eyebrow font-mono mb-3">DEPLOY / ENTERPRISE</p>
        <h1 className="text-display-lg text-ink text-balance">
          Self-hosted deployment
        </h1>
        <p className="mt-4 text-body-lg text-ink-secondary">
          Deploy Auth51 Authority, Verifier, and Console on your own
          infrastructure. Kubernetes-native with Helm charts, or standalone
          containers for non-K8s environments.
        </p>

        <div className="mt-12 rounded-lg border-2 border-dashed border-line bg-bg-subtle p-8 text-center">
          <p className="text-body text-ink-tertiary">
            Coming in Session 3. Deployment guides, Helm chart references, and
            air-gapped installation instructions.
          </p>
        </div>
      </div>
    </Container>
  )
}
