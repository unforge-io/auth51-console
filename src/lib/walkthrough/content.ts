/**
 * All walkthrough copy in one file — edit text here without touching components.
 *
 * The analogy: a film production where a studio (Auth51 Authority) issues
 * letters of authorization to crew members (agents) working with vendors (resources).
 */

export const WALKTHROUGH_INTRO = {
  title: 'How agents get trust',
  subtitle:
    'A 5-minute interactive walkthrough using a film-production analogy to explain why AI agents need more than OAuth — and what Auth51 does about it.',
}

export const ACT_CONTENT = {
  1: {
    title: 'The Setup',
    eyebrow: '01 — THE SETUP',
    narrative: `A major film studio is producing a blockbuster. The production involves dozens of crew members — directors, coordinators, assistants — each authorized to make specific purchases and decisions on behalf of the studio.

The studio needs a system to authorize crew members to interact with vendors (equipment rental, catering, locations) while maintaining control over budgets, scopes, and audit trails. But here's the twist: the crew members are AI-powered. They reason on the fly, pick vendors dynamically, and make decisions the studio didn't explicitly pre-approve.

This is exactly the problem enterprises face deploying AI agents. OAuth was built for deterministic apps following fixed code paths. But LLM-powered agents generate dynamic workflows through reasoning — selecting tools and APIs on the fly. The question becomes: how do you verify not just who the agent is, but that it's running approved code and acting within its intended scope?`,
    aside: 'OAuth 2.0 assumes the client faithfully executes the resource owner\'s intent. That assumption breaks when an LLM generates the workflow dynamically.',
  },

  2: {
    title: 'The Letter of Authorization',
    eyebrow: '02 — AUTHORIZATION',
    narrative: `Today's approach: the studio gives each crew member a generic letter of authorization — a signed document that says "this person can spend money on behalf of the studio." The vendor receives the letter, checks the studio's signature, and fulfills the order.

But here's the gap: the letter doesn't say what the crew member looks like. It doesn't say what specific task they're performing right now. And any crew member can hand their letter to someone else. In OAuth terms, this letter is a bearer token — whoever holds it can use it.

Auth51 replaces this with something fundamentally different: an intent token. The letter now includes a fingerprint of the crew member (their checksum — verifying they haven't been tampered with), a description of exactly what they intend to do (the workflow step), and it can only be used by the person who has a matching private key (proof-of-possession).`,
    comparison: {
      oauth: {
        label: 'Traditional OAuth (Bearer Token)',
        points: [
          'Token is a bearer instrument — whoever holds it can use it',
          'Identity is at the application level, not the individual agent',
          'No verification that the agent is running approved, unmodified code',
          'No binding between token and the specific task being performed',
        ],
      },
      auth51: {
        label: 'Auth51 (Intent Token)',
        points: [
          'Agent identity verified via runtime checksum — its prompt, tools, and config fingerprinted',
          'Every request includes proof-of-possession — a private key signature that can\'t be transferred',
          'Token encodes intent: the specific workflow step and declared action',
          'Stolen tokens fail PoP verification — useless without the agent\'s ephemeral key',
        ],
      },
    },
  },

  3: {
    title: 'Delegation & Workflow Tracking',
    eyebrow: '03 — DELEGATION',
    narrative: `The production grows. The line producer can't handle everything alone, so they delegate. They authorize a coordinator to handle catering, and the coordinator authorizes an assistant to place individual orders.

This is delegation — a chain of trust. The studio authorized the producer. The producer authorized the coordinator. The coordinator authorized the assistant. Each level narrows the scope: the assistant can order lunch, not rent cameras.

But Auth51 goes further than simple delegation. The shim library tracks the entire workflow — every tool call, every step — and embeds it into the token as a hashed delegation chain. When the assistant orders lunch, the intent token cryptographically proves the full path: studio → producer → coordinator → assistant → "order lunch for 12 people." The vendor doesn't just trust the letter — they can verify the entire chain of decisions that led to this specific request.`,
    aside: 'Each intent token includes a delegation_chain hash and step_sequence_hash — the IDP verifies the workflow step is registered and the chain is unbroken. OAuth has no concept of workflow-aware authorization.',
  },

  4: {
    title: 'What Can Go Wrong',
    eyebrow: '04 — THREATS',
    narrative: `Now the interesting part. Four things can go wrong in this production — four threat scenarios that map directly to real-world agent security failures.

Choose a scenario to explore:`,
    branches: {
      'fraudulent-vendor': {
        title: 'A fraudulent vendor calls the coordinator',
        icon: '🏪',
        realWorldParallel: 'Cross-agent privilege escalation (T7)',
        withoutAuth51: {
          narrative:
            'A low-privilege agent manipulates a higher-privilege agent into executing operations beyond its authorization — like the 2020 Twitter OAuth compromise where read-only tokens led to unauthorized posting. The coordinator processes the order because the bearer token is valid.',
          outcome: '✗ Charge accepted. Studio loses money. Discovered later, during invoice review.',
        },
        withAuth51: {
          narrative:
            'Auth51\'s intent token binds each action to a specific workflow step (Anchor A7). The fraudulent request fails because the token\'s intent field doesn\'t match the requested action, and the agent\'s runtime checksum (Anchor A1) confirms it\'s not the authorized agent. The request is blocked at the IDP before any action occurs.',
          outcome: '✓ Blocked at IDP (HTTP 403). Detection time: instant.',
          anchor: 'A7: Intent token binding + A1: Agent checksum verification',
        },
      },
      'rogue-assistant': {
        title: 'An assistant goes off-script',
        icon: '🎭',
        realWorldParallel: 'Scope inflation / workflow bypass (T8, T9)',
        withoutAuth51: {
          narrative:
            'An assistant authorized to order lunch decides to rent a luxury car instead. The LLM reasons that "transportation" is related to "catering logistics." With a standard OAuth bearer token, the rental company sees valid credentials and processes the charge — scopes are too coarse to catch this.',
          outcome: '✗ Out-of-scope purchase succeeds. Caught only in monthly reconciliation.',
        },
        withAuth51: {
          narrative:
            'Auth51\'s workflow validation (Anchor A8) checks the current action against the registered workflow. The assistant\'s workflow was registered as "order catering" — renting a car isn\'t a registered step. The IDP also verifies the step_sequence_hash to ensure steps execute in order. The car rental request is rejected with a workflow violation.',
          outcome: '✓ Rejected at IDP (HTTP 403). Workflow violation logged.',
          anchor: 'A8: Workflow validation + A7: Intent binding',
        },
      },
      'stolen-letter': {
        title: 'A letter gets stolen in transit',
        icon: '📄',
        realWorldParallel: 'Token replay attack (T2)',
        withoutAuth51: {
          narrative:
            'Someone intercepts the authorization letter between the coordinator and the vendor. They now have a valid, signed bearer token. They replay it against the API and make unauthorized requests. The token is genuine — the signature checks out — so the resource server has no reason to refuse.',
          outcome: '✗ Full access with the stolen token. Indistinguishable from legitimate use.',
        },
        withAuth51: {
          narrative:
            'Even if the intent token is intercepted, the thief can\'t use it. Every request requires an HTTP message signature (RFC 9440) using the agent\'s ephemeral Ed25519 private key (Anchor A6). The key never travels with the token — it stays in-process. Without the matching PoP signature, the resource server rejects the request with HTTP 401.',
          outcome: '✓ Stolen token is cryptographic noise. Zero lateral movement.',
          anchor: 'A6: Proof-of-possession (Ed25519 ephemeral keys)',
        },
      },
      'substituted-producer': {
        title: 'The producer is impersonated',
        icon: '🎬',
        realWorldParallel: 'Agent identity spoofing (T1)',
        withoutAuth51: {
          narrative:
            'An attacker replicates a legitimate agent\'s code structure, prompts, and tool configurations — like the 2019 Capital One breach where attackers assumed IAM roles via SSRF. The fake agent registers and obtains valid tokens because OAuth can\'t distinguish between the real and fake agent.',
          outcome: '✗ Unauthorized delegation chain created. Entire sub-tree of agents compromised.',
        },
        withAuth51: {
          narrative:
            'Auth51 requires pre-registration (Anchor A2). The impersonator\'s runtime checksum — computed from their actual prompt, tools, and config — won\'t match the registered agent\'s checksum (Anchor A1). Even if they somehow replicate the code perfectly, the shim library\'s own integrity check (X-Shim-Checksum, Anchor A5) detects tampering. The IDP rejects the token request with HTTP 400.',
          outcome: '✓ Identity spoofing blocked. Alert raised. No downstream compromise.',
          anchor: 'A1: Checksum verification + A2: Registration-first + A5: Shim integrity',
        },
      },
    },
  },

  5: {
    title: 'The Translation',
    eyebrow: '05 — TRANSLATION',
    narrative: `Now let's drop the analogy and map everything to the real system.`,
    mappings: [
      {
        analogy: 'The studio\'s office',
        technical: 'Auth51 Authority (IDP)',
        deployment: 'HA Deployment (3-5 replicas) + backing store',
        description: 'Validates checksums, mints intent tokens, enforces 12 security anchors, stores agent registry',
      },
      {
        analogy: 'The crew badges + fingerprints',
        technical: 'Client Shim Library',
        deployment: 'In-process library (pip/npm/go module)',
        description: 'Computes agent checksums, derives Ed25519 PoP keys, tracks workflow state, self-verifies via X-Shim-Checksum',
      },
      {
        analogy: 'The vendor\'s verification desk',
        technical: 'Resource Server Middleware',
        deployment: 'Sidecar / DaemonSet / API Gateway',
        description: 'Validates intent tokens + PoP signatures + workflow policy at resource boundaries',
      },
      {
        analogy: 'The producer\'s command center',
        technical: 'Auth51 Console',
        deployment: 'Deployment, web UI',
        description: 'Operator interface — registration management, audit trail exploration, policy configuration',
      },
      {
        analogy: 'The production handbook',
        technical: 'Auth51 CLI (a51)',
        deployment: 'Local binary',
        description: 'Register agents and workflows, query audit trails, manage policies via CI/CD',
      },
      {
        analogy: 'The signed letter format',
        technical: 'Intent Token (Agentic JWT)',
        deployment: 'Wire format (IETF draft-goswami-agentic-jwt-00)',
        description: 'JWT with intent + agent_proof claims, grant_type=agent_checksum, backward-compatible with OAuth 2.0',
      },
    ],
  },

  6: {
    title: 'Try It Live',
    eyebrow: '06 — LIVE DEMO',
    narrative: `See Auth51 in action. This demo connects to a live Auth51 Authority and walks through a real agent registration, intent-token minting, and verification flow.`,
    comingSoon: true,
    placeholder:
      'Live demo coming soon. In the meantime, explore the protocol specification or the architecture documentation.',
  },
} as const
