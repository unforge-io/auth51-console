import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import dynamic from 'next/dynamic'

const TrustGlobe = dynamic(
  () => import('@/components/illustrations/TrustGlobe').then((m) => m.TrustGlobe),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f8f9fc] to-[#eef1f8]" /> },
)

/**
 * Landing page — Stripe-inspired.
 *
 * 1. Hero: headline + animated React Flow product diagram
 * 2. "How it works" — step-by-step product explanation with visual emphasis
 * 3. Three pillars — Identity / Authorization / Audit
 * 4. K8s deployment model — the enterprise sell
 * 5. Deployment options — Enterprise vs Cloud
 * 6. Trust strip
 */
export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[85vh] min-h-[650px] -mt-16 bg-gradient-to-br from-white via-[#f8f9fc] to-[#eef1f8]">
        {/* Globe — right side, extends into header area (z-50 = between header bg z-40 and header content z-60) */}
        <div className="absolute -top-8 right-0 w-[62%] h-[calc(100%+8px)] z-50">
          <TrustGlobe />
        </div>

        {/* Soft fade from text into globe */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent z-[1] pointer-events-none" style={{ right: '40%' }} />

        {/* Content — left aligned */}
        <div className="relative z-10">
          <Container>
            <div className="pt-36 sm:pt-44 lg:pt-48 pb-24 sm:pb-32">
              <div className="max-w-[520px]">
                <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-5">
                  IDENTITY · AUTHORIZATION · AUDIT
                </p>
                <h1 className="text-[38px] sm:text-[48px] lg:text-[56px] font-semibold text-[#0a2540] leading-[1.08] tracking-tight text-balance">
                  Trust infrastructure for AI&nbsp;agents
                </h1>
                <p className="mt-6 text-[17px] sm:text-[19px] text-[#425466] leading-relaxed text-pretty max-w-[460px]">
                  The control plane that lets enterprises deploy AI agents safely —
                  code-attested, intent-bound, and cryptographically auditable.
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link href="/walkthrough">
                    <Button variant="primary" size="lg">
                      Start walkthrough →
                    </Button>
                  </Link>
                  <Link href="/architecture">
                    <Button variant="secondary" size="lg">
                      How it deploys
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ── How it works — Stripe-style step-by-step ── */}
      <section className="bg-white border-b border-stone-200/60">
        <Container>
          <div className="py-20 sm:py-28">
            <div className="text-center mb-16">
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-4">
                HOW IT WORKS
              </p>
              <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#0a2540] tracking-tight">
                Four steps to trusted agents
              </h2>
              <p className="mt-4 text-[17px] text-[#425466] max-w-[520px] mx-auto">
                Auth51 fits into your existing infrastructure. Your agents get
                identity, your resources get protection, your operators get visibility.
              </p>
            </div>

            <div className="grid gap-0 sm:grid-cols-4 relative">
              {/* Connecting line */}
              <div className="hidden sm:block absolute top-[48px] left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-[#4338ca]/20 via-[#4338ca] to-[#10b981]" />

              {[
                {
                  step: '01',
                  title: 'Register with checksum',
                  description: 'The shim library fingerprints your agent — its prompt, tools, and config — into a one-way hash. The Authority stores this checksum as the agent\'s verified identity. If anything changes, the checksum won\'t match.',
                  icon: '🏢',
                  color: '#0a2540',
                  code: 'POST /intent/register/agent',
                },
                {
                  step: '02',
                  title: 'Mint intent token',
                  description: 'When your agent needs to call an API, the shim requests an intent token — a JWT enriched with the agent\'s verified checksum, the current workflow step, and a delegation chain. Not just access — declared intent.',
                  icon: '📜',
                  color: '#4338ca',
                  code: 'grant_type=agent_checksum',
                },
                {
                  step: '03',
                  title: 'Verify at boundary',
                  description: 'The Verifier checks three things: is the token valid, does the PoP signature match (proving the presenter holds the private key), and does the intent match the resource\'s policy. Stolen tokens fail step two.',
                  icon: '🛡️',
                  color: '#4338ca',
                  code: 'Signature-Input + Signature',
                },
                {
                  step: '04',
                  title: 'Immutable audit',
                  description: 'Every registration, delegation, token mint, and access is logged with cryptographic delegation chains. Trace any action back through every agent that touched it — provenance you can prove in court.',
                  icon: '📊',
                  color: '#10b981',
                  code: 'delegation_chain: sha256:…',
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center px-4 py-6">
                  {/* Step circle */}
                  <div
                    className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-5 relative z-10 border-2 bg-white shadow-sm"
                    style={{ borderColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="font-mono text-[11px] font-semibold tracking-wider uppercase mb-2" style={{ color: item.color }}>
                    Step {item.step}
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#0a2540] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[#425466] leading-relaxed mb-3">
                    {item.description}
                  </p>
                  <code className="inline-block text-[11px] font-mono text-[#4338ca] bg-[#f0f3f8] rounded px-2 py-1 border border-stone-200">
                    {item.code}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Three pillars ── */}
      <section className="bg-[#f0f3f8]">
        <Container>
          <div className="py-20 sm:py-28">
            <div className="text-center mb-14">
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-4">
                THE PLATFORM
              </p>
              <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#0a2540] tracking-tight">
                Three problems, one control plane
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  num: '01', label: 'IDENTITY',
                  title: 'Who is this agent?',
                  body: 'Every agent is fingerprinted at runtime — its prompt, tools, and configuration hashed into a checksum that becomes its verified identity. Not just a name, but a cryptographic proof that this agent is running approved code.',
                },
                {
                  num: '02', label: 'AUTHORIZATION',
                  title: 'What can it do?',
                  body: 'Intent tokens declare exactly what the agent intends to do — bound to a specific workflow step, scoped to the minimum required permissions, and tied to the agent\'s private key via proof-of-possession. Tokens encode intent, not just access.',
                },
                {
                  num: '03', label: 'AUDIT',
                  title: 'What did it actually do?',
                  body: 'Every delegation, token mint, and resource access is logged with hashed delegation chains. Trace any action through the full orchestrator → sub-agent → API call path. Provenance that is cryptographically verifiable.',
                },
              ].map((pillar) => (
                <Card key={pillar.num} className="bg-white hover:shadow-md transition-all duration-200 border-stone-200">
                  <CardHeader>
                    <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-2">
                      {pillar.num} — {pillar.label}
                    </p>
                    <CardTitle className="!text-[#0a2540]">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="!text-[#425466]">
                    {pillar.body}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── K8s deployment model — the enterprise sell ── */}
      <section className="bg-white border-y border-stone-200/60">
        <Container>
          <div className="py-20 sm:py-28">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-4">
                  KUBERNETES-NATIVE
                </p>
                <h2 className="text-[32px] sm:text-[38px] font-semibold text-[#0a2540] tracking-tight leading-tight">
                  Deploys like Kubernetes itself
                </h2>
                <p className="mt-4 text-[16px] text-[#425466] leading-relaxed">
                  If your operations team can run K8s, they can run Auth51 — same Helm
                  charts, same CRDs, same DaemonSet/Sidecar/Gateway patterns, same HA
                  primitives.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { k8s: 'kube-apiserver', auth51: 'Auth51 Authority', desc: 'Multi-replica HA control plane with backing store' },
                    { k8s: 'kubelet (in-process)', auth51: 'Auth51 Runtime (Shim)', desc: 'In-process library — computes agent checksums, derives PoP keys, tracks workflow state' },
                    { k8s: 'kube-proxy', auth51: 'Auth51 Verifier', desc: 'Sidecar, DaemonSet, or Gateway — your choice' },
                    { k8s: 'dashboard', auth51: 'Auth51 Console', desc: 'Operator UI for observability and audit' },
                  ].map((row) => (
                    <div key={row.auth51} className="flex items-start gap-4 rounded-lg border border-stone-200 bg-white p-4 hover:shadow-sm transition-shadow">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-[#4338ca]/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#4338ca]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[14px] font-semibold text-[#0a2540]">{row.auth51}</span>
                          <span className="text-[11px] text-[#8898aa] font-mono">≈ {row.k8s}</span>
                        </div>
                        <p className="text-[13px] text-[#425466]">{row.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: deployment code block */}
              <div className="rounded-xl border border-stone-200 bg-[#0a2540] p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  <span className="ml-2 text-[11px] font-mono text-[#8898aa]">helm install</span>
                </div>
                <pre className="text-[13px] font-mono text-[#adbdcc] leading-relaxed overflow-x-auto">
{`# Deploy Auth51 on your K8s cluster
helm repo add auth51 https://charts.auth51.com
helm install auth51-authority auth51/authority \\
  --set replicas=3 \\
  --set postgres.host=db.internal \\
  --namespace auth51-system

# Deploy Verifier as a sidecar
helm install auth51-verifier auth51/verifier \\
  --set mode=sidecar \\
  --namespace auth51-system

# Or as a gateway
helm install auth51-verifier auth51/verifier \\
  --set mode=gateway \\
  --set ingress.enabled=true`}
                </pre>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Deployment options ── */}
      <section className="bg-[#f0f3f8]">
        <Container>
          <div className="py-20 sm:py-28">
            <div className="text-center mb-14">
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[#4338ca] uppercase mb-4">
                DEPLOY YOUR WAY
              </p>
              <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#0a2540] tracking-tight">
                Enterprise or managed cloud
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 max-w-[900px] mx-auto">
              <Card className="bg-white hover:shadow-md transition-all duration-200 border-stone-200">
                <CardHeader>
                  <CardTitle className="!text-[#0a2540]">Enterprise</CardTitle>
                  <CardDescription className="!text-[#425466]">
                    Deploy on your K8s cluster or as containers — on-prem or any cloud.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mt-3 space-y-2 text-[14px] text-[#425466]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5 text-[13px]">✓</span>
                      First-class Helm charts
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5 text-[13px]">✓</span>
                      K8s CRDs for declarative policy
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5 text-[13px]">✓</span>
                      Air-gapped / FedRAMP / IL5 ready
                    </li>
                  </ul>
                  <div className="mt-5">
                    <Link href="/deploy/enterprise">
                      <Button variant="secondary" size="sm">Learn more →</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white hover:shadow-md transition-all duration-200 border-stone-200">
                <CardHeader>
                  <CardTitle className="!text-[#0a2540]">Cloud</CardTitle>
                  <CardDescription className="!text-[#425466]">
                    Connect to hosted Auth51 Authority. Zero infrastructure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mt-3 space-y-2 text-[14px] text-[#425466]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5 text-[13px]">✓</span>
                      Virtual control plane per tenant
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5 text-[13px]">✓</span>
                      SOC2 Type II compliant
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5 text-[13px]">✓</span>
                      Private Link / VPC peering
                    </li>
                  </ul>
                  <div className="mt-5">
                    <Link href="/deploy/cloud">
                      <Button variant="secondary" size="sm">Learn more →</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-[#0a2540]">
        <Container>
          <div className="py-20 sm:py-28 text-center">
            <h2 className="text-[32px] sm:text-[40px] font-semibold text-white tracking-tight">
              Ready to secure your agents?
            </h2>
            <p className="mt-4 text-[17px] text-[#adbdcc] max-w-[480px] mx-auto">
              Start with the interactive walkthrough to understand the protocol,
              or jump straight into deployment.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/walkthrough">
                <Button variant="accent" size="lg">
                  Start walkthrough →
                </Button>
              </Link>
              <Link href="/deploy/enterprise">
                <Button
                  variant="secondary"
                  size="lg"
                  className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10 hover:!border-white/50"
                >
                  Deploy on K8s
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-t border-stone-200/60 bg-white">
        <Container>
          <div className="py-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-[#8898aa] font-mono">
            <span>IETF draft-goswami-agentic-jwt</span>
            <span className="text-stone-300">·</span>
            <span>Code attestation</span>
            <span className="text-stone-300">·</span>
            <span>Proof-of-possession</span>
            <span className="text-stone-300">·</span>
            <span>12 security anchors</span>
            <span className="text-stone-300">·</span>
            <span>18ms overhead</span>
            <span className="text-stone-300">·</span>
            <span>Built by Unforge</span>
          </div>
        </Container>
      </section>
    </>
  )
}
