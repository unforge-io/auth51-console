import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Callout, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Threat lab',
  description:
    'Every RS-side defense auth51 claims, demonstrated live and self-contained in one runnable script — stolen, forged, inflated, mis-operated, expired, mis-signed, and mis-audienced tokens, all inert at the resource.',
}

const ATTACKS: [string, string, string][] = [
  ['—', 'Legit call: valid token + valid DPoP', 'Allowed — the baseline'],
  ['1', 'Steal a token, replay it with no proof', 'Proof-of-possession: a cnf-bound token needs a DPoP proof (RFC 9449); a copy from a log has no key'],
  ['2', 'Forge a DPoP proof with the attacker’s key', 'The proof key must equal the token’s cnf.jkt — thumbprint mismatch'],
  ['3', 'Scope inflation', 'The token must carry the endpoint’s scope'],
  ['4', 'Wrong operation (O6): a GET token on DELETE', 'Each endpoint derives its own a51:rs scope; a GET token lacks DELETE’s. The correct DELETE token is allowed — it’s the operation, not a block-all'],
  ['5', 'Replay a DPoP proof on a different request', 'htu binds the proof to this exact URL'],
  ['6', 'Present an expired token', 'exp, beyond clock skew'],
  ['7', 'Forge a token with the attacker’s signing key', 'JWKS signature verification'],
  ['8', 'Use a token at the wrong resource server', 'aud (audience)'],
  ['9', 'Tamper the agent’s prompt or code', 'The identity checksum changes, so the Authority won’t mint under the registered identity'],
]

export default function ThreatLab() {
  return (
    <article>
      <PageTitle eyebrow="Get started">Threat lab</PageTitle>

      <Lead>
        Every RS-side defense on this site is demonstrated <em>live</em> by one runnable script.
        Nothing to deploy: a single process plays the Authority (owns the signing key, mints tokens,
        serves its own JWKS), the resource server (a FastAPI app guarded by{' '}
        <a href="/docs/architecture/verifier">auth51-verifier</a>), and the attacker — then fires each
        attack in-process and checks the verifier reacts the way these docs claim.
      </Lead>

      <H2>Run it</H2>
      <pre className="code-block"><code>{`# in the auth51-verifier repo
python -m venv .venv && . .venv/bin/activate
pip install -e . -r examples/threat-lab/requirements.txt
python examples/threat-lab/lab.py`}</code></pre>
      <P>
        A <code className="code-inline">✓</code> means the attack was <strong>blocked</strong> (or the
        legitimate call allowed); a <code className="code-inline">✗</code> means a defense didn&rsquo;t
        hold. The lab exits non-zero if any defense fails, so it doubles as a conformance test.
      </P>

      <H2>What it proves</H2>
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="text-left text-c-text-3 border-b border-c-border">
              <th className="py-2 pr-3 font-medium w-8">#</th>
              <th className="py-2 pr-4 font-medium">Attack</th>
              <th className="py-2 font-medium">Defense that stops it</th>
            </tr>
          </thead>
          <tbody>
            {ATTACKS.map(([n, attack, defense]) => (
              <tr key={n + attack} className="border-b border-c-border/60 align-top">
                <td className="py-2 pr-3 font-mono text-c-accent-2">{n}</td>
                <td className="py-2 pr-4 text-c-text">{attack}</td>
                <td className="py-2 text-c-text-2">{defense}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Attacks 1&ndash;8 are enforced by the verifier at the resource, entirely offline. Attack 9 is
        the mint-side anchor: <a href="/docs/concepts/agent-identity">identity</a> is a fingerprint of
        the code, not a secret the agent carries, so tampering is self-evident before a token is ever
        issued.
      </P>

      <Callout>
        The lab installs its own public key into the verifier&rsquo;s JWKS cache — it legitimately{' '}
        <em>is</em> the authority, so it knows that key. The signature, DPoP proof, scope, audience,
        and expiry are all verified for real by the unmodified verifier; none of the security checks
        are stubbed. Swap the local mint for a real <code className="code-inline">authority.auth51.com</code>{' '}
        token and the same verifier reacts identically.
      </Callout>

      <Related items={[
        { href: '/docs/concepts/proof-of-possession', label: 'Proof-of-possession' },
        { href: '/docs/concepts/grants-and-scopes', label: 'Grants & scopes' },
        { href: '/docs/concepts/agent-identity', label: 'Agent identity' },
        { href: '/docs/architecture/verifier', label: 'Verifier' },
      ]} />
    </article>
  )
}
