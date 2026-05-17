'use client'

import { useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { checkHealth, mintToken, listAgents, AuthorityError } from '@/lib/console/api'
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
          description="We provision an Auth51 Control Plane on auth51 cloud in roughly 30 seconds. Free tier available, scale as you go."
          cta="Get started"
          disabled
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

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const { addContext } = useControlPlane()
  const [name, setName] = useState('dev')
  const [endpoint, setEndpoint] = useState('https://idp.auth51.com')
  const [clientId, setClientId] = useState('patchet')
  const [clientSecret, setClientSecret] = useState('')
  const [audience, setAudience] = useState('idp.localhost')
  const [appId, setAppId] = useState('Patchet')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string; agentCount?: number } | null>(null)

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // 1. Health check
      const healthy = await checkHealth(endpoint)
      if (!healthy) throw new AuthorityError('Health endpoint unreachable. Check the URL and CORS.')

      // 2. Mint a token to validate credentials
      if (clientId && clientSecret) {
        await mintToken(endpoint, clientId, clientSecret, audience, 'read:agents')

        // 3. Try fetching agents to validate scopes + app_id
        const agents = await listAgents(
          { name, endpoint, clientId, clientSecret, audience, appId, addedAt: 0 },
          appId,
        )
        setTestResult({
          ok: true,
          msg: `Healthy. Token minted. Found ${agents.length} registered agent${agents.length === 1 ? '' : 's'}.`,
          agentCount: agents.length,
        })
      } else {
        setTestResult({ ok: true, msg: 'Healthy. (No credentials provided — token mint skipped.)' })
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : String(err)
      if (err instanceof AuthorityError && err.detail) {
        msg += ` — ${JSON.stringify(err.detail).slice(0, 100)}`
      }
      setTestResult({ ok: false, msg })
    } finally {
      setTesting(false)
    }
  }

  const connect = () => {
    addContext({
      name: name.trim(),
      endpoint: endpoint.trim(),
      clientId: clientId.trim() || undefined,
      clientSecret: clientSecret.trim() || undefined,
      audience: audience.trim() || undefined,
      appId: appId.trim() || undefined,
      addedAt: Date.now(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-c-surface border border-c-border rounded-xl shadow-2xl p-5">
        <h2 className="text-[16px] font-semibold text-c-text mb-1">Connect to a Control Plane</h2>
        <p className="text-[12.5px] text-c-text-2 mb-5">Point the Console at an Auth51 Authority endpoint and authenticate with OAuth client credentials.</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Context name" hint="dev / staging / prod">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent" />
          </Field>
          <Field label="App ID" hint="Default app to query">
            <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
          </Field>
          <div className="col-span-2">
            <Field label="Endpoint URL" hint="https://idp.your-domain.com">
              <input type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
            </Field>
          </div>
          <Field label="OAuth client ID">
            <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
          </Field>
          <Field label="OAuth client secret">
            <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
          </Field>
          <div className="col-span-2">
            <Field label="Token audience" hint="JWT 'aud' claim required by routes">
              <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
            </Field>
          </div>
        </div>

        {testResult && (
          <div className={cn(
            'mt-4 px-3 py-2 rounded-md text-[12px] border',
            testResult.ok
              ? 'border-c-success/30 bg-c-success/10 text-c-success'
              : 'border-c-danger/30 bg-c-danger/10 text-c-danger',
          )}>
            {testResult.ok ? '✓' : '✕'} {testResult.msg}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button onClick={test} disabled={testing || !endpoint}
            className="text-[12.5px] text-c-text-2 hover:text-c-text disabled:opacity-50 transition-colors">
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md text-[12.5px] text-c-text-2 hover:bg-c-surface-2 transition-colors">
              Cancel
            </button>
            <button onClick={connect} disabled={!name || !endpoint}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-medium text-white bg-c-accent hover:bg-c-accent-2 disabled:opacity-50 transition-colors">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11.5px] font-medium text-c-text uppercase tracking-wide">{label}</span>
        {hint && <span className="text-[10.5px] text-c-text-3">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
