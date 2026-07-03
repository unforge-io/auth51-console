'use client'

import { useCallback, useEffect, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  listApiKeys, createApiKey, revokeApiKey,
  type ApiKey, type ApiKeyCreated, AuthorityError,
} from '@/lib/console/api'
import { EmptyState } from '@/components/console/EmptyState'
import { Button } from '@/components/ui/Button'

/**
 * API Keys — self-serve OAuth clients scoped to the customer's org.
 *
 * A key is what a customer pastes into `auth51.configure(...)` so their agents
 * mint intent tokens against the authority. The secret is shown exactly once,
 * on creation (POST /oauth-clients); afterwards only its metadata is listed.
 */
export default function ApiKeysPage() {
  const { currentContext } = useControlPlane()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [justCreated, setJustCreated] = useState<ApiKeyCreated | null>(null)

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true); setError(null)
    try {
      setKeys(await listApiKeys(currentContext))
    } catch (err) {
      setError(errMsg(err)); setKeys([])
    } finally { setLoading(false) }
  }, [currentContext])

  useEffect(() => { load() }, [load])

  if (!currentContext) return <EmptyState />

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-c-text tracking-tight">API keys</h1>
          <p className="mt-1 text-[14px] text-c-text-2 leading-relaxed max-w-xl">
            Credentials your agents use to mint intent tokens. Configure the
            auth51 embed with a key&rsquo;s <code className="text-c-text">client_id</code> and{' '}
            <code className="text-c-text">client_secret</code>. Scoped to your org.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          Create key
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">
          {error}
        </div>
      )}

      {justCreated && (
        <SecretReveal created={justCreated} onDone={() => { setJustCreated(null); load() }} />
      )}

      <div className="rounded-xl border border-c-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
          <span>Name / client_id</span><span>Scopes</span><span>Status</span><span></span>
        </div>
        {loading && keys.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-c-text-3">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-c-text-3">
            No API keys yet. Create one to connect your first agent.
          </div>
        ) : (
          keys.map((k) => (
            <div key={k.client_id}
                 className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 border-t border-c-border">
              <div className="min-w-0">
                <div className="text-[14px] text-c-text font-medium truncate">{k.display_name}</div>
                <div className="text-[12px] font-mono text-c-text-3 truncate">{k.client_id}</div>
              </div>
              <div className="text-[12px] text-c-text-2 max-w-[220px] truncate" title={k.allowed_scopes.join(' ')}>
                {k.allowed_scopes.length} scope{k.allowed_scopes.length === 1 ? '' : 's'}
              </div>
              <span className={`text-[12px] font-medium ${k.is_active ? 'text-c-success' : 'text-c-text-3'}`}>
                {k.is_active ? 'active' : 'revoked'}
              </span>
              {k.is_active ? (
                <button
                  onClick={() => revoke(currentContext, k.client_id, setError, load)}
                  className="text-[12px] text-c-danger hover:underline">
                  Revoke
                </button>
              ) : <span />}
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <CreateDialog
          onClose={() => setShowCreate(false)}
          onCreated={(created) => { setShowCreate(false); setJustCreated(created) }}
          create={(opts) => createApiKey(currentContext, opts)}
        />
      )}
    </div>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof AuthorityError) {
    return `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
  }
  return err instanceof Error ? err.message : String(err)
}

async function revoke(
  ctx: Parameters<typeof revokeApiKey>[0], clientId: string,
  setError: (s: string | null) => void, reload: () => void,
) {
  if (!confirm(`Revoke ${clientId}? Agents using it will stop being able to mint.`)) return
  try { await revokeApiKey(ctx, clientId); reload() }
  catch (err) { setError(errMsg(err)) }
}

function CreateDialog(props: {
  onClose: () => void
  onCreated: (c: ApiKeyCreated) => void
  create: (opts: { displayName: string; audiences?: string[] }) => Promise<ApiKeyCreated>
}) {
  const [name, setName] = useState('')
  const [audiences, setAudiences] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim()) { setErr('Give the key a name.'); return }
    setBusy(true); setErr(null)
    try {
      const created = await props.create({
        displayName: name.trim(),
        audiences: audiences.split(',').map((a) => a.trim()).filter(Boolean),
      })
      props.onCreated(created)
    } catch (e) { setErr(errMsg(e)); setBusy(false) }
  }

  return (
    <Overlay onClose={props.onClose}>
      <h2 className="text-[17px] font-semibold text-c-text mb-1">Create API key</h2>
      <p className="text-[13px] text-c-text-2 mb-4">The secret is shown once — copy it somewhere safe.</p>
      <label className="block text-[12px] font-medium text-c-text-2 mb-1">Name</label>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
        placeholder="e.g. production agents"
        className="w-full mb-3 rounded-lg border border-c-border bg-c-bg px-3 py-2 text-[14px] text-c-text outline-none focus:border-c-accent" />
      <label className="block text-[12px] font-medium text-c-text-2 mb-1">
        Audiences <span className="text-c-text-3">(comma-separated resource servers the agents call; optional)</span>
      </label>
      <input value={audiences} onChange={(e) => setAudiences(e.target.value)}
        placeholder="api.acme.com.payment"
        className="w-full mb-4 rounded-lg border border-c-border bg-c-bg px-3 py-2 text-[14px] text-c-text outline-none focus:border-c-accent" />
      {err && <div className="mb-3 text-[13px] text-c-danger">{err}</div>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={props.onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit} disabled={busy}>
          {busy ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </Overlay>
  )
}

function SecretReveal({ created, onDone }: { created: ApiKeyCreated; onDone: () => void }) {
  return (
    <div className="mb-6 rounded-xl border border-c-success/40 bg-c-success/5 p-5">
      <div className="text-[14px] font-semibold text-c-text mb-1">Key created — copy the secret now</div>
      <p className="text-[13px] text-c-text-2 mb-3">
        This is the only time <code className="text-c-text">client_secret</code> is shown.
      </p>
      <Field label="client_id" value={created.client_id} />
      <Field label="client_secret" value={created.client_secret} secret />
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={onDone}>Done</Button>
      </div>
    </div>
  )
}

function Field({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mb-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-c-text-3 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code className={`flex-1 rounded-lg border border-c-border bg-c-bg px-3 py-2 text-[13px] font-mono text-c-text overflow-x-auto ${secret ? '' : ''}`}>
          {value}
        </code>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="text-[12px] text-c-accent hover:underline whitespace-nowrap">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-c-border bg-c-surface p-6 shadow-xl"
           onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
