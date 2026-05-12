import type { Node, Edge, MarkerType } from '@xyflow/react'
import type { ThreatBranch } from './state'

/**
 * React Flow data for each act of the walkthrough.
 *
 * Layout principles:
 * - X-gap between adjacent nodes ≥ 320 px so the edge has visible length
 *   beyond the floating label pill.
 * - Y-gap between rows ≥ 140 px so labels don't crowd vertically either.
 * - Each scene fits in a viewport ~1200x600 with `fitView` padding ~0.4.
 *
 * INTERACTION MODEL:
 * - In most acts, a "continue" node at the right advances to the next act.
 * - In Act 4, threat nodes are clickable to open branches.
 * - In threat branches, clicking "Back" returns to the Act 4 hub.
 */

const EDGE_DEFAULTS = {
  animated: true,
  style: { strokeWidth: 2 },
}

const MARKER_END: { type: MarkerType; width: number; height: number } = {
  type: 'arrowclosed' as MarkerType,
  width: 16,
  height: 16,
}

// ── Layout constants ──
const COL = { c0: 0, c1: 340, c2: 680, c3: 1020, c4: 1280 } as const
const ROW = { r0: 0, r1: 80, r2: 240, r3: 380, r4: 520 } as const

export function getReactFlowData(
  act: number,
  threatBranch: ThreatBranch | null = null,
): { nodes: Node[]; edges: Edge[] } {
  switch (act) {
    case 1: return getAct1()
    case 2: return getAct2()
    case 3: return getAct3()
    case 4: return threatBranch ? getThreatBranch(threatBranch) : getAct4Hub()
    case 5: return getAct5()
    case 6: return getAct6()
    default: return getAct1()
  }
}

function getAct1(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'studio',   type: 'actor', position: { x: COL.c0, y: ROW.r1 }, data: { label: 'Studio',        sublabel: 'Your Organization',    icon: '🏢' } },
      { id: 'producer', type: 'actor', position: { x: COL.c1, y: ROW.r1 }, data: { label: 'Line Producer', sublabel: 'Orchestrator Agent',   icon: '🎬' } },
      { id: 'vendor',   type: 'actor', position: { x: COL.c2, y: ROW.r1 }, data: { label: 'Vendor',        sublabel: 'Resource / API',       icon: '🏪' } },
      { id: 'question', type: 'annotation', position: { x: COL.c1 - 60, y: ROW.r3 }, data: { label: 'The studio needs crew members to work with vendors — but how do you authorize them while keeping control?', variant: 'brand' } },
      { id: 'next',     type: 'check', position: { x: COL.c3, y: ROW.r1 + 5 }, data: { label: 'Next →', icon: '▶', clickable: true } },
    ],
    edges: [
      { id: 'e-studio-producer', source: 'studio', target: 'producer', label: 'employs', ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#0a2540' } },
      { id: 'e-producer-vendor', source: 'producer', target: 'vendor', label: 'needs access', ...EDGE_DEFAULTS, markerEnd: MARKER_END, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#8898aa', strokeDasharray: '6 4' } },
      { id: 'e-vendor-next',     source: 'vendor', target: 'next', ...EDGE_DEFAULTS, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#d6d3d1' } },
    ],
  }
}

function getAct2(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'studio',   type: 'actor',    position: { x: COL.c0, y: ROW.r0 }, data: { label: 'Studio',        sublabel: 'Organization', icon: '🏢' } },
      { id: 'producer', type: 'actor',    position: { x: COL.c1, y: ROW.r0 }, data: { label: 'Line Producer', sublabel: 'Agent',        icon: '🎬' } },
      { id: 'letter',   type: 'artifact', position: { x: COL.c2, y: ROW.r0 }, data: { label: 'Letter of Auth', sublabel: 'Bearer Token', icon: '📜' } },
      { id: 'vendor',   type: 'actor',    position: { x: COL.c3, y: ROW.r0 }, data: { label: 'Vendor',        sublabel: 'Resource',     icon: '🏪' } },
      // Bearer problem branch
      { id: 'bearer-issue', type: 'threat',  position: { x: COL.c2 - 80, y: ROW.r2 }, data: { label: 'Bearer Problem',       sublabel: 'Anyone with the letter can use it', icon: '⚠️' } },
      // Auth51 solution
      { id: 'pop-fix',      type: 'success', position: { x: COL.c2 - 80, y: ROW.r4 }, data: { label: 'Proof-of-Possession',  sublabel: 'Token bound to agent\'s key',       icon: '🔑' } },
      // Annotations
      { id: 'ann-bearer', type: 'annotation', position: { x: COL.c0, y: ROW.r2 + 10 }, data: { label: 'OAuth: whoever holds the token can use it. If the letter is stolen, the thief has full access.', variant: 'danger' } },
      { id: 'ann-pop',    type: 'annotation', position: { x: COL.c0, y: ROW.r4 + 10 }, data: { label: 'Auth51: every request signed with the agent\'s private key. Stolen tokens are cryptographic noise.', variant: 'success' } },
      { id: 'next',       type: 'check',      position: { x: COL.c3 + 20, y: ROW.r4 + 10 }, data: { label: 'Next →', icon: '▶', clickable: true } },
    ],
    edges: [
      { id: 'e1', source: 'studio',       target: 'producer',     label: 'authorizes',         ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#0a2540' } },
      { id: 'e2', source: 'producer',     target: 'letter',       label: 'carries',            ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#635bff' } },
      { id: 'e3', source: 'letter',       target: 'vendor',       label: 'presents',           ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#635bff' } },
      { id: 'e4', source: 'letter',       target: 'bearer-issue', sourceHandle: 'bottom', targetHandle: 'top', label: 'but…',           ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444' } },
      { id: 'e5', source: 'bearer-issue', target: 'pop-fix',      sourceHandle: 'bottom', targetHandle: 'top', label: 'Auth51 fixes this', ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#10b981' } },
      { id: 'e6', source: 'pop-fix',      target: 'next',                                          ...EDGE_DEFAULTS, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#d6d3d1' } },
    ],
  }
}

function getAct3(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'studio',      type: 'actor',   position: { x: COL.c0, y: ROW.r1 }, data: { label: 'Studio',      sublabel: 'Organization',     icon: '🏢' } },
      { id: 'producer',    type: 'actor',   position: { x: COL.c1, y: ROW.r1 }, data: { label: 'Producer',    sublabel: 'Orchestrator',     icon: '🎬' } },
      { id: 'coordinator', type: 'actor',   position: { x: COL.c2, y: ROW.r1 }, data: { label: 'Coordinator', sublabel: 'Sub-agent',        icon: '👤' } },
      { id: 'assistant',   type: 'actor',   position: { x: COL.c3, y: ROW.r1 }, data: { label: 'Assistant',   sublabel: 'Sub-sub-agent',    icon: '👤' } },
      { id: 'vendor',      type: 'actor',   position: { x: COL.c3, y: ROW.r3 }, data: { label: 'Vendor',      sublabel: 'Resource',         icon: '🏪' } },
      { id: 'scope',       type: 'success', position: { x: COL.c1, y: ROW.r3 }, data: { label: 'Scope narrows at each step', sublabel: 'Full → Catering → Single order', icon: '🔒' } },
      { id: 'ann-chain',   type: 'annotation', position: { x: COL.c0, y: ROW.r4 + 20 }, data: { label: 'Auth51 maintains the full delegation chain cryptographically. Every link is signed, scoped, and auditable back to the original authorization.', variant: 'brand' } },
      { id: 'next',        type: 'check', position: { x: COL.c3 - 60, y: ROW.r4 + 30 }, data: { label: 'What can go wrong? →', icon: '⚠️', clickable: true } },
    ],
    edges: [
      { id: 'e1', source: 'studio',      target: 'producer',    label: 'full scope',    ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#0a2540' } },
      { id: 'e2', source: 'producer',    target: 'coordinator', label: 'narrows',       ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#0a2540' } },
      { id: 'e3', source: 'coordinator', target: 'assistant',   label: 'narrows more',  ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#0a2540' } },
      { id: 'e4', source: 'assistant',   target: 'vendor', sourceHandle: 'bottom', targetHandle: 'top', label: 'accesses', ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#8898aa', strokeDasharray: '6 4' } },
      { id: 'e5', source: 'coordinator', target: 'scope',  sourceHandle: 'bottom', targetHandle: 'top',                       ...EDGE_DEFAULTS, animated: false,       style: { ...EDGE_DEFAULTS.style, stroke: '#10b981' } },
    ],
  }
}

function getAct4Hub(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'center', type: 'check', position: { x: COL.c2 - 80, y: ROW.r0 }, data: { label: 'What can go wrong?', icon: '⚠️' } },
      // Four clickable threat nodes (spread wider, 240px gap each)
      { id: 'threat-fraudulent-vendor',  type: 'threat', position: { x: COL.c0,        y: ROW.r2 + 20 }, data: { label: 'Fraudulent Vendor',  sublabel: 'Privilege escalation', icon: '🏪', clickable: true } },
      { id: 'threat-rogue-assistant',    type: 'threat', position: { x: COL.c0 + 320,  y: ROW.r2 + 20 }, data: { label: 'Rogue Assistant',    sublabel: 'Scope escape',         icon: '🎭', clickable: true } },
      { id: 'threat-stolen-letter',      type: 'threat', position: { x: COL.c0 + 640,  y: ROW.r2 + 20 }, data: { label: 'Stolen Letter',      sublabel: 'Token replay',         icon: '📄', clickable: true } },
      { id: 'threat-substituted-producer', type: 'threat', position: { x: COL.c0 + 960, y: ROW.r2 + 20 }, data: { label: 'Impersonation',     sublabel: 'Identity spoofing',     icon: '🎬', clickable: true } },
      { id: 'ann-choose', type: 'annotation', position: { x: COL.c1, y: ROW.r4 + 20 }, data: { label: 'Click any threat to see how the flow breaks — and how Auth51 prevents it.', variant: 'info' } },
      { id: 'next', type: 'check', position: { x: COL.c0 + 960, y: ROW.r4 + 30 }, data: { label: 'Skip to translation →', icon: '▶', clickable: true } },
    ],
    edges: [
      { id: 'e1', source: 'center', target: 'threat-fraudulent-vendor',  sourceHandle: 'bottom', targetHandle: 'top', ...EDGE_DEFAULTS, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444', strokeDasharray: '6 4' } },
      { id: 'e2', source: 'center', target: 'threat-rogue-assistant',    sourceHandle: 'bottom', targetHandle: 'top', ...EDGE_DEFAULTS, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444', strokeDasharray: '6 4' } },
      { id: 'e3', source: 'center', target: 'threat-stolen-letter',      sourceHandle: 'bottom', targetHandle: 'top', ...EDGE_DEFAULTS, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444', strokeDasharray: '6 4' } },
      { id: 'e4', source: 'center', target: 'threat-substituted-producer', sourceHandle: 'bottom', targetHandle: 'top', ...EDGE_DEFAULTS, animated: false, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444', strokeDasharray: '6 4' } },
    ],
  }
}

function getThreatBranch(branch: ThreatBranch): { nodes: Node[]; edges: Edge[] } {
  const configs: Record<ThreatBranch, {
    attacker: string; attackerIcon: string; action: string
    failLabel: string; failDetail: string
    winLabel: string; winDetail: string
    anchor: string
  }> = {
    'fraudulent-vendor': {
      attacker: 'Fake Vendor', attackerIcon: '🏪', action: 'presents copied letter',
      failLabel: '✗ Charge accepted', failDetail: 'Studio loses money',
      winLabel: '✓ PoP check fails', winDetail: 'No private key → instant rejection',
      anchor: 'A8: Workflow-step binding',
    },
    'rogue-assistant': {
      attacker: 'Rogue Assistant', attackerIcon: '🎭', action: 'uses catering auth for cars',
      failLabel: '✗ Out-of-scope purchase', failDetail: 'Caught in monthly reconciliation',
      winLabel: '✓ Scope check fails', winDetail: 'Token scope: "catering, $500" → rejected',
      anchor: 'A2: Scoped intent',
    },
    'stolen-letter': {
      attacker: 'Thief', attackerIcon: '🕵️', action: 'intercepts token in transit',
      failLabel: '✗ Full access granted', failDetail: 'Indistinguishable from legitimate',
      winLabel: '✓ Token unusable', winDetail: 'No private key → cryptographic noise',
      anchor: 'A6: Proof-of-possession',
    },
    'substituted-producer': {
      attacker: 'Impersonator', attackerIcon: '🎭', action: 'issues fake delegations',
      failLabel: '✗ Fake delegation chain', failDetail: 'Entire sub-tree compromised',
      winLabel: '✓ Delegation rejected', winDetail: 'Can\'t forge without registered keypair',
      anchor: 'A2 + A6: Identity + PoP',
    },
  }

  const c = configs[branch]

  return {
    nodes: [
      { id: 'attacker', type: 'threat', position: { x: COL.c0, y: ROW.r2 }, data: { label: c.attacker, icon: c.attackerIcon } },
      { id: 'target',   type: 'actor',  position: { x: COL.c1, y: ROW.r2 }, data: { label: 'Target',  sublabel: 'Verification point', icon: '🎯' } },
      { id: 'fork',     type: 'check',  position: { x: COL.c2, y: ROW.r2 }, data: { label: 'Auth check?', icon: '🔀' } },
      // Failure path (top)
      { id: 'no-auth51',     type: 'threat',     position: { x: COL.c3, y: ROW.r0 }, data: { label: 'Without Auth51', sublabel: 'Bearer token only', icon: '✗' } },
      { id: 'fail-outcome',  type: 'annotation', position: { x: COL.c3, y: ROW.r1 + 20 }, data: { label: `${c.failLabel}\n${c.failDetail}`, variant: 'danger' } },
      // Success path (bottom)
      { id: 'with-auth51',  type: 'success',    position: { x: COL.c3, y: ROW.r3 }, data: { label: 'With Auth51',    sublabel: 'PoP + Scope + Identity', icon: '✓' } },
      { id: 'win-outcome',  type: 'annotation', position: { x: COL.c3, y: ROW.r4 - 20 }, data: { label: `${c.winLabel}\n${c.winDetail}`, variant: 'success' } },
      // Anchor reference
      { id: 'anchor', type: 'annotation', position: { x: COL.c1, y: ROW.r4 + 20 }, data: { label: `Auth51 anchor: ${c.anchor}`, variant: 'brand' } },
      // Back button
      { id: 'back', type: 'check', position: { x: COL.c0, y: ROW.r0 }, data: { label: '← Back', icon: '◀', clickable: true } },
    ],
    edges: [
      { id: 'e1', source: 'attacker', target: 'target', label: c.action, ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444' } },
      { id: 'e2', source: 'target',   target: 'fork',                       ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#8898aa' } },
      // Fork → failure
      { id: 'e3', source: 'fork', target: 'no-auth51',                              ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#ef4444' } },
      // Fork → success
      { id: 'e4', source: 'fork', target: 'with-auth51', sourceHandle: 'bottom', targetHandle: 'top', ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#10b981' } },
    ],
  }
}

function getAct5(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'authority', type: 'actor',    position: { x: COL.c0, y: ROW.r1 }, data: { label: 'Auth51 Authority', sublabel: 'Control Plane (HA)', icon: '🏢' } },
      { id: 'runtime',   type: 'artifact', position: { x: COL.c1, y: ROW.r1 }, data: { label: 'Auth51 Runtime',   sublabel: 'In-process library', icon: '⚙️' } },
      { id: 'jwt',       type: 'artifact', position: { x: COL.c2, y: ROW.r1 }, data: { label: 'Agentic JWT',      sublabel: 'Intent Token + PoP', icon: '📜' } },
      { id: 'verifier',  type: 'success',  position: { x: COL.c3, y: ROW.r1 }, data: { label: 'Auth51 Verifier',  sublabel: 'Sidecar / Gateway',  icon: '🛡️' } },
      { id: 'console',   type: 'actor',    position: { x: COL.c0, y: ROW.r3 }, data: { label: 'Auth51 Console',   sublabel: 'Operator UI',        icon: '📊' } },
      { id: 'cli',       type: 'actor',    position: { x: COL.c1, y: ROW.r3 }, data: { label: 'Auth51 CLI (a51)', sublabel: 'Operator tool',      icon: '⌨️' } },
      { id: 'ann-flow',  type: 'annotation', position: { x: COL.c2, y: ROW.r3 + 10 }, data: { label: 'Agent loads Runtime → registers with Authority → signs with Agentic JWT → verified at Verifier. Operators observe via Console.', variant: 'brand' } },
      { id: 'next',      type: 'check',      position: { x: COL.c3, y: ROW.r3 + 30 }, data: { label: 'Try it live →', icon: '🚀', clickable: true } },
    ],
    edges: [
      { id: 'e1', source: 'authority', target: 'runtime',  label: 'registers + mints', ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#0a2540' } },
      { id: 'e2', source: 'runtime',   target: 'jwt',      label: 'signs request',     ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#635bff' } },
      { id: 'e3', source: 'jwt',       target: 'verifier', label: 'verified',          ...EDGE_DEFAULTS, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#10b981' } },
      { id: 'e4', source: 'console',   target: 'authority', label: 'observes',         ...EDGE_DEFAULTS, animated: false, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#8898aa', strokeDasharray: '6 4' } },
      { id: 'e5', source: 'cli',       target: 'authority', label: 'manages',          ...EDGE_DEFAULTS, animated: false, markerEnd: MARKER_END, style: { ...EDGE_DEFAULTS.style, stroke: '#8898aa', strokeDasharray: '6 4' } },
    ],
  }
}

function getAct6(): { nodes: Node[]; edges: Edge[] } {
  const base = getAct5()
  // Remove the "next" node, replace with coming soon
  return {
    nodes: [
      ...base.nodes.filter(n => n.id !== 'next'),
      { id: 'demo', type: 'annotation', position: { x: COL.c3, y: ROW.r3 + 30 }, data: { label: '🚀 Live demo coming soon. Connect to a real Auth51 Authority and watch agent registration, token minting, and verification in real time.', variant: 'brand' } },
    ],
    edges: base.edges,
  }
}
