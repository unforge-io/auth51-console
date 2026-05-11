'use client'

type Props = {
  oauth: {
    label: string
    points: readonly string[]
  }
  auth51: {
    label: string
    points: readonly string[]
  }
}

/**
 * Side-by-side comparison panel showing OAuth (without Auth51) vs Auth51.
 * Used in Act 2 and Act 4 branches to make the difference visceral.
 */
export function SideBySidePanel({ oauth, auth51 }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Without Auth51 */}
      <div className="rounded-lg border-2 border-signal-danger bg-red-50/50 p-5">
        <h4 className="mb-3 text-body-sm font-semibold text-red-800">
          {oauth.label}
        </h4>
        <ul className="space-y-2">
          {oauth.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm text-red-700">
              <span className="mt-0.5 shrink-0 text-signal-danger">✗</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* With Auth51 */}
      <div className="rounded-lg border-2 border-signal-success bg-emerald-50/50 p-5">
        <h4 className="mb-3 text-body-sm font-semibold text-emerald-800">
          {auth51.label}
        </h4>
        <ul className="space-y-2">
          {auth51.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm text-emerald-700">
              <span className="mt-0.5 shrink-0 text-signal-success">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
