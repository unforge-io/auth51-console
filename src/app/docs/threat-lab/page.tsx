import type { Metadata } from 'next'
import { PageTitle, Lead, H2, P, Callout, Related } from '@/components/docs/prose'

export const metadata: Metadata = {
  title: 'Threat lab',
  description:
    'A self-contained script that exercises Auth51 resource-server defenses against stolen, forged, over-scoped, expired, incorrectly signed, and incorrectly audienced tokens.',
}

const ATTACKS: [string, string, string][] = [
  ['—', 'Legit call: valid token + valid DPoP', 'Allowed (the baseline)'],
  ['1', 'Steal a token and replay it without proof', 'Proof-of-possession: a cnf-bound token requires a DPoP proof (RFC 9449); copying the token does not provide the key'],
  ['2', 'Forge a DPoP proof with the attacker’s key', 'The proof key must equal the token’s cnf.jkt (thumbprint mismatch)'],
  ['3', 'Request with an inflated scope', 'The token must carry the scope required by the endpoint'],
  ['4', 'Wrong operation (O6): use a GET token on DELETE', 'Each endpoint derives its own a51:rs scope. A GET token lacks the DELETE scope, while a correctly scoped DELETE token is allowed'],
  ['5', 'Replay a DPoP proof on a different request', 'htu binds the proof to this exact URL'],
  ['6', 'Present an expired token', 'The exp claim, including the permitted clock skew'],
  ['7', 'Forge a token with the attacker’s signing key', 'JWKS signature verification'],
  ['8', 'Use a token at the wrong resource server', 'aud (audience)'],
  ['9', 'Tamper the agent’s prompt or code', 'The identity checksum changes, so the Authority won’t mint under the registered identity'],
]

export default function ThreatLab() {
  return (
    <article>
      <PageTitle eyebrow="Get started">Threat lab</PageTitle>

      <Lead>
        One runnable script demonstrates the resource-server defenses described in these docs.
        A single process acts as the Authority, the protected resource server, and the attacker.
        It owns the signing key, mints tokens, serves a JWKS, runs a FastAPI application protected
        by <a href="/docs/architecture/verifier">auth51-verifier</a>, and submits each attack to
        confirm that the verifier produces the expected result.
      </Lead>

      <H2>Run it</H2>
      <pre className="code-block"><code>{`# in the auth51-verifier repo
python -m venv .venv && . .venv/bin/activate
pip install -e . -r examples/threat-lab/requirements.txt
python examples/threat-lab/lab.py`}</code></pre>
      <P>
        A <code className="code-inline">✓</code> means that an attack was <strong>blocked</strong> or
        that the legitimate baseline request was allowed. A <code className="code-inline">✗</code>{' '}
        means that the expected defense failed. The process exits with a non-zero status if any
        check fails, so the lab also serves as a conformance test.
      </P>

      <H2>What it demonstrates</H2>
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
        The verifier enforces attacks 1&ndash;8 at the resource without calling the Authority. Attack 9
        exercises the mint-side identity check: <a href="/docs/concepts/agent-identity">agent identity</a>{' '}
        is derived from the agent rather than from a stored secret, so tampering changes the checksum
        before a token is issued.
      </P>

      <Callout>
        The lab installs its public key in the verifier&rsquo;s JWKS cache because it acts as the
        Authority for the test. The unmodified verifier checks the signature, DPoP proof, scope,
        audience, and expiry; the security checks are not stubbed. Replacing the local mint with a
        token from <code className="code-inline">authority.auth51.com</code> exercises the same
        verifier path.
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
