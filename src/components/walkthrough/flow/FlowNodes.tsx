'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

/**
 * Custom React Flow node types for the Auth51 walkthrough.
 * Each type has a distinct visual style matching the road-sign system.
 */

/* ── Actor node (Studio, Agent, Vendor) ── */
export type ActorNodeData = {
  label: string
  sublabel?: string
  icon?: string
  clickable?: boolean
  pulse?: boolean
}

export const ActorNode = memo(({ data }: NodeProps) => {
  const d = data as ActorNodeData
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border-2 bg-white px-4 py-3 shadow-sm transition-all duration-200',
        'border-[#0a2540]',
        d.clickable && 'cursor-pointer hover:shadow-md hover:border-[#2563eb] hover:scale-[1.02]',
        d.pulse && 'animate-pulse',
      )}
    >
      {d.icon && <span className="text-lg">{d.icon}</span>}
      <div>
        <div className="text-[13px] font-semibold text-[#0a2540] leading-tight">{d.label}</div>
        {d.sublabel && (
          <div className="text-[10px] text-[#8898aa] font-mono mt-0.5">{d.sublabel}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-[#0a2540] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-[#0a2540] !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#0a2540] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#0a2540] !w-2 !h-2 !border-0" />
    </div>
  )
})
ActorNode.displayName = 'ActorNode'

/* ── Artifact node (JWT, Letter, Keypair) ── */
export type ArtifactNodeData = {
  label: string
  sublabel?: string
  icon?: string
  clickable?: boolean
}

export const ArtifactNode = memo(({ data }: NodeProps) => {
  const d = data as ArtifactNodeData
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border-2 bg-[#f0f4ff] px-4 py-3 shadow-sm transition-all duration-200',
        'border-[#635bff]',
        d.clickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
      )}
    >
      {d.icon && <span className="text-lg">{d.icon}</span>}
      <div>
        <div className="text-[13px] font-semibold text-[#0a2540] leading-tight">{d.label}</div>
        {d.sublabel && (
          <div className="text-[10px] text-[#635bff] font-mono mt-0.5">{d.sublabel}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-[#635bff] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-[#635bff] !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#635bff] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#635bff] !w-2 !h-2 !border-0" />
    </div>
  )
})
ArtifactNode.displayName = 'ArtifactNode'

/* ── Threat node (red, danger) ── */
export type ThreatNodeData = {
  label: string
  sublabel?: string
  icon?: string
  clickable?: boolean
}

export const ThreatNode = memo(({ data }: NodeProps) => {
  const d = data as ThreatNodeData
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border-2 bg-red-50 px-4 py-3 shadow-sm transition-all duration-200',
        'border-red-400',
        d.clickable && 'cursor-pointer hover:shadow-md hover:border-red-500 hover:scale-[1.02] hover:bg-red-100',
      )}
    >
      {d.icon && <span className="text-lg">{d.icon}</span>}
      <div>
        <div className="text-[13px] font-semibold text-red-800 leading-tight">{d.label}</div>
        {d.sublabel && (
          <div className="text-[10px] text-red-500 font-mono mt-0.5">{d.sublabel}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-red-500 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-red-500 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-red-500 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-red-500 !w-2 !h-2 !border-0" />
    </div>
  )
})
ThreatNode.displayName = 'ThreatNode'

/* ── Success node (green) ── */
export type SuccessNodeData = {
  label: string
  sublabel?: string
  icon?: string
  clickable?: boolean
}

export const SuccessNode = memo(({ data }: NodeProps) => {
  const d = data as SuccessNodeData
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border-2 bg-emerald-50 px-4 py-3 shadow-sm transition-all duration-200',
        'border-emerald-400',
        d.clickable && 'cursor-pointer hover:shadow-md hover:border-emerald-500 hover:scale-[1.02]',
      )}
    >
      {d.icon && <span className="text-lg">{d.icon}</span>}
      <div>
        <div className="text-[13px] font-semibold text-emerald-800 leading-tight">{d.label}</div>
        {d.sublabel && (
          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">{d.sublabel}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500 !w-2 !h-2 !border-0" />
    </div>
  )
})
SuccessNode.displayName = 'SuccessNode'

/* ── Check/Verification node ── */
export type CheckNodeData = {
  label: string
  sublabel?: string
  icon?: string
  clickable?: boolean
}

export const CheckNode = memo(({ data }: NodeProps) => {
  const d = data as CheckNodeData
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2.5 shadow-sm transition-all duration-200',
        'border-[#635bff]',
        d.clickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
      )}
    >
      {d.icon && <span className="text-base">{d.icon}</span>}
      <div className="text-[12px] font-semibold text-[#0a2540] leading-tight">{d.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-[#635bff] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-[#635bff] !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#635bff] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#635bff] !w-2 !h-2 !border-0" />
    </div>
  )
})
CheckNode.displayName = 'CheckNode'

/* ── Annotation node (info callout) ── */
export type AnnotationNodeData = {
  label: string
  variant?: 'info' | 'danger' | 'success' | 'brand'
}

const annotationStyles = {
  info:    'border-stone-300 bg-stone-50 text-[#425466]',
  danger:  'border-red-300 bg-red-50 text-red-700',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  brand:   'border-[#635bff]/30 bg-[#f0f4ff] text-[#0a2540]',
}

export const AnnotationNode = memo(({ data }: NodeProps) => {
  const d = data as AnnotationNodeData
  const variant = d.variant ?? 'info'
  return (
    <div
      className={cn(
        'max-w-[220px] rounded-md border border-dashed px-3 py-2 text-[11px] leading-relaxed',
        annotationStyles[variant],
      )}
    >
      {d.label}
    </div>
  )
})
AnnotationNode.displayName = 'AnnotationNode'

/* ── Export node types map ── */
export const nodeTypes = {
  actor: ActorNode,
  artifact: ArtifactNode,
  threat: ThreatNode,
  success: SuccessNode,
  check: CheckNode,
  annotation: AnnotationNode,
}
