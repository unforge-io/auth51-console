/**
 * Server-side proxy to the managed Authority's /v1/control-planes — the org's
 * shared console connections. Called with the member's exchanged token, so the
 * Authority scopes every read/write to the active org's tenant.
 */
import { NextResponse } from 'next/server'

import { MANAGED_AUTHORITY_URL } from './managed'
import { AuthError, getAuthorityToken } from './serverAuth'

export async function forwardControlPlanes(method: string, suffix = '', body?: unknown) {
  try {
    const { token } = await getAuthorityToken('manage:clients')
    const res = await fetch(`${MANAGED_AUTHORITY_URL}/v1/control-planes${suffix}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ error: 'authority returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
