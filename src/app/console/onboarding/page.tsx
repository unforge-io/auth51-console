'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  createApiKey, listAgents, type ApiKeyCreated, AuthorityError,
} from '@/lib/console/api'
import { EmptyState } from '@/components/console/EmptyState'
import { Button } from '@/components/ui/Button'

/**
 * Get started — the self-serve loop in one guided flow:
 *   1. Create an API key (scoped to your org)
 *   2. Install + configure the auth51 embed with it
 *   3. Register your first agent (SDK-side) — we wait for it to appear
 *
 * Everything is org-scoped: the key, the agent, and the audit all live in the
 * customer's own authority tenant.
 */
export default function OnboardingPage() {
  const { currentContext } = useControlPlane()
  const [key, setKey] = useState<ApiKeyCreated | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstAgent, setFirstAgent] = useState<string | null>(null)

  const create = async () => {
    if (!currentContext) return
    setCreating(true); setError(null)
    try {
      setKey(await createApiKey(currentContext, { displayName: 'quickstart key' }))
    } catch (err) {
      setError(err instanceof AuthorityError
        ? `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
        : err instanceof Error ? err.message : String(err))
    } finally { setCreating(false) }
  }

  // Poll for the first registered agent once a key exists.
  const polling = useRef(false)
  const poll = useCallback(async () => {
    if (!currentContext || !key || firstAgent || polling.current) return
    polling.current = true
    try {
      const agents = await listAgents(currentContext)
      if (agents.length > 0) setFirstAgent(agents[0].agent_id)
    } catch { /* ignore — agent not registered yet */ }
    finally { polling.current = false }
  }, [currentContext, key, firstAgent])

  useEffect(() => {
    if (!key || firstAgent) return
    const id = setInterval(poll, 4000)
    poll()
    return () => clearInterval(id)
  }, [key, firstAgent, poll])

  if (!currentContext) return <EmptyState />

  const endpoint = currentContext.endpoint.replace(/\/$/, '')
  const snippet = key
    ? `pip install auth51

# in your agent process, before it makes outbound calls:
import auth51
auth51.configure(
    authority_url="${endpoint}",
    client_id="${key.client_id}",
    client_secret="${key.client_secret}",
    audiences={"your-resource-server.example.com"},  # hosts to govern
)

# wrap the agent run so egress is minted + DPoP-bound automatically:
with auth51.agent("my-first-agent", checksum="<computed at registration>"):
    run_your_agent()`
    : ''

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-[11px] font-mono tracking-wider uppercase text-c-accent mb-3">Get started</p>
      <h1 className="text-[30px] font-semibold text-c-text leading-tight tracking-tight">
        Connect your first agent.
      </h1>
      <p className="mt-3 mb-10 text-[15px] text-c-text-2 leading-relaxed max-w-xl">
        Three steps: create a key, configure the embed, register an agent. Everything
        stays scoped to your organization.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>
      )}

      {/* Step 1 */}
      <Step n={1} title="Create an API key" done={!!key}>
        {!key ? (
          <Button variant="primary" size="sm" onClick={create} disabled={creating}>
            {creating ? 'Creating…' : 'Create key'}
          </Button>
        ) : (
          <div className="space-y-2">
            <Copyable label="client_id" value={key.client_id} />
            <Copyable label="client_secret" value={key.client_secret} />
            <p className="text-[12px] text-c-text-3">
              The secret is shown once. Manage keys anytime under{' '}
              <Link href="/console/settings/api-keys" className="text-c-accent hover:underline">API keys</Link>.
            </p>
          </div>
        )}
      </Step>

      {/* Step 2 */}
      <Step n={2} title="Install &amp; configure the embed" done={false} dim={!key}>
        {key ? (
          <Copyable label="quickstart.py" value={snippet} block />
        ) : (
          <p className="text-[13px] text-c-text-3">Create a key first — we&rsquo;ll fill in your credentials here.</p>
        )}
      </Step>

      {/* Step 3 */}
      <Step n={3} title="Register your first agent" done={!!firstAgent} dim={!key} last>
        {!key ? (
          <p className="text-[13px] text-c-text-3">Complete the steps above first.</p>
        ) : firstAgent ? (
          <div className="text-[14px] text-c-success font-medium">
            ✓ Agent <span className="font-mono">{firstAgent}</span> is live.{' '}
            <Link href="/console/agents/registered" className="text-c-accent hover:underline">View it →</Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-c-text-2">
            <span className="inline-block h-2 w-2 rounded-full bg-c-accent animate-pulse" />
            Waiting for your first agent to register…
          </div>
        )}
      </Step>
    </div>
  )
}

function Step({ n, title, children, done, dim, last }: {
  n: number; title: string; children: React.ReactNode
  done?: boolean; dim?: boolean; last?: boolean
}) {
  return (
    <div className={`relative pl-11 ${last ? '' : 'pb-8'} ${dim ? 'opacity-60' : ''}`}>
      {!last && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-c-border" />}
      <div className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-semibold
        ${done ? 'border-c-success bg-c-success/10 text-c-success' : 'border-c-border bg-c-surface text-c-text-2'}`}>
        {done ? '✓' : n}
      </div>
      <h2 className="text-[16px] font-semibold text-c-text mb-2 pt-1">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

function Copyable({ label, value, block }: { label: string; value: string; block?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-c-text-3">{label}</span>
        <button onClick={copy} className="text-[12px] text-c-accent hover:underline">{copied ? 'copied' : 'copy'}</button>
      </div>
      <pre className={`rounded-lg border border-c-border bg-c-bg px-3 py-2 text-[12px] font-mono text-c-text overflow-x-auto ${block ? 'whitespace-pre' : 'whitespace-nowrap'}`}>
        {value}
      </pre>
    </div>
  )
}
