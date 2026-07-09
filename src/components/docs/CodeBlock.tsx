'use client'

import { useState } from 'react'

export function CodeBlock({ label, children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="my-4 rounded-xl border border-c-border bg-c-bg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-c-border flex items-center justify-between">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-c-text-3">{label ?? 'code'}</span>
        <button onClick={copy} className="text-[11px] font-mono text-c-accent-2 hover:underline">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="px-4 py-4 text-[12.5px] font-mono text-c-text overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}
