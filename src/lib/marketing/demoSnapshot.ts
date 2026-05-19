/**
 * Hand-crafted demo snapshot used by marketing-site previews.
 *
 * Mirrors the shape of real Authority responses (Registration[]) so that the
 * actual Console components can render it directly — no fake mockup needed,
 * and what visitors see on the homepage is bit-for-bit what registered users
 * see in the live Console.
 *
 * Names are realistic but synthetic. Real Console data is gated behind
 * Clerk auth and stays that way.
 */

import type { Registration } from '@/lib/console/api'

export const DEMO_AGENTS: Registration[] = [
  {
    app_id: 'Patchet',
    agent_id: 'Supervisor',
    registration_id: 'reg_Supervisor_1779032491',
    checksum: 'c2736b78f0bb2c4ed402263c60465443cf5a86ff88b3baaa2f7086ddd589fbdf',
    prompt: 'You are the Supervisor agent that coordinates Planner, Classifier, and Patcher across the patching workflow.',
    tools: [
      { name: 'Planner',    is_agent: true,  signature: '(state: PatchetState)', description: 'Plans patching steps for the current repository.', source_code: null },
      { name: 'Classifier', is_agent: true,  signature: '(state: PatchetState)', description: 'Classifies the repository ecosystem and dependencies.', source_code: null },
      { name: 'Patcher',    is_agent: true,  signature: '(state: PatchetState)', description: 'Applies the patch plan and finalizes the SBOM.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 90 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'Planner',
    registration_id: 'reg_Planner_1779032491',
    checksum: '560b8763ba66406f494b72add026bcfe785d68f739a1cfdfabcf80d4b96fe462',
    prompt: 'You generate an ordered patch plan using list_files, generate_sbom_with_vulns, triage_vulns, and create_patch_plan tools.',
    tools: [
      { name: 'list_files',                is_agent: false, signature: '(path: str) -> List[str]', description: 'List files in the repository.', source_code: null },
      { name: 'generate_sbom_with_vulns',  is_agent: false, signature: '() -> SBOM',                description: 'Produce an SBOM with vulnerabilities.', source_code: null },
      { name: 'triage_vulns',              is_agent: false, signature: '(sbom: SBOM) -> Triage',    description: 'Prioritise the discovered vulnerabilities.', source_code: null },
      { name: 'create_patch_plan',         is_agent: false, signature: '(triage: Triage) -> Plan',  description: 'Emit an ordered patch plan.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 90 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'Classifier',
    registration_id: 'reg_Classifier_1779032491',
    checksum: '3bb2f99efdefd7716c2d4997a8fe162a15c0b43b10df3dfc4140510054fbeccb',
    prompt: 'You classify the repository ecosystem (npm, pypi, maven, ...) based on manifest files.',
    tools: [
      { name: 'detect_ecosystem', is_agent: false, signature: '() -> Ecosystem', description: 'Detect ecosystem from manifests.', source_code: null },
      { name: 'list_manifests',   is_agent: false, signature: '() -> List[str]',  description: 'List manifest files in the repo.', source_code: null },
      { name: 'read_manifest',    is_agent: false, signature: '(path: str)',     description: 'Read the contents of a manifest.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 90 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'Patcher',
    registration_id: 'reg_Patcher_1779032491',
    checksum: '943b45e86e61b2dd80e6e8c8f5f9a3b3b94c8a8b3f1d4eaa46c3b5d9b2b5c9d3',
    prompt: 'You execute the patch plan: bump versions, verify, push, raise PR, merge, regenerate SBOM.',
    tools: [
      { name: 'bump_versions',   is_agent: false, signature: '(plan: Plan)',  description: 'Bump dependency versions per plan.', source_code: null },
      { name: 'regenerate_sbom', is_agent: false, signature: '() -> SBOM',    description: 'Regenerate the SBOM after patches.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 90 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'T2MaliciousPlanner',
    registration_id: 'reg_T2MaliciousPlanner_1779032491',
    checksum: 'de96c8cae7c9b51f8f9b8d6c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
    prompt: 'Test scenario: this agent simulates a malicious planner that replays bearer tokens.',
    tools: [
      { name: 't2_malicious_bump_versions', is_agent: false, signature: '(plan: Plan)', description: 'Attempts a malicious bump with a replayed token.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 60 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'T7Planner',
    registration_id: 'reg_T7Planner_1779032491',
    checksum: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    prompt: 'Test scenario T7: attempts cross-agent privilege escalation against the Patcher.',
    tools: [
      { name: 'read_repo',   is_agent: false, signature: '()',                description: 'Read repository state.', source_code: null },
      { name: 'list_files',  is_agent: false, signature: '(path: str)',       description: 'List files (low-privilege observation).', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 60 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'Verifier',
    registration_id: 'reg_Verifier_1779032491',
    checksum: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    prompt: 'You verify every intent token against the registered workflow graph before forwarding to a resource server.',
    tools: [
      { name: 'verify_intent',    is_agent: false, signature: '(token: str) -> Decision', description: 'Verify an intent token signature and binding.', source_code: null },
      { name: 'check_workflow',   is_agent: false, signature: '(graph: Graph)',           description: 'Match call against the workflow graph.', source_code: null },
      { name: 'log_decision',     is_agent: false, signature: '(d: Decision)',            description: 'Append the verify decision to the audit log.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 45 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'Auditor',
    registration_id: 'reg_Auditor_1779032491',
    checksum: 'c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    prompt: 'You stream verifier decisions into the immutable audit log and surface anomalies.',
    tools: [
      { name: 'tail_decisions',   is_agent: false, signature: '() -> Stream<Decision>', description: 'Stream verifier decisions in real-time.', source_code: null },
      { name: 'detect_anomalies', is_agent: false, signature: '(d: Decision)',          description: 'Flag suspicious patterns to the Console.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 30 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'T9TokenReplay',
    registration_id: 'reg_T9TokenReplay_1779032491',
    checksum: 'd9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    prompt: 'Test scenario T9: replays a previously-minted intent token after its valid window.',
    tools: [
      { name: 't9_replay_mint', is_agent: false, signature: '(token: str)', description: 'Attempts to reuse a stale token.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 20 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'SBOMGenerator',
    registration_id: 'reg_SBOMGenerator_1779032491',
    checksum: 'e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    prompt: 'You generate a Software Bill of Materials by walking lockfiles and resolving transitive dependencies.',
    tools: [
      { name: 'walk_lockfile',     is_agent: false, signature: '(path: str) -> Lock',     description: 'Walk a lockfile and yield resolved deps.', source_code: null },
      { name: 'resolve_transitive', is_agent: false, signature: '(deps: List[Dep])',     description: 'Resolve transitive dependencies.', source_code: null },
      { name: 'emit_sbom',         is_agent: false, signature: '() -> SBOM',             description: 'Emit a final SBOM document.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 18 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'VulnTriager',
    registration_id: 'reg_VulnTriager_1779032491',
    checksum: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    prompt: 'You triage discovered vulnerabilities against OSV and EPSS scores and produce a fix priority list.',
    tools: [
      { name: 'lookup_osv',     is_agent: false, signature: '(cve: str) -> OSVRecord', description: 'Look up OSV record for a CVE.', source_code: null },
      { name: 'score_epss',     is_agent: false, signature: '(cve: str) -> float',      description: 'Get the EPSS exploitability score.', source_code: null },
      { name: 'rank_findings',  is_agent: false, signature: '() -> List[Finding]',     description: 'Rank findings by combined risk.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 15 * 1000,
    version: '1.0.0',
  },
  {
    app_id: 'Patchet',
    agent_id: 'PRBuilder',
    registration_id: 'reg_PRBuilder_1779032491',
    checksum: '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    prompt: 'You assemble the final pull request: commit message, description, body, and the reviewers list.',
    tools: [
      { name: 'compose_pr_body', is_agent: false, signature: '(plan: Plan) -> str',  description: 'Render the PR description from the plan.', source_code: null },
      { name: 'pick_reviewers',  is_agent: false, signature: '() -> List[str]',      description: 'Choose reviewers via CODEOWNERS.', source_code: null },
      { name: 'open_pr',         is_agent: false, signature: '(body: str)',          description: 'Open the PR on the upstream remote.', source_code: null },
    ],
    public_key: null,
    registered_at: Date.now() - 10 * 1000,
    version: '1.0.0',
  },
] as const as unknown as Registration[]
