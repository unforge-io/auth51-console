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
] as const as unknown as Registration[]
