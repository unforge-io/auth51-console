import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Cloud Deployment',
  description:
    'Connect your agents to hosted Auth51 Authority — no infrastructure to manage.',
}

export default function DeployCloudPage() {
  return (
    <Container width="prose">
      <div className="py-section">
        <p className="eyebrow font-mono mb-3">DEPLOY / CLOUD</p>
        <h1 className="text-display-lg text-ink text-balance">
          Managed cloud
        </h1>
        <p className="mt-4 text-body-lg text-ink-secondary">
          Connect your agentic systems to a hosted Auth51 Authority with a
          virtual control plane provisioned for your tenant. SOC2 Type II
          compliant, with Private Link and VPC peering options.
        </p>

        <div className="mt-12 rounded-lg border-2 border-dashed border-line bg-bg-subtle p-8 text-center">
          <p className="text-body text-ink-tertiary">
            Coming in Session 3. Signup flow, pricing, and SaaS deployment
            documentation.
          </p>
        </div>
      </div>
    </Container>
  )
}
