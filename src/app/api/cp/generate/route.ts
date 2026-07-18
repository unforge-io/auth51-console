import { NextResponse } from 'next/server'

import { AuthError, WORKFORCE_URL, getAuthorityToken } from '@/lib/console/serverAuth'

export const runtime = 'nodejs'
// Composition runs a real LLM (Claude Opus) over the spec — allow a long request.
export const maxDuration = 300

const MAX_SPEC_BYTES = 8 * 1024 * 1024 // 8 MB — Plaid's spec is ~1–2 MB

/** Fetch a spec by URL, server-side. Basic SSRF hygiene: http(s) only, no
 * loopback/link-local/metadata hosts, size-capped. Runs on Vercel (outside the
 * auth51 VPC), so it can't reach internal services regardless. */
/** github.com/owner/repo/blob/ref/path → raw.githubusercontent.com/owner/repo/ref/path
 *  so a pasted GitHub file page (the HTML view) fetches the actual file. */
function toRawGithub(u: URL): URL {
  if (u.hostname !== 'github.com') return u
  const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/)
  if (!m) return u
  return new URL(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`)
}

async function fetchSpecText(rawUrl: string): Promise<string> {
  let url: URL
  try {
    url = toRawGithub(new URL(rawUrl))
  } catch {
    throw new Error('spec_url is not a valid URL')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('spec_url must be http(s)')
  }
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('169.254.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new Error('spec_url host is not allowed')
  }
  const res = await fetch(url.toString(), { redirect: 'follow' })
  if (!res.ok) throw new Error(`fetch failed (HTTP ${res.status})`)
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_SPEC_BYTES) throw new Error('spec is too large (> 8 MB)')
  return new TextDecoder().decode(buf)
}

/**
 * POST /api/cp/generate
 *
 * Proxy the signed-in customer's spec to the workforce generator. Accepts the
 * spec as `spec` (object), `spec_text` (JSON or YAML), or `spec_url` (fetched
 * here). We exchange a server-side Authority token (org from the Clerk session)
 * and call workforce/generate with it — the backend takes ownership from the
 * token, so the pack belongs to this org. Returns a PREVIEW (profile + warnings);
 * nothing is persisted here (see /api/cp/profiles to save).
 */
export async function POST(req: Request) {
  let body: {
    spec?: unknown
    spec_text?: string
    spec_url?: string
    rs_id?: string
    profile_id?: string
    use_cases?: string[]
    domain_context?: string
    use_llm?: boolean
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  let specText = body.spec_text
  if (!body.spec && !specText && body.spec_url) {
    try {
      specText = await fetchSpecText(body.spec_url)
    } catch (e) {
      return NextResponse.json({ error: `spec_url: ${String(e)}` }, { status: 400 })
    }
  }
  if (!body.spec && !specText) {
    return NextResponse.json({ error: 'provide a spec, spec text, or a spec URL' }, { status: 400 })
  }

  try {
    const { token } = await getAuthorityToken()
    const res = await fetch(`${WORKFORCE_URL}/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        spec: body.spec ?? undefined,
        spec_text: specText,
        rs_id: body.rs_id || undefined, // workforce derives from servers[0] if absent
        profile_id: body.profile_id,
        use_cases: body.use_cases ?? [],
        domain_context: body.domain_context ?? '',
        use_llm: body.use_llm ?? true,
        persist: false, // review gate: save is a separate, explicit step
      }),
    })
    const data = await res.json().catch(() => ({ error: 'workforce returned non-JSON' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
