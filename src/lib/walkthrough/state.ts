/**
 * Walkthrough state machine.
 *
 * The walkthrough is a 6-act interactive narrative that uses a film-production
 * analogy to explain agent authorization. Act 4 branches into 4 threat scenarios
 * (road-sign choice points). The state machine is a simple reducer — no external
 * libraries, no context providers.
 */

export type Act = 1 | 2 | 3 | 4 | 5 | 6

export type ThreatBranch =
  | 'fraudulent-vendor'
  | 'rogue-assistant'
  | 'stolen-letter'
  | 'substituted-producer'

export type ComparisonMode = 'oauth' | 'auth51' | null

export interface WalkthroughState {
  act: Act
  scene: number
  threatBranch: ThreatBranch | null
  branchesVisited: ThreatBranch[]
  comparisonMode: ComparisonMode
}

export type WalkthroughAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'JUMP_TO_ACT'; act: Act }
  | { type: 'OPEN_BRANCH'; branch: ThreatBranch }
  | { type: 'CLOSE_BRANCH' }
  | { type: 'SET_COMPARISON_MODE'; mode: ComparisonMode }
  | { type: 'RESET' }

export const initialState: WalkthroughState = {
  act: 1,
  scene: 0,
  threatBranch: null,
  branchesVisited: [],
  comparisonMode: null,
}

/** Total scenes per act (for progress calculation). */
export const SCENES_PER_ACT: Record<Act, number> = {
  1: 1,
  2: 1,
  3: 1,
  4: 1, // Act 4 is branch-based, not scene-based
  5: 1,
  6: 1,
}

export const ACT_TITLES: Record<Act, string> = {
  1: 'The Setup',
  2: 'The Letter of Authorization',
  3: 'Delegation',
  4: 'What Can Go Wrong',
  5: 'The Translation',
  6: 'Try It Live',
}

export function walkthroughReducer(
  state: WalkthroughState,
  action: WalkthroughAction,
): WalkthroughState {
  switch (action.type) {
    case 'NEXT': {
      // If in a branch, close it first
      if (state.threatBranch) {
        return {
          ...state,
          threatBranch: null,
          branchesVisited: state.branchesVisited.includes(state.threatBranch)
            ? state.branchesVisited
            : [...state.branchesVisited, state.threatBranch],
        }
      }
      // Advance to next act
      const nextAct = Math.min(state.act + 1, 6) as Act
      return {
        ...state,
        act: nextAct,
        scene: 0,
        comparisonMode: null,
      }
    }

    case 'BACK': {
      if (state.threatBranch) {
        return { ...state, threatBranch: null }
      }
      const prevAct = Math.max(state.act - 1, 1) as Act
      return {
        ...state,
        act: prevAct,
        scene: 0,
        comparisonMode: null,
      }
    }

    case 'JUMP_TO_ACT':
      return {
        ...state,
        act: action.act,
        scene: 0,
        threatBranch: null,
        comparisonMode: null,
      }

    case 'OPEN_BRANCH':
      return {
        ...state,
        threatBranch: action.branch,
        comparisonMode: null,
      }

    case 'CLOSE_BRANCH':
      return {
        ...state,
        threatBranch: null,
        branchesVisited: state.threatBranch && !state.branchesVisited.includes(state.threatBranch)
          ? [...state.branchesVisited, state.threatBranch]
          : state.branchesVisited,
      }

    case 'SET_COMPARISON_MODE':
      return { ...state, comparisonMode: action.mode }

    case 'RESET':
      return initialState

    default:
      return state
  }
}
