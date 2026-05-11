import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Protocol',
  description:
    'Technical walkthrough of the Agentic JWT protocol — the wire format powering Auth51.',
}

export default function ProtocolPage() {
  return (
    <Container width="prose">
      <div className="py-section">
        <p className="eyebrow font-mono mb-3">PROTOCOL</p>
        <h1 className="text-display-lg text-ink text-balance">
          Agentic JWT Protocol
        </h1>
        <p className="mt-4 text-body-lg text-ink-secondary">
          A 10-scene technical walkthrough of the wire format and cryptographic
          mechanisms powering Auth51. Based on IETF draft-goswami-agentic-jwt.
        </p>

        <div className="mt-12 rounded-lg border-2 border-dashed border-line bg-bg-subtle p-8 text-center">
          <p className="text-body text-ink-tertiary">
            Coming in Session 3. The protocol walkthrough will cover intent
            tokens, proof-of-possession, delegation chains, and code attestation.
          </p>
        </div>
      </div>
    </Container>
  )
}
