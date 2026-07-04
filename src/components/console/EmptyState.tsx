'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ConnectDialog } from './ConnectDialog'
import { useControlPlane } from '@/lib/console/controlPlane'
import { makeManagedContext } from '@/lib/console/managed'
import { cn } from '@/lib/utils'

/**
 * First-run empty state — shown when no Control Plane is configured.
 *
 * Three options:
 *  1. Quick start (managed) — coming soon
 *  2. Connect existing (BYO) — Phase 1 functional path
 *  3. From the CLI — coming soon (with docs link)
 *
 * Linear-style: large editorial typography, generous spacing, restrained accents.
 */
export function EmptyState() {
  const [connectOpen, setConnectOpen] = useState(false)
  const { addContext } = useControlPlane()
  const { orgSlug } = useAuth()
  const router = useRouter()

  const startManaged = () => {
    addContext(makeManagedContext(orgSlug))
    router.push('/console/onboarding')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-[11px] font-mono tracking-wider uppercase text-c-accent mb-3">
          Welcome to Auth51 Console
        </p>
        <h1 className="text-[32px] font-semibold text-c-text leading-[1.1] tracking-tight max-w-xl">
          Connect a Control Plane to begin.
        </h1>
        <p className="mt-4 text-[15px] text-c-text-2 leading-relaxed max-w-xl">
          The Console is a client. It talks to one or more Auth51 Control
          Planes — each running the Authority, optional Verifiers, and the
          Runtimes installed alongside your agents.
        </p>
      </div>

      <div className="space-y-3">
        <Option
          number="1"
          title="Quick start"
          tag="managed"
          description="Use the managed auth51 cloud authority — no infrastructure to run. We scope everything to your organization automatically."
          cta="Get started →"
          onClick={startManaged}
        />
        <Option
          number="2"
          title="Connect existing"
          tag="bring your own"
          description="Point the Console at a Control Plane you've already deployed on AWS, GCP, on-prem, or anywhere else."
          cta="Enter endpoint →"
          onClick={() => setConnectOpen(true)}
        />
        <Option
          number="3"
          title="From the CLI"
          tag="for developers"
          description="Install a51 locally. It will configure a Control Plane endpoint, store credentials, and register this Console session."
          code={`brew install auth51/tap/a51\na51 init && a51 connect`}
          cta="View CLI docs"
          disabled
        />
      </div>

      {connectOpen && <ConnectDialog onClose={() => setConnectOpen(false)} />}
    </div>
  )
}

function Option({
  number, title, tag, description, code, cta, onClick, disabled,
}: {
  number: string
  title: string
  tag: string
  description: string
  code?: string
  cta: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <div className={cn(
      'border border-c-border rounded-xl px-5 py-5 bg-c-surface transition-colors',
      disabled ? 'opacity-60' : 'hover:border-c-border-2',
    )}>
      <div className="flex items-start gap-4">
        <div className="text-[11px] font-mono text-c-text-3 mt-1">0{number}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-[15px] font-semibold text-c-text tracking-tight">{title}</h3>
            <span className="text-[9.5px] font-medium tracking-wider uppercase text-c-text-3 px-1.5 py-0.5 rounded border border-c-border">
              {tag}
            </span>
            {disabled && (
              <span className="text-[9.5px] font-medium tracking-wider uppercase text-c-accent px-1.5 py-0.5 rounded border border-c-accent/30 bg-c-accent/10">
                Coming
              </span>
            )}
          </div>
          <p className="text-[13.5px] text-c-text-2 leading-relaxed">{description}</p>
          {code && (
            <pre className="mt-3 px-3 py-2 rounded-md bg-c-bg border border-c-border text-[12px] font-mono text-c-text-2 overflow-x-auto">
              <code>{code}</code>
            </pre>
          )}
          <div className="mt-3">
            <button
              onClick={onClick}
              disabled={disabled}
              className={cn(
                'text-[12.5px] font-medium transition-colors',
                disabled
                  ? 'text-c-text-3 cursor-not-allowed'
                  : 'text-c-accent hover:text-c-accent-2',
              )}
            >
              {cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
