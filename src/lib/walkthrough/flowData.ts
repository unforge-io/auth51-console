import type { FlowNode, FlowEdge, FlowAnnotation } from '@/components/walkthrough/FlowDiagram'
import type { ThreatBranch } from './state'

/**
 * Flow diagram data for each act.
 *
 * The diagram builds progressively:
 * - Act 1: Studio → Agent → Vendor (basic triangle)
 * - Act 2: Adds the letter/token artifact + its path
 * - Act 3: Adds delegation chain (Agent → Sub-agent → Sub-sub-agent)
 * - Act 4: Threat branches fork the flow into danger/success paths
 * - Act 5: Relabels analogy terms to technical Auth51 terms
 * - Act 6: Full diagram with live indicators
 */

// ── Base nodes that persist across acts ──

const STUDIO: FlowNode = {
  id: 'studio',
  label: 'Studio',
  sublabel: 'Organization',
  type: 'actor',
  icon: '🏢',
  x: 30,
  y: 40,
  delay: 0,
}

const PRODUCER: FlowNode = {
  id: 'producer',
  label: 'Line Producer',
  sublabel: 'Orchestrator Agent',
  type: 'actor',
  icon: '🎬',
  x: 250,
  y: 40,
  delay: 0,
}

const VENDOR: FlowNode = {
  id: 'vendor',
  label: 'Vendor',
  sublabel: 'Resource / API',
  type: 'actor',
  icon: '🏪',
  x: 680,
  y: 40,
  delay: 0,
}

// ── Act-specific data ──

export function getActFlowData(act: number, threatBranch: ThreatBranch | null = null): {
  nodes: FlowNode[]
  edges: FlowEdge[]
  annotations: FlowAnnotation[]
  height: number
} {
  switch (act) {
    case 1:
      return getAct1Data()
    case 2:
      return getAct2Data()
    case 3:
      return getAct3Data()
    case 4:
      return getAct4Data(threatBranch)
    case 5:
      return getAct5Data()
    case 6:
      return getAct6Data()
    default:
      return getAct1Data()
  }
}

function getAct1Data() {
  return {
    nodes: [
      { ...STUDIO, delay: 0 },
      { ...PRODUCER, delay: 300 },
      { ...VENDOR, delay: 600 },
      {
        id: 'question',
        label: 'How to authorize?',
        type: 'action' as const,
        x: 370,
        y: 140,
        delay: 900,
        icon: '❓',
      },
    ],
    edges: [
      { from: 'studio', to: 'producer', label: 'employs', delay: 300, variant: 'normal' as const },
      { from: 'producer', to: 'vendor', label: 'needs access', delay: 600, variant: 'dashed' as const },
    ],
    annotations: [
      {
        id: 'a1-context',
        text: 'The studio needs crew members to interact with vendors — but how do you maintain control?',
        x: 320,
        y: 210,
        delay: 1200,
        variant: 'info' as const,
      },
    ],
    height: 320,
  }
}

function getAct2Data() {
  return {
    nodes: [
      { ...STUDIO, delay: 0 },
      { ...PRODUCER, delay: 0 },
      { ...VENDOR, delay: 0 },
      {
        id: 'letter',
        label: 'Letter of Auth',
        sublabel: 'Bearer Token / JWT',
        type: 'artifact' as const,
        icon: '📜',
        x: 470,
        y: 40,
        delay: 300,
      },
      {
        id: 'bearer-problem',
        label: 'Bearer Problem',
        sublabel: 'Anyone with the letter can use it',
        type: 'threat' as const,
        icon: '⚠️',
        x: 470,
        y: 150,
        delay: 900,
      },
      {
        id: 'pop-solution',
        label: 'Proof-of-Possession',
        sublabel: 'Bound to agent\'s key',
        type: 'success' as const,
        icon: '🔑',
        x: 470,
        y: 240,
        delay: 1400,
      },
    ],
    edges: [
      { from: 'studio', to: 'producer', label: 'authorizes', delay: 0, variant: 'normal' as const },
      { from: 'producer', to: 'letter', label: 'carries', delay: 300, variant: 'normal' as const },
      { from: 'letter', to: 'vendor', label: 'presents', delay: 500, variant: 'normal' as const },
      { from: 'letter', to: 'bearer-problem', label: 'but...', delay: 900, variant: 'danger' as const },
      { from: 'bearer-problem', to: 'pop-solution', label: 'Auth51 fixes', delay: 1400, variant: 'success' as const },
    ],
    annotations: [
      {
        id: 'a2-bearer',
        text: 'OAuth bearer tokens: whoever holds the token can use it. No proof the presenter is the authorized agent.',
        x: 30,
        y: 170,
        delay: 900,
        variant: 'danger' as const,
      },
      {
        id: 'a2-pop',
        text: 'Auth51 binds every token to a cryptographic keypair. Stolen tokens are useless without the private key.',
        x: 30,
        y: 270,
        delay: 1400,
        variant: 'success' as const,
      },
    ],
    height: 360,
  }
}

function getAct3Data() {
  return {
    nodes: [
      { ...STUDIO, delay: 0 },
      { ...PRODUCER, delay: 0 },
      {
        id: 'coordinator',
        label: 'Coordinator',
        sublabel: 'Sub-agent',
        type: 'actor' as const,
        icon: '👤',
        x: 470,
        y: 40,
        delay: 300,
      },
      {
        id: 'assistant',
        label: 'Assistant',
        sublabel: 'Sub-sub-agent',
        type: 'actor' as const,
        icon: '👤',
        x: 680,
        y: 40,
        delay: 600,
      },
      { ...VENDOR, y: 150, delay: 0 },
      {
        id: 'scope-narrows',
        label: 'Scope narrows',
        sublabel: 'at each delegation',
        type: 'check' as const,
        icon: '🔒',
        x: 370,
        y: 150,
        delay: 900,
      },
      {
        id: 'chain',
        label: 'Full chain audit',
        sublabel: 'Every link signed',
        type: 'success' as const,
        icon: '🔗',
        x: 370,
        y: 240,
        delay: 1200,
      },
    ],
    edges: [
      { from: 'studio', to: 'producer', label: 'full scope', delay: 0, variant: 'normal' as const },
      { from: 'producer', to: 'coordinator', label: 'delegates (narrower)', delay: 300, variant: 'normal' as const },
      { from: 'coordinator', to: 'assistant', label: 'delegates (narrowest)', delay: 600, variant: 'normal' as const },
      { from: 'assistant', to: 'vendor', label: 'accesses', delay: 800, variant: 'dashed' as const },
      { from: 'producer', to: 'scope-narrows', delay: 900, variant: 'success' as const },
    ],
    annotations: [
      {
        id: 'a3-delegation',
        text: 'Auth51 maintains the full delegation chain cryptographically. Every link is signed, scoped, and auditable.',
        x: 550,
        y: 200,
        delay: 1200,
        variant: 'brand' as const,
      },
    ],
    height: 340,
  }
}

function getAct4Data(threatBranch: ThreatBranch | null) {
  if (!threatBranch) {
    // Show the four threat entry points
    return {
      nodes: [
        { ...STUDIO, delay: 0 },
        { ...PRODUCER, delay: 0 },
        {
          id: 'coordinator',
          label: 'Coordinator',
          sublabel: 'Sub-agent',
          type: 'actor' as const,
          icon: '👤',
          x: 470,
          y: 40,
          delay: 0,
        },
        { ...VENDOR, delay: 0 },
        // Four threat nodes
        {
          id: 'threat-fraudulent',
          label: '🏪 Fraudulent Vendor',
          type: 'threat' as const,
          x: 30,
          y: 170,
          delay: 300,
        },
        {
          id: 'threat-rogue',
          label: '🎭 Rogue Assistant',
          type: 'threat' as const,
          x: 250,
          y: 170,
          delay: 500,
        },
        {
          id: 'threat-stolen',
          label: '📄 Stolen Letter',
          type: 'threat' as const,
          x: 470,
          y: 170,
          delay: 700,
        },
        {
          id: 'threat-impersonation',
          label: '🎬 Impersonation',
          type: 'threat' as const,
          x: 680,
          y: 170,
          delay: 900,
        },
      ],
      edges: [
        { from: 'studio', to: 'producer', delay: 0, variant: 'normal' as const },
        { from: 'producer', to: 'coordinator', delay: 0, variant: 'normal' as const },
        { from: 'coordinator', to: 'vendor', delay: 0, variant: 'normal' as const },
      ],
      annotations: [
        {
          id: 'a4-choose',
          text: 'Click a threat scenario to see how the flow breaks — and how Auth51 prevents it.',
          x: 250,
          y: 270,
          delay: 1100,
          variant: 'info' as const,
        },
      ],
      height: 370,
    }
  }

  // Show the specific threat branch with diverging paths
  return getThreatBranchData(threatBranch)
}

function getThreatBranchData(branch: ThreatBranch) {
  const branchConfigs: Record<ThreatBranch, {
    attackerLabel: string
    attackerIcon: string
    targetLabel: string
    attackAction: string
    failureLabel: string
    successLabel: string
    failureDetail: string
    successDetail: string
    anchor: string
  }> = {
    'fraudulent-vendor': {
      attackerLabel: 'Fake Vendor',
      attackerIcon: '🏪',
      targetLabel: 'Coordinator',
      attackAction: 'calls with copied letter',
      failureLabel: 'Charge accepted',
      successLabel: 'PoP check fails',
      failureDetail: 'Studio loses money. Discovered during invoice review.',
      successDetail: 'No valid private key → rejected instantly.',
      anchor: 'A8: Workflow-step binding',
    },
    'rogue-assistant': {
      attackerLabel: 'Rogue Assistant',
      attackerIcon: '🎭',
      targetLabel: 'Car Rental',
      attackAction: 'uses catering auth for cars',
      failureLabel: 'Out-of-scope purchase',
      successLabel: 'Scope check fails',
      failureDetail: 'Caught only in monthly reconciliation.',
      successDetail: 'Token scope: "catering, max $500" → car rental rejected.',
      anchor: 'A2: Scoped intent declaration',
    },
    'stolen-letter': {
      attackerLabel: 'Thief',
      attackerIcon: '🕵️',
      targetLabel: 'Vendor',
      attackAction: 'intercepts token in transit',
      failureLabel: 'Full access granted',
      successLabel: 'No private key',
      failureDetail: 'Indistinguishable from legitimate use.',
      successDetail: 'Token requires PoP signature → stolen token is noise.',
      anchor: 'A6: Proof-of-possession',
    },
    'substituted-producer': {
      attackerLabel: 'Impersonator',
      attackerIcon: '🎭',
      targetLabel: 'Sub-agents',
      attackAction: 'issues fake delegations',
      failureLabel: 'Fake delegation chain',
      successLabel: 'Identity check fails',
      failureDetail: 'Entire sub-tree of agents compromised.',
      successDetail: 'Can\'t forge delegation without registered keypair.',
      anchor: 'A2 + A6: Identity + PoP',
    },
  }

  const cfg = branchConfigs[branch]

  return {
    nodes: [
      // The attacker
      {
        id: 'attacker',
        label: cfg.attackerLabel,
        type: 'threat' as const,
        icon: cfg.attackerIcon,
        x: 30,
        y: 40,
        delay: 0,
      },
      // Target
      {
        id: 'target',
        label: cfg.targetLabel,
        type: 'actor' as const,
        x: 300,
        y: 40,
        delay: 0,
      },
      // Fork point
      {
        id: 'fork',
        label: 'Verification?',
        type: 'check' as const,
        icon: '🔀',
        x: 530,
        y: 40,
        delay: 500,
      },
      // Without Auth51 path (top)
      {
        id: 'no-auth51',
        label: 'Without Auth51',
        sublabel: 'Bearer token only',
        type: 'failure' as const,
        icon: '✗',
        x: 680,
        y: 0,
        delay: 800,
      },
      {
        id: 'failure-outcome',
        label: cfg.failureLabel,
        type: 'failure' as const,
        x: 680,
        y: 90,
        delay: 1100,
      },
      // With Auth51 path (bottom)
      {
        id: 'with-auth51',
        label: 'With Auth51',
        sublabel: 'PoP + Scope + Identity',
        type: 'success' as const,
        icon: '✓',
        x: 680,
        y: 190,
        delay: 800,
      },
      {
        id: 'success-outcome',
        label: cfg.successLabel,
        type: 'success' as const,
        x: 680,
        y: 280,
        delay: 1100,
      },
    ],
    edges: [
      { from: 'attacker', to: 'target', label: cfg.attackAction, delay: 200, variant: 'danger' as const },
      { from: 'target', to: 'fork', label: 'reaches check', delay: 500, variant: 'normal' as const },
      { from: 'fork', to: 'no-auth51', delay: 800, variant: 'danger' as const },
      { from: 'no-auth51', to: 'failure-outcome', delay: 1100, variant: 'danger' as const },
      { from: 'fork', to: 'with-auth51', delay: 800, variant: 'success' as const },
      { from: 'with-auth51', to: 'success-outcome', delay: 1100, variant: 'success' as const },
    ],
    annotations: [
      {
        id: 'fail-detail',
        text: cfg.failureDetail,
        x: 440,
        y: 100,
        delay: 1300,
        variant: 'danger' as const,
      },
      {
        id: 'success-detail',
        text: cfg.successDetail,
        x: 440,
        y: 260,
        delay: 1300,
        variant: 'success' as const,
      },
      {
        id: 'anchor',
        text: `Auth51 anchor: ${cfg.anchor}`,
        x: 440,
        y: 350,
        delay: 1600,
        variant: 'brand' as const,
      },
    ],
    height: 420,
  }
}

function getAct5Data() {
  // Technical mapping — relabeled nodes
  return {
    nodes: [
      {
        id: 'authority',
        label: 'Auth51 Authority',
        sublabel: 'Control Plane (HA)',
        type: 'actor' as const,
        icon: '🏢',
        x: 30,
        y: 40,
        delay: 0,
      },
      {
        id: 'runtime',
        label: 'Auth51 Runtime',
        sublabel: 'In-process library',
        type: 'artifact' as const,
        icon: '⚙️',
        x: 250,
        y: 40,
        delay: 300,
      },
      {
        id: 'jwt',
        label: 'Agentic JWT',
        sublabel: 'Intent Token + PoP',
        type: 'artifact' as const,
        icon: '📜',
        x: 470,
        y: 40,
        delay: 600,
      },
      {
        id: 'verifier',
        label: 'Auth51 Verifier',
        sublabel: 'Sidecar / Gateway',
        type: 'check' as const,
        icon: '🛡️',
        x: 680,
        y: 40,
        delay: 900,
      },
      {
        id: 'console',
        label: 'Auth51 Console',
        sublabel: 'Operator UI',
        type: 'actor' as const,
        icon: '📊',
        x: 30,
        y: 160,
        delay: 1200,
      },
      {
        id: 'cli',
        label: 'Auth51 CLI (a51)',
        sublabel: 'Operator tool',
        type: 'action' as const,
        icon: '⌨️',
        x: 250,
        y: 160,
        delay: 1200,
      },
    ],
    edges: [
      { from: 'authority', to: 'runtime', label: 'registers + mints', delay: 300, variant: 'normal' as const },
      { from: 'runtime', to: 'jwt', label: 'signs request', delay: 600, variant: 'normal' as const },
      { from: 'jwt', to: 'verifier', label: 'verified at boundary', delay: 900, variant: 'success' as const },
      { from: 'console', to: 'authority', label: 'observes', delay: 1200, variant: 'dashed' as const },
      { from: 'cli', to: 'authority', label: 'manages', delay: 1200, variant: 'dashed' as const },
    ],
    annotations: [
      {
        id: 'a5-flow',
        text: 'Agent loads Runtime → registers with Authority → signs with Agentic JWT → verified at Verifier.',
        x: 470,
        y: 160,
        delay: 1500,
        variant: 'brand' as const,
      },
    ],
    height: 280,
  }
}

function getAct6Data() {
  return getAct5Data() // Same diagram, will add live indicators later
}
