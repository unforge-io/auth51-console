'use client'

import { useReducer, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { walkthroughReducer, initialState, type Act, type ThreatBranch } from '@/lib/walkthrough/state'
import { ACT_CONTENT } from '@/lib/walkthrough/content'
import { getReactFlowData } from '@/lib/walkthrough/reactFlowData'
import { nodeTypes } from './flow/FlowNodes'
import { ProgressIndicator } from './ProgressIndicator'

/**
 * Interactive walkthrough powered by React Flow.
 *
 * The flow diagram IS the navigation:
 * - "Next →" nodes advance to the next act
 * - Threat nodes in Act 4 open branches
 * - "Back" nodes return from branches
 *
 * No separate navigation buttons needed — the diagram is the interface.
 */
export function WalkthroughClient() {
  const [state, dispatch] = useReducer(walkthroughReducer, initialState)

  // Get React Flow data for current state
  const { nodes, edges } = useMemo(
    () => getReactFlowData(state.act, state.threatBranch),
    [state.act, state.threatBranch],
  )

  // Handle node clicks — this is the primary navigation mechanism
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const { id } = node
      const data = node.data as { clickable?: boolean }

      // "Next" / "Continue" nodes advance the act
      if (id === 'next' && data.clickable) {
        dispatch({ type: 'NEXT' })
        return
      }

      // "Back" node returns from threat branch
      if (id === 'back' && data.clickable) {
        dispatch({ type: 'CLOSE_BRANCH' })
        return
      }

      // Threat nodes in Act 4 hub open branches
      if (state.act === 4 && !state.threatBranch && id.startsWith('threat-')) {
        const branchMap: Record<string, ThreatBranch> = {
          'threat-fraudulent-vendor': 'fraudulent-vendor',
          'threat-rogue-assistant': 'rogue-assistant',
          'threat-stolen-letter': 'stolen-letter',
          'threat-substituted-producer': 'substituted-producer',
        }
        const branch = branchMap[id]
        if (branch) {
          dispatch({ type: 'OPEN_BRANCH', branch })
        }
      }
    },
    [state.act, state.threatBranch],
  )

  const handleJump = useCallback((act: Act) => {
    dispatch({ type: 'JUMP_TO_ACT', act })
  }, [])

  // Get the current act's narrative content
  const actContent = ACT_CONTENT[state.act as keyof typeof ACT_CONTENT]

  return (
    <div className="mx-auto w-full">
      <ProgressIndicator currentAct={state.act} onJump={handleJump} />

      {/* Flow diagram — full width, main interactive area */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[#635bff] uppercase">
              Act {state.act} of 6
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-[14px] font-semibold text-[#0a2540]">
              {actContent.title}
            </span>
          </div>
          {state.threatBranch && (
            <button
              onClick={() => dispatch({ type: 'CLOSE_BRANCH' })}
              className="text-[13px] text-[#8898aa] hover:text-[#0a2540] transition-colors flex items-center gap-1"
            >
              ← Back to threats
            </button>
          )}
        </div>

        {/* React Flow canvas */}
        <div className="h-[520px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            minZoom={0.5}
            maxZoom={1.5}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#e7e5e4"
            />
            <Controls
              showInteractive={false}
              position="bottom-right"
              className="!border-stone-200 !shadow-sm [&>button]:!border-stone-200 [&>button]:!bg-white [&>button:hover]:!bg-stone-50"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Narrative text below the diagram */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="text-[15px] text-[#425466] leading-[1.7] space-y-3">
            {actContent.narrative.split('\n\n').map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Act 2: comparison panels */}
          {state.act === 2 && 'comparison' in actContent && (
            <div className="grid gap-4 sm:grid-cols-2 mt-6">
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
                <h4 className="text-[13px] font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px]">✗</span>
                  {(actContent as typeof ACT_CONTENT[2]).comparison.oauth.label}
                </h4>
                <ul className="space-y-2">
                  {(actContent as typeof ACT_CONTENT[2]).comparison.oauth.points.map((pt, i) => (
                    <li key={i} className="text-[13px] text-red-700 leading-relaxed pl-5 relative before:content-['–'] before:absolute before:left-0 before:text-red-400">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                <h4 className="text-[13px] font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
                  {(actContent as typeof ACT_CONTENT[2]).comparison.auth51.label}
                </h4>
                <ul className="space-y-2">
                  {(actContent as typeof ACT_CONTENT[2]).comparison.auth51.points.map((pt, i) => (
                    <li key={i} className="text-[13px] text-emerald-700 leading-relaxed pl-5 relative before:content-['–'] before:absolute before:left-0 before:text-emerald-400">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Act 5: mapping table */}
          {state.act === 5 && 'mappings' in actContent && (
            <div className="overflow-x-auto mt-6 rounded-xl border border-stone-200">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-stone-50 text-left">
                    <th className="px-4 py-3 font-semibold text-[#0a2540]">Film Analogy</th>
                    <th className="px-4 py-3 font-semibold text-[#0a2540]">Auth51 Component</th>
                    <th className="px-4 py-3 font-semibold text-[#0a2540] hidden sm:table-cell">Deployment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(actContent as typeof ACT_CONTENT[5]).mappings.map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3 text-[#425466]">{row.analogy}</td>
                      <td className="px-4 py-3 font-mono font-medium text-[#635bff]">{row.technical}</td>
                      <td className="px-4 py-3 text-[#8898aa] hidden sm:table-cell">{row.deployment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar hints */}
        <div className="space-y-4">
          {'aside' in actContent && (actContent as { aside: string }).aside && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-[13px] text-[#425466] leading-relaxed">
              <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#8898aa] uppercase tracking-wider">
                <span>ⓘ</span> Context
              </div>
              {(actContent as { aside: string }).aside}
            </div>
          )}

          {state.act === 4 && !state.threatBranch && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-[13px] text-amber-800 leading-relaxed">
              <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                <span>⚠️</span> Interactive
              </div>
              Click any red threat node in the diagram to explore how the attack unfolds — and how Auth51 prevents it.
            </div>
          )}

          {state.act === 6 && (
            <div className="rounded-xl border border-[#635bff]/20 bg-[#f0f4ff] p-4 text-[13px] text-[#0a2540] leading-relaxed">
              <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#635bff] uppercase tracking-wider">
                <span>🚀</span> Coming soon
              </div>
              Live demo connecting to a real Auth51 Authority — watch agent registration, token minting, and verification in real time.
            </div>
          )}

          {/* Keyboard hint */}
          <div className="text-[11px] text-[#c1c9d2] text-center">
            Click nodes to navigate · Drag to pan · Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  )
}
