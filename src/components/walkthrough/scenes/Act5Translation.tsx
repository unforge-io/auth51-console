'use client'

import { ACT_CONTENT } from '@/lib/walkthrough/content'
import { RoadSign } from '../RoadSign'
import type { WalkthroughAction } from '@/lib/walkthrough/state'

type Props = {
  dispatch: React.Dispatch<WalkthroughAction>
}

const content = ACT_CONTENT[5]

export function Act5Translation({ dispatch }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">{content.eyebrow}</p>
        <h2 className="text-display text-ink text-balance">{content.title}</h2>
      </div>

      <p className="max-w-narrative text-body-lg text-ink-secondary">
        {content.narrative}
      </p>

      {/* Translation table */}
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b-2 border-line text-left">
              <th className="pb-3 pr-4 font-semibold text-ink">Film Analogy</th>
              <th className="pb-3 pr-4 font-semibold text-ink">Auth51 Component</th>
              <th className="pb-3 pr-4 font-semibold text-ink hidden sm:table-cell">Deployment</th>
              <th className="pb-3 font-semibold text-ink hidden lg:table-cell">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {content.mappings.map((row, i) => (
              <tr key={i} className="group">
                <td className="py-3 pr-4 text-ink-secondary">{row.analogy}</td>
                <td className="py-3 pr-4 font-mono font-medium text-brand">
                  {row.technical}
                </td>
                <td className="py-3 pr-4 text-ink-tertiary hidden sm:table-cell text-caption">
                  {row.deployment}
                </td>
                <td className="py-3 text-ink-tertiary hidden lg:table-cell text-caption">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The single-sentence architecture summary */}
      <blockquote className="border-l-4 border-brand pl-5 text-body text-ink-secondary italic">
        &ldquo;Your agent loads the Auth51 Runtime, registers with the Auth51 Authority,
        signs every request with the issued Agentic JWT, and gets verified at the
        Auth51 Verifier. Operators watch all of it through the Auth51 Console.&rdquo;
      </blockquote>

      <div className="pt-4">
        <RoadSign variant="continue" onClick={() => dispatch({ type: 'NEXT' })}>
          Continue — Try it live
        </RoadSign>
      </div>
    </div>
  )
}
