'use client'

import { useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import { checkHealth, listAgents, AuthorityError } from '@/lib/console/api'
import { MANAGED_AUDIENCE } from '@/lib/console/managed'
import { cn } from '@/lib/utils'

/**
 * Connect / Add a Control Plane dialog.
 *
 * Used from:
 *  - First-run EmptyState ("Connect existing" option)
 *  - Sidebar ControlPlaneSwitcher ("Add another Control Plane")
 *
 * Captures endpoint + audience + appId, runs a Test Connection that does
 * a health check followed by a real token exchange + agent fetch through
 * the user's Clerk session. Saves into the ControlPlaneProvider's
 * localStorage-backed state on Connect.
 */
export function ConnectDialog({ onClose, defaultName }: { onClose: () => void; defaultName?: string }) {
  const { addContext, state } = useControlPlane()
  const [name, setName] = useState(defaultName ?? suggestName(state.contexts.map((c) => c.name)))
  const [endpoint, setEndpoint] = useState('https://authority.auth51.com')
  const [audience, setAudience] = useState(MANAGED_AUDIENCE)
  const [appId, setAppId] = useState('Patchet')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const healthy = await checkHealth(endpoint)
      if (!healthy) throw new AuthorityError('Health endpoint unreachable. Check the URL and CORS.')
      const agents = await listAgents(
        { name, endpoint, audience, appId, addedAt: 0 },
        appId,
      )
      setTestResult({
        ok: true,
        msg: `Healthy. Token exchanged. Found ${agents.length} registered agent${agents.length === 1 ? '' : 's'}.`,
      })
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : String(err)
      if (err instanceof AuthorityError && err.detail) {
        msg += ` — ${JSON.stringify(err.detail).slice(0, 200)}`
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
        <p className="text-[12.5px] text-c-text-2 mb-5">
          Point the Console at an Auth51 Authority. Your signed-in Console identity
          is exchanged for an Authority-issued token — no secrets in your browser.
        </p>

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
            <Field label="Authority endpoint" hint="https://authority.your-domain.com">
              <input type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Token audience" hint="JWT 'aud' claim required by routes">
              <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-c-border bg-c-bg text-c-text text-[13px] focus:outline-none focus:border-c-accent font-mono" />
            </Field>
          </div>
        </div>

        <div className="mt-4 px-3 py-2 rounded-md text-[11.5px] border border-c-border bg-c-bg text-c-text-2 leading-relaxed">
          <span className="font-medium text-c-text">How it works:</span> When you Connect, the Console signs a short-lived JWT
          asserting your identity and exchanges it with the Authority via RFC 8693. The Authority verifies the signature
          against <code className="font-mono text-c-text-3">auth51.com/api/jwks.json</code> and issues a token bound to
          your user. The Console is not in the data path after that.
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

function suggestName(existing: string[]): string {
  if (existing.length === 0) return 'dev'
  for (const candidate of ['dev', 'staging', 'prod', 'dev-2', 'staging-2', 'prod-2']) {
    if (!existing.includes(candidate)) return candidate
  }
  return `cp-${existing.length + 1}`
}
