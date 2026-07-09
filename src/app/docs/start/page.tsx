import type { Metadata } from 'next'
import { GettingStarted } from '../GettingStarted'

export const metadata: Metadata = {
  title: 'Quickstart',
  description:
    'Give your agents a verifiable identity in one import. Install auth51, run your agent, approve it in the console.',
}

export default function QuickstartPage() {
  return <GettingStarted />
}
