'use client'

import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

/**
 * Custom edge that renders the label as a small floating pill
 * positioned at the midpoint of the edge — with a solid background
 * so the arrow line never bleeds through the text.
 *
 * Uses React Flow's EdgeLabelRenderer to render arbitrary HTML
 * positioned at the bezier midpoint, instead of the built-in
 * `<text>` SVG label which gets covered by the path stroke.
 */
export const FloatingLabelEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
  } = props

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div className="bg-white border border-stone-200 rounded-full px-2.5 py-0.5 text-[10px] font-medium text-[#425466] shadow-sm whitespace-nowrap">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

FloatingLabelEdge.displayName = 'FloatingLabelEdge'

export const edgeTypes = {
  default: FloatingLabelEdge,
}
