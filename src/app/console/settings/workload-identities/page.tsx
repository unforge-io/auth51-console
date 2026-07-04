'use client'

import { useCallback, useEffect, useState } from 'react'
import { useControlPlane } from '@/lib/console/controlPlane'
import {
  listWorkloadBindings, createWorkloadBinding, deleteWorkloadBinding,
  type WorkloadBinding, AuthorityError,
} from '@/lib/console/api'
import { EmptyState } from '@/components/console/EmptyState'
import { Button } from '@/components/ui/Button'

/**
 * Workload identities — keyless credentials. Register a cloud workload (an AWS
 * IAM role, or an OIDC subject) and agents running as it mint auth51 tokens with
 * NO stored client secret. Matched on the stable role/subject, so credential
 * rotation never touches it.
 */
export default function WorkloadIdentitiesPage() {
  const { currentContext } = useControlPlane()
  const [rows, setRows] = useState<WorkloadBinding[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    if (!currentContext) return
    setLoading(true); setError(null)
    try { setRows(await listWorkloadBindings(currentContext)) }
    catch (err) { setError(errMsg(err)); setRows([]) }
    finally { setLoading(false) }
  }, [currentContext])

  useEffect(() => { load() }, [load])

  if (!currentContext) return <EmptyState />

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-c-text tracking-tight">Workload identities</h1>
          <p className="mt-1 text-[14px] text-c-text-2 leading-relaxed max-w-2xl">
            Keyless credentials. Register a cloud workload — an AWS IAM role, or an OIDC
            subject — and agents running as it authenticate with <b>no stored secret</b>.
            Matched on the stable role/subject, so credential rotation never affects it.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>Add identity</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-c-danger/30 bg-c-danger/5 px-4 py-3 text-[13px] text-c-danger">{error}</div>
      )}

      <div className="rounded-xl border border-c-border overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 bg-c-surface-2 text-[11px] font-medium uppercase tracking-wide text-c-text-3">
          <span>Provider</span><span>Principal</span><span>Status</span><span></span>
        </div>
        {loading && rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-c-text-3">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-c-text-3">
            No workload identities yet. Add your AWS task/instance role to go keyless.
          </div>
        ) : (
          rows.map((b) => (
            <div key={b.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 border-t border-c-border">
              <span className="text-[12px] font-mono text-c-text-2 uppercase w-12">{b.provider}</span>
              <div className="min-w-0">
                <div className="text-[14px] text-c-text font-medium truncate">{b.display_name}</div>
                <div className="text-[12px] font-mono text-c-text-3 truncate">{principal(b)}</div>
              </div>
              <span className={`text-[12px] font-medium ${b.is_active ? 'text-c-success' : 'text-c-text-3'}`}>
                {b.is_active ? 'active' : 'removed'}
              </span>
              {b.is_active ? (
                <button onClick={() => remove(currentContext, b.id, setError, load)}
                        className="text-[12px] text-c-danger hover:underline">Remove</button>
              ) : <span />}
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <AddDialog
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load() }}
          create={(opts) => createWorkloadBinding(currentContext, opts)}
        />
      )}
    </div>
  )
}

function principal(b: WorkloadBinding): string {
  if (b.provider === 'aws') {
    if (b.aws_role_id) return `RoleId ${b.aws_role_id}`
    return `arn:aws:iam::${b.aws_account_id}:role/${b.aws_role_name}`
  }
  return `${b.oidc_issuer} · ${b.oidc_subject}`
}

function errMsg(err: unknown): string {
  if (err instanceof AuthorityError) {
    return `${err.message}${err.detail ? ` — ${JSON.stringify(err.detail).slice(0, 200)}` : ''}`
  }
  return err instanceof Error ? err.message : String(err)
}

async function remove(
  ctx: Parameters<typeof deleteWorkloadBinding>[0], id: number,
  setError: (s: string | null) => void, reload: () => void,
) {
  if (!confirm('Remove this workload identity? Agents using it will stop authenticating.')) return
  try { await deleteWorkloadBinding(ctx, id); reload() }
  catch (err) { setError(errMsg(err)) }
}

function AddDialog(props: {
  onClose: () => void
  onAdded: () => void
  create: (opts: Parameters<typeof createWorkloadBinding>[1]) => Promise<WorkloadBinding>
}) {
  const [provider, setProvider] = useState<'aws' | 'oidc'>('aws')
  const [name, setName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [roleName, setRoleName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [subject, setSubject] = useState('')
  const [audiences, setAudiences] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim()) { setErr('Give it a name.'); return }
    setBusy(true); setErr(null)
    try {
      await props.create({
        provider, displayName: name.trim(),
        awsAccountId: provider === 'aws' ? accountId.trim() : undefined,
        awsRoleName: provider === 'aws' ? roleName.trim() : undefined,
        oidcIssuer: provider === 'oidc' ? issuer.trim() : undefined,
        oidcSubject: provider === 'oidc' ? subject.trim() : undefined,
        audiences: audiences.split(',').map((a) => a.trim()).filter(Boolean),
      })
      props.onAdded()
    } catch (e) { setErr(errMsg(e)); setBusy(false) }
  }

  const inputCls = 'w-full mb-3 rounded-lg border border-c-border bg-c-bg px-3 py-2 text-[14px] text-c-text outline-none focus:border-c-accent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={props.onClose}>
      <div className="w-full max-w-md rounded-2xl border border-c-border bg-c-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[17px] font-semibold text-c-text mb-3">Add workload identity</h2>

        <div className="flex gap-2 mb-4">
          {(['aws', 'oidc'] as const).map((p) => (
            <button key={p} onClick={() => setProvider(p)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border ${
                provider === p ? 'border-c-accent text-c-accent bg-c-accent/10' : 'border-c-border text-c-text-2'}`}>
              {p === 'aws' ? 'AWS IAM role' : 'OIDC subject'}
            </button>
          ))}
        </div>

        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. prod fleet)" className={inputCls} />

        {provider === 'aws' ? (
          <>
            <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="AWS account ID (e.g. 123456789012)" className={inputCls} />
            <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Role name (e.g. my-app-role)" className={inputCls} />
          </>
        ) : (
          <>
            <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="OIDC issuer (e.g. https://token.actions.githubusercontent.com)" className={inputCls} />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g. repo:org/repo:ref:refs/heads/main)" className={inputCls} />
          </>
        )}
        <input value={audiences} onChange={(e) => setAudiences(e.target.value)} placeholder="Audiences (comma-separated RS hosts; optional)" className={inputCls} />

        {err && <div className="mb-3 text-[13px] text-c-danger">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={props.onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={busy}>{busy ? 'Adding…' : 'Add'}</Button>
        </div>
      </div>
    </div>
  )
}
