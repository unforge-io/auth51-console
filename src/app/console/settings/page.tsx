'use client'

import Link from 'next/link'
import { useControlPlane } from '@/lib/console/controlPlane'
import { EmptyState } from '@/components/console/EmptyState'

/**
 * Settings landing — org + control-plane summary and links into the
 * management surfaces. Deep configuration (team, billing) comes later.
 */
export default function SettingsPage() {
  const { currentContext } = useControlPlane()
  if (!currentContext) return <EmptyState />

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-[22px] font-semibold text-c-text tracking-tight mb-6">Settings</h1>

      <section className="rounded-xl border border-c-border p-5 mb-4">
        <h2 className="text-[13px] font-semibold text-c-text mb-3">Control plane</h2>
        <Row label="Name" value={currentContext.name} />
        <Row label="Authority" value={currentContext.endpoint} mono />
        <Row label="App" value={currentContext.appId ?? 'Patchet'} />
        <Row label="Audience" value={currentContext.audience ?? '—'} mono />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <LinkCard href="/console/settings/api-keys" title="API keys"
          desc="Create and revoke credentials your agents use to mint tokens." />
        <LinkCard href="/console/onboarding" title="Get started"
          desc="The guided flow to connect your first agent." />
        <LinkCard href="/console/security/audit" title="Audit log"
          desc="Every authority decision for your org." />
        <LinkCard href="/console/agents/grants" title="Grants"
          desc="The capability envelope for each agent." />
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-c-border last:border-0">
      <span className="text-[13px] text-c-text-3">{label}</span>
      <span className={`text-[13px] text-c-text ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function LinkCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-c-border p-4 no-underline hover:border-c-accent transition-colors">
      <div className="text-[14px] font-semibold text-c-text mb-1">{title}</div>
      <div className="text-[12px] text-c-text-2 leading-relaxed">{desc}</div>
    </Link>
  )
}
