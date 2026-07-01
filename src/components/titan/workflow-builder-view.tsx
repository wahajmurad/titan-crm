'use client'

import { useState, useCallback, useRef, useMemo, DragEvent } from 'react'
import { ReactFlow, Controls, Background, MiniMap, addEdge, useNodesState, useEdgesState, type Node, type Edge, type Connection, type NodeTypes, type NodeProps, BackgroundVariant, Handle, Position, Panel } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Save, Plus, Zap, Bot, ArrowRight, Clock, GitBranch,
  Mail, Globe, FileText, BarChart3, ChevronRight, Loader2,
  Settings, Trash2, Copy, Workflow, CheckCircle2, X, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Custom Node Components ──────────────────────────────────

const NODE_COLORS = {
  trigger: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
  ai: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: 'text-blue-600', dot: 'bg-blue-500' },
  action: { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', icon: 'text-violet-600', dot: 'bg-violet-500' },
  condition: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: 'text-amber-600', dot: 'bg-amber-500' },
  delay: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', icon: 'text-gray-500', dot: 'bg-gray-400' },
}

function CustomNode({ data, selected }: NodeProps) {
  const colors = NODE_COLORS[(data.nodeType as string) as keyof typeof NODE_COLORS] || NODE_COLORS.action
  const IconComp = (data.icon as React.ComponentType<{ className?: string }>) || Zap
  const label = String(data.label || '')
  const description = data.description ? String(data.description) : null
  const config = data.config ? String(data.config) : null

  return (
    <div className={cn(
      'rounded-xl border-2 px-4 py-3 min-w-[180px] max-w-[220px] shadow-sm transition-all duration-200',
      colors.bg, colors.border,
      selected && 'ring-2 ring-blue-400/50 shadow-md'
    )}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white !bg-gray-400" />
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', colors.bg)}>
          <IconComp className={cn('w-3.5 h-3.5', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-semibold truncate', colors.text)}>{label}</p>
          {description && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{description}</p>
          )}
        </div>
        {data.nodeType === 'ai' ? (
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-medium text-blue-500">AI</span>
          </div>
        ) : null}
      </div>
      {config ? (
        <div className="mt-2 pt-2 border-t border-gray-200/50">
          <p className="text-[10px] text-gray-400 font-mono truncate">{config}</p>
        </div>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white !bg-gray-400" />
    </div>
  )
}

function ConditionNode({ data, selected }: NodeProps) {
  const colors = NODE_COLORS.condition

  return (
    <div className={cn(
      'rounded-xl border-2 px-4 py-3 min-w-[160px] shadow-sm',
      colors.bg, colors.border,
      selected && 'ring-2 ring-amber-400/50 shadow-md'
    )}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white !bg-gray-400" />
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className={cn('w-4 h-4', colors.icon)} />
        <p className={cn('text-xs font-semibold', colors.text)}>{String(data.label || '')}</p>
      </div>
      {data.description ? <p className="text-[10px] text-gray-400 mb-2">{String(data.description)}</p> : null}
      <div className="flex gap-2 mt-1">
        <Handle type="source" position={Position.Right} id="yes" className="!w-2.5 !h-2.5 !border-2 !border-white !bg-emerald-500 !-right-2.5" />
        <div className="flex-1 text-center">
          <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Yes</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-[9px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">No</span>
        </div>
        <Handle type="source" position={Position.Right} id="no" className="!w-2.5 !h-2.5 !border-2 !border-white !bg-red-500 !-right-2.5" style={{ top: '85%' }} />
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white !bg-gray-400" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  condition: ConditionNode,
}

// ─── Node Templates ───────────────────────────────────────────

interface NodeTemplate {
  type: string
  nodeType: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  config?: string
}

const NODE_TEMPLATES: NodeTemplate[] = [
  { type: 'custom', nodeType: 'trigger', label: 'Manual Trigger', description: 'Start manually', icon: Play },
  { type: 'custom', nodeType: 'trigger', label: 'Schedule Trigger', description: 'Cron schedule', icon: Clock, config: '0 9 * * MON' },
  { type: 'custom', nodeType: 'trigger', label: 'Webhook Trigger', description: 'HTTP endpoint', icon: Globe },
  { type: 'custom', nodeType: 'ai', label: 'Lead Discovery', description: 'Find businesses', icon: Search, config: 'agent: lead_discovery' },
  { type: 'custom', nodeType: 'ai', label: 'Website Audit', description: 'Analyze website', icon: Globe, config: 'agent: website_intel' },
  { type: 'custom', nodeType: 'ai', label: 'Research Agent', description: 'Deep research', icon: Bot, config: 'agent: research' },
  { type: 'custom', nodeType: 'ai', label: 'Qualify Lead', description: 'Score & qualify', icon: CheckCircle2, config: 'agent: business_intel' },
  { type: 'custom', nodeType: 'ai', label: 'Generate Email', description: 'Personalized email', icon: Mail, config: 'agent: personalization' },
  { type: 'custom', nodeType: 'ai', label: 'Industry Expert', description: 'Industry analysis', icon: BarChart3, config: 'agent: industry_expert' },
  { type: 'custom', nodeType: 'action', label: 'Send Email', description: 'Send via SMTP', icon: Mail },
  { type: 'custom', nodeType: 'action', label: 'Create Lead', description: 'Add to CRM', icon: Plus },
  { type: 'custom', nodeType: 'action', label: 'Update Stage', description: 'Change lead stage', icon: ArrowRight },
  { type: 'custom', nodeType: 'action', label: 'Generate Report', description: 'PDF/HTML report', icon: FileText },
  { type: 'condition', nodeType: 'condition', label: 'If Score > 60', description: 'Quality gate', icon: GitBranch },
  { type: 'condition', nodeType: 'condition', label: 'Has Email Reply', description: 'Check replies', icon: Mail },
  { type: 'custom', nodeType: 'delay', label: 'Wait 24 Hours', description: 'Delay next step', icon: Clock, config: '24h' },
  { type: 'custom', nodeType: 'delay', label: 'Wait 3 Days', description: 'Follow-up delay', icon: Clock, config: '3d' },
]

// ─── Main Component ───────────────────────────────────────────

const INITIAL_NODES: Node[] = [
  {
    id: 'node-1',
    type: 'custom',
    position: { x: 250, y: 0 },
    data: { label: 'Manual Trigger', description: 'Start manually', nodeType: 'trigger', icon: Play },
  },
  {
    id: 'node-2',
    type: 'custom',
    position: { x: 250, y: 120 },
    data: { label: 'Lead Discovery', description: 'Find businesses', nodeType: 'ai', icon: Search, config: 'agent: lead_discovery' },
  },
  {
    id: 'node-3',
    type: 'custom',
    position: { x: 250, y: 240 },
    data: { label: 'Website Audit', description: 'Analyze website', nodeType: 'ai', icon: Globe, config: 'agent: website_intel' },
  },
]

const INITIAL_EDGES: Edge[] = [
  { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#94A3B8', strokeWidth: 2 } },
  { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#94A3B8', strokeWidth: 2 } },
]

export function WorkflowBuilderView() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES)
  const [workflowName, setWorkflowName] = useState('New Workflow')
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'settings'>('nodes')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodeCount, setNodeCount] = useState(4)

  const onConnect = useCallback((params: Connection) => {
    const newEdge = { ...params, animated: true, style: { stroke: '#94A3B8', strokeWidth: 2 } } as any
    // @ts-expect-error React Flow v12 addEdge typing mismatch
    addEdge(newEdge, setEdges)
  }, [setEdges])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault()
    const templateData = event.dataTransfer.getData('application/reactflow')
    if (!templateData) return

    const template = JSON.parse(templateData) as NodeTemplate
    const position = { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 }

    const newNode: Node = {
      id: `node-${nodeCount}`,
      type: template.type,
      position,
      data: {
        label: template.label,
        description: template.description,
        nodeType: template.nodeType,
        icon: template.icon,
        config: template.config,
      },
    }

    setNodes(nds => [...nds, newNode])
    setNodeCount(c => c + 1)
  }, [nodeCount, setNodes])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise(r => setTimeout(r, 1000)) // Simulate save
      // In production: await fetch('/api/workflows', { method: 'POST', body: JSON.stringify({ name: workflowName, nodes, edges }) })
    } finally {
      setIsSaving(false)
    }
  }

  const onDragStart = (event: DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Left Sidebar — Node Palette */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex-shrink-0 border-r border-gray-200/60 bg-white/80 backdrop-blur-sm flex flex-col"
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200/60">
          <button
            onClick={() => setSidebarTab('nodes')}
            className={cn('flex-1 py-2.5 text-xs font-medium transition-colors', sidebarTab === 'nodes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600')}
          >
            Nodes
          </button>
          <button
            onClick={() => setSidebarTab('settings')}
            className={cn('flex-1 py-2.5 text-xs font-medium transition-colors', sidebarTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600')}
          >
            Settings
          </button>
        </div>

        {sidebarTab === 'nodes' ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {/* Trigger nodes */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1 mb-2 px-1">Triggers</p>
            {NODE_TEMPLATES.filter(n => n.nodeType === 'trigger').map((template, i) => (
              <div
                key={`trigger-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <template.icon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{template.label}</p>
                  <p className="text-[10px] text-gray-400">{template.description}</p>
                </div>
              </div>
            ))}

            {/* AI Agent nodes */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-1">AI Agents</p>
            {NODE_TEMPLATES.filter(n => n.nodeType === 'ai').map((template, i) => (
              <div
                key={`ai-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-50/50 cursor-grab active:cursor-grabbing transition-colors group border border-transparent hover:border-blue-200"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <template.icon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{template.label}</p>
                  <p className="text-[10px] text-gray-400">{template.description}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}

            {/* Action nodes */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-1">Actions</p>
            {NODE_TEMPLATES.filter(n => n.nodeType === 'action').map((template, i) => (
              <div
                key={`action-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-violet-50/50 cursor-grab active:cursor-grabbing transition-colors group border border-transparent hover:border-violet-200"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <template.icon className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{template.label}</p>
                  <p className="text-[10px] text-gray-400">{template.description}</p>
                </div>
              </div>
            ))}

            {/* Condition nodes */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-1">Logic</p>
            {NODE_TEMPLATES.filter(n => n.nodeType === 'condition').map((template, i) => (
              <div
                key={`cond-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-amber-50/50 cursor-grab active:cursor-grabbing transition-colors group border border-transparent hover:border-amber-200"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <template.icon className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{template.label}</p>
                  <p className="text-[10px] text-gray-400">{template.description}</p>
                </div>
              </div>
            ))}

            {/* Delay nodes */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-1">Delay</p>
            {NODE_TEMPLATES.filter(n => n.nodeType === 'delay').map((template, i) => (
              <div
                key={`delay-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <template.icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{template.label}</p>
                  <p className="text-[10px] text-gray-400">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Workflow Name</label>
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Status</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                <option>Draft</option>
                <option>Active</option>
                <option>Paused</option>
              </select>
            </div>
            <div className="pt-4 border-t border-gray-200/60 space-y-2">
              <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium gradient-blue text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaving ? 'Saving...' : 'Save Workflow'}
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                <Play className="w-3.5 h-3.5" />
                Test Run
              </button>
            </div>
          </div>
        )}

        {/* Node count */}
        <div className="p-3 border-t border-gray-200/60">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} connections</span>
          </div>
        </div>
      </motion.div>

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 bg-[#F8FAFC]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={{ animated: true, style: { stroke: '#94A3B8', strokeWidth: 2 } }}
          proOptions={{ hideAttribution: true }}
          className="!bg-[#F8FAFC]"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E2E8F0" />
          <Controls className="!rounded-xl !border-gray-200 !shadow-lg !overflow-hidden" />
          <MiniMap
            nodeColor={(node) => {
              const nt = node.data?.nodeType
              if (nt === 'trigger') return '#10B981'
              if (nt === 'ai') return '#2563EB'
              if (nt === 'condition') return '#F59E0B'
              if (nt === 'delay') return '#94A3B8'
              return '#8B5CF6'
            }}
            className="!rounded-xl !border-gray-200 !shadow-lg"
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}