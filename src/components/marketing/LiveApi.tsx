'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Live API section — real curl commands against idp.auth51.com.
 * Each example is reachable today without auth (public OIDC discovery,
 * JWKS, health). Visitors can copy and run them.
 */

type Example = {
  id: string
  label: string
  description: string
  curl: string
  response: string
  responseType: 'json' | 'text'
}

const EXAMPLES: Example[] = [
  {
    id: 'health',
    label: 'Health check',
    description: 'Confirms the Authority is reachable. No auth required.',
    curl: 'curl https://idp.auth51.com/health',
    response: 'OK',
    responseType: 'text',
  },
  {
    id: 'oidc',
    label: 'OIDC discovery',
    description: 'Standard OIDC configuration metadata — issuer, JWKS URI, endpoints.',
    curl: 'curl https://idp.auth51.com/.well-known/openid-configuration',
    response: `{
  "issuer": "https://idp.unforge.io",
  "jwks_uri": "https://idp.auth51.com/.well-known/jwks.json",
  "token_endpoint": "https://idp.auth51.com/oauth/token",
  "introspection_endpoint": "https://idp.auth51.com/oauth/introspect",
  "grant_types_supported": [
    "client_credentials",
    "urn:ietf:params:oauth:grant-type:token-exchange"
  ],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}`,
    responseType: 'json',
  },
  {
    id: 'jwks',
    label: 'Authority JWKS',
    description: 'Public keys for verifying Authority-issued tokens.',
    curl: 'curl https://idp.auth51.com/.well-known/jwks.json',
    response: `{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "4fc5669d-35e9-4ab3-ba00-ef14aa0ffb50",
      "alg": "RS256",
      "n": "v4f4Yl…(2048-bit modulus)…",
      "e": "AQAB"
    }
  ]
}`,
    responseType: 'json',
  },
  {
    id: 'console-jwks',
    label: 'Console signing key',
    description: 'Auth51 Console signs subject_tokens — Authorities trust this key to federate Console-authenticated users.',
    curl: 'curl https://auth51.com/api/jwks.json',
    response: `{
  "keys": [
    {
      "crv": "Ed25519",
      "x": "gr5VrGiGFnu_KspPNbh24MAyD2yBU_FziiJ93qgQCvQ",
      "kty": "OKP",
      "alg": "EdDSA",
      "use": "sig",
      "kid": "auth51-console-v1"
    }
  ]
}`,
    responseType: 'json',
  },
]

export function LiveApi() {
  const [activeId, setActiveId] = useState(EXAMPLES[1].id)
  const active = EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[1]

  return (
    <section className="py-20 sm:py-28 bg-[#0a0b0d] text-white">
      <div className="mx-auto max-w-[1200px] px-6">
        <p className="text-[11px] font-mono tracking-wider uppercase text-[#818cf8] mb-3">Live API</p>
        <h2 className="text-[32px] sm:text-[40px] font-semibold text-white tracking-tight max-w-[680px] leading-[1.1]">
          Real endpoints. Real responses. Try them yourself.
        </h2>
        <p className="mt-4 text-[16px] text-[#b6bbc5] leading-relaxed max-w-[640px]">
          Auth51 isn&apos;t a slide deck. The Authority and Console are running in production
          on auth51.com right now. Copy any of these curl commands into your terminal —
          you&apos;ll get the same response we do.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
          {/* Tab list */}
          <div className="space-y-1">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setActiveId(ex.id)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                  activeId === ex.id
                    ? 'bg-[#1a1c20] border-[#2e3036] text-white'
                    : 'bg-[#0a0b0d] border-[#1f2127] text-[#b6bbc5] hover:bg-[#131418] hover:text-white',
                )}
              >
                <div className="text-[13px] font-semibold">{ex.label}</div>
                <div className="mt-1 text-[11.5px] text-[#8a8f98] leading-relaxed">{ex.description}</div>
              </button>
            ))}
          </div>

          {/* Code panel */}
          <div className="rounded-lg border border-[#1f2127] bg-[#131418] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#1f2127] flex items-center justify-between">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">request</span>
              <CopyButton text={active.curl} />
            </div>
            <pre className="px-4 py-3 text-[12.5px] font-mono text-[#ececed] overflow-x-auto">
              <code>$ {active.curl}</code>
            </pre>

            <div className="px-4 py-2.5 border-y border-[#1f2127] flex items-center justify-between bg-[#0a0b0d]">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#5c6168]">response · 200 OK</span>
              <CopyButton text={active.response} />
            </div>
            <pre className="px-4 py-3 text-[12px] font-mono text-[#b6bbc5] overflow-x-auto whitespace-pre">
              <code>{active.response}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="text-[10.5px] text-[#8a8f98] hover:text-white transition-colors"
    >
      {copied ? '✓ copied' : 'copy'}
    </button>
  )
}
