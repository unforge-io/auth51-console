import { NextResponse } from 'next/server'
import { getPublicJwk } from '@/lib/console/signing'

export const runtime = 'nodejs'

/**
 * JWKS endpoint — exposes the Console's public signing key.
 *
 * Authorities that trust auth51.com as a subject_token issuer fetch
 * this JWKS to verify the JWT signature when handling RFC 8693 token
 * exchange requests.
 */
export async function GET() {
  try {
    const key = await getPublicJwk()
    return NextResponse.json({ keys: [key] }, {
      headers: {
        'Cache-Control': 'public, max-age=600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'jwks_unavailable', detail: msg },
      { status: 500 },
    )
  }
}
