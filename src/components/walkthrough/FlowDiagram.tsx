'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * Flow diagram node types — each renders differently.
 */
export type NodeType =
  | 'actor'      // Studio, Agent, Vendor, etc.
  | 'action'     // "Issues letter", "Signs request"
  | 'artifact'   // JWT token, keypair, letter
  | 'check'      // Verification point
  | 'threat'     // Threat scenario (red)
  | 'success'    // Auth51 prevention (green)
  | 'failure'    // Attack succeeds (red)

export interface FlowNode {
  id: string
  label: string
  sublabel?: string
  type: NodeType
  x: number
  y: number
  /** Delay in ms before this node appears */
  delay?: number
  /** Whether this node is currently highlighted/active */
  active?: boolean
  /** Icon or emoji to show */
  icon?: string
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
  /** 'normal' | 'dashed' | 'danger' | 'success' */
  variant?: 'normal' | 'dashed' | 'danger' | 'success'
  delay?: number
  animated?: boolean
}

export interface FlowAnnotation {
  id: string
  text: string
  x: number
  y: number
  delay?: number
  variant?: 'info' | 'danger' | 'success' | 'brand'
}

type Props = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  annotations?: FlowAnnotation[]
  /** How many ms of the timeline to reveal. Nodes/edges with delay <= this value show. */
  revealUpTo?: number
  width?: number
  height?: number
  className?: string
  onNodeClick?: (nodeId: string) => void
  activeNodeId?: string | null
}

const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  actor:   { bg: '#fafaf9', border: '#1e3a5f', text: '#1c1917' },
  action:  { bg: '#f5f5f4', border: '#d6d3d1', text: '#44403c' },
  artifact:{ bg: '#eff6ff', border: '#2563eb', text: '#1e3a5f' },
  check:   { bg: '#f0fdf4', border: '#047857', text: '#047857' },
  threat:  { bg: '#fef2f2', border: '#b91c1c', text: '#b91c1c' },
  success: { bg: '#ecfdf5', border: '#047857', text: '#047857' },
  failure: { bg: '#fef2f2', border: '#b91c1c', text: '#991b1b' },
}

const EDGE_COLORS: Record<string, string> = {
  normal:  '#a8a29e',
  dashed:  '#d6d3d1',
  danger:  '#b91c1c',
  success: '#047857',
}

/**
 * Interactive flow diagram rendered in SVG.
 *
 * Nodes appear progressively based on `revealUpTo` — creating the effect
 * of the diagram "growing" as the user advances through the story.
 * Edges animate in with CSS transitions. Nodes are clickable for detail.
 */
export function FlowDiagram({
  nodes,
  edges,
  annotations = [],
  revealUpTo = Infinity,
  width = 900,
  height = 500,
  className,
  onNodeClick,
  activeNodeId,
}: Props) {
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set())
  const [visibleEdges, setVisibleEdges] = useState<Set<string>>(new Set())
  const [visibleAnnotations, setVisibleAnnotations] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newNodes = new Set<string>()
    const newEdges = new Set<string>()
    const newAnnotations = new Set<string>()

    nodes.forEach((n) => {
      if ((n.delay ?? 0) <= revealUpTo) newNodes.add(n.id)
    })
    edges.forEach((e) => {
      if ((e.delay ?? 0) <= revealUpTo) newEdges.add(`${e.from}-${e.to}`)
    })
    annotations.forEach((a) => {
      if ((a.delay ?? 0) <= revealUpTo) newAnnotations.add(a.id)
    })

    setVisibleNodes(newNodes)
    setVisibleEdges(newEdges)
    setVisibleAnnotations(newAnnotations)
  }, [nodes, edges, annotations, revealUpTo])

  const getNodeById = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes],
  )

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ minWidth: '600px', maxHeight: '70vh' }}
      >
        {/* Defs for arrow markers */}
        <defs>
          {Object.entries(EDGE_COLORS).map(([variant, color]) => (
            <marker
              key={variant}
              id={`arrow-${variant}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              fill={color}
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const edgeKey = `${edge.from}-${edge.to}`
          const isVisible = visibleEdges.has(edgeKey)
          const fromNode = getNodeById(edge.from)
          const toNode = getNodeById(edge.to)
          if (!fromNode || !toNode) return null

          const variant = edge.variant ?? 'normal'
          const color = EDGE_COLORS[variant]

          // Calculate edge path (simple straight line with slight curve)
          const x1 = fromNode.x + 70
          const y1 = fromNode.y + 22
          const x2 = toNode.x - 5
          const y2 = toNode.y + 22
          const midX = (x1 + x2) / 2
          const ctrlY = y1 === y2 ? y1 : (y1 + y2) / 2 - 20

          return (
            <g
              key={edgeKey}
              className="transition-opacity duration-500"
              style={{ opacity: isVisible ? 1 : 0 }}
            >
              <path
                d={y1 === y2
                  ? `M ${x1} ${y1} L ${x2} ${y2}`
                  : `M ${x1} ${y1} Q ${midX} ${ctrlY} ${x2} ${y2}`
                }
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={variant === 'dashed' ? '6 4' : undefined}
                markerEnd={`url(#arrow-${variant})`}
                className={edge.animated ? 'animate-dash' : ''}
              />
              {edge.label && (
                <text
                  x={midX}
                  y={ctrlY - 8}
                  textAnchor="middle"
                  className="fill-current text-[10px]"
                  fill="#78716c"
                >
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isVisible = visibleNodes.has(node.id)
          const colors = NODE_COLORS[node.type]
          const isActive = activeNodeId === node.id
          const isClickable = !!onNodeClick

          return (
            <g
              key={node.id}
              className="transition-all duration-500 cursor-pointer"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                transformOrigin: `${node.x + 70}px ${node.y + 22}px`,
              }}
              onClick={() => onNodeClick?.(node.id)}
            >
              <rect
                x={node.x}
                y={node.y}
                width="140"
                height="44"
                rx="8"
                fill={colors.bg}
                stroke={isActive ? '#2563eb' : colors.border}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isClickable ? 'hover:stroke-[#2563eb] transition-colors' : ''}
              />
              {node.icon && (
                <text
                  x={node.x + 14}
                  y={node.y + 28}
                  className="text-[14px]"
                >
                  {node.icon}
                </text>
              )}
              <text
                x={node.x + (node.icon ? 32 : 70)}
                y={node.y + (node.sublabel ? 20 : 26)}
                textAnchor={node.icon ? 'start' : 'middle'}
                fill={colors.text}
                className="text-[12px] font-semibold"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {node.label}
              </text>
              {node.sublabel && (
                <text
                  x={node.x + (node.icon ? 32 : 70)}
                  y={node.y + 34}
                  textAnchor={node.icon ? 'start' : 'middle'}
                  fill="#78716c"
                  className="text-[10px]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {node.sublabel}
                </text>
              )}
            </g>
          )
        })}

        {/* Annotations */}
        {annotations.map((ann) => {
          const isVisible = visibleAnnotations.has(ann.id)
          const colors = {
            info: { bg: '#f5f5f4', border: '#d6d3d1', text: '#44403c' },
            danger: { bg: '#fef2f2', border: '#b91c1c', text: '#991b1b' },
            success: { bg: '#ecfdf5', border: '#047857', text: '#047857' },
            brand: { bg: '#eff6ff', border: '#1e3a5f', text: '#1e3a5f' },
          }[ann.variant ?? 'info']

          // Wrap text manually for SVG
          const words = ann.text.split(' ')
          const lines: string[] = []
          let currentLine = ''
          words.forEach((word) => {
            if ((currentLine + ' ' + word).length > 30) {
              lines.push(currentLine.trim())
              currentLine = word
            } else {
              currentLine += ' ' + word
            }
          })
          if (currentLine.trim()) lines.push(currentLine.trim())

          const boxHeight = lines.length * 16 + 16

          return (
            <g
              key={ann.id}
              className="transition-opacity duration-700"
              style={{ opacity: isVisible ? 1 : 0 }}
            >
              <rect
                x={ann.x}
                y={ann.y}
                width="220"
                height={boxHeight}
                rx="6"
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={ann.x + 12}
                  y={ann.y + 18 + i * 16}
                  fill={colors.text}
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
