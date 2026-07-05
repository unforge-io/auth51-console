import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { GettingStarted } from './GettingStarted'

export const metadata: Metadata = {
  title: 'Getting Started',
  description:
    'Give every agent action a verifiable identity. Install the auth51 embed, register your agent, and see governed egress in the console — a persona-first quickstart.',
}

export default function DocsPage() {
  return (
    <Container width="narrative">
      <GettingStarted />
    </Container>
  )
}
