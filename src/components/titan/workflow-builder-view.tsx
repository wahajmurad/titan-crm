'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeProps,
  BackgroundVariant,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import {
  Play,
  Save,
  Plus,
  Zap,
  Bot,
  ArrowRight,
  Clock,
  GitBranch,
  Mail,
  Globe,
  FileText,
  BarChart3,
  Loader2,
  CheckCircle2,
  X,
  Search,
  Workflow,
  ArrowLeft,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

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

// ─── Initial State ────────────────────────────────────────────

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

// ─── Section helper for node palette ──────────────────────────

const PALETTE_SECTIONS = [
  { key: 'trigger', label: 'Triggers' },
  { key: 'ai', label: 'AI Agents' },
  { key: 'action', label: 'Actions' },
  { key: 'condition', label: 'Logic' },
  { key: 'delay', label: 'Delay' },
] as const

function getHoverColors(nodeType: string) {
  switch (nodeType) {
    case 'trigger': return 'hover:bg-gray-50 hover:border-emerald-200'
    case 'ai': return 'hover:bg-blue-50/50 hover:border-blue-200'
    case 'action': return 'hover:bg-violet-50/50 hover:border-violet-200'
    case 'condition': return 'hover:bg-amber-50/50 hover:border-amber-200'
    case 'delay': return 'hover:bg-gray-50 hover:border-gray-200'
    default: return 'hover:bg-gray-50 hover:border-gray-200'
  }
}

function getIconColors(nodeType: string) {
  switch (nodeType) {
    case 'trigger': return 'bg-emerald-50 text-emerald-600'
    case 'ai': return 'bg-blue-50 text-blue-600'
    case 'action': return 'bg-violet-50 text-violet-600'
    case 'condition': return 'bg-amber-50 text-amber-600'
    case 'delay': return 'bg-gray-50 text-gray-500'
    default: return 'bg-gray-50 text-gray-500'
  }
}

// ─── Main Component ───────────────────────────────────────────

export function WorkflowBuilderView() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES)
  const [workflowName, setWorkflowName] = useState('New Workflow')
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'settings'>('nodes')
  const [paletteOpen, setPaletteOpen] = useState(false)
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

  const handleBack = () => {
    useAppStore.getState().setView('dashboard')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* ─── Top Toolbar ─── */}
      <div className="h-12 flex-shrink-0 border-b border-gray-200/60 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-md px-2 py-1.5 hover:bg-gray-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-semibold border-none focus:ring-0 focus:outline-none bg-transparent text-gray-900 w-48 sm:w-64 placeholder:text-gray-300"
              placeholder="Untitled Workflow"
            />
            <Badge variant="secondary" className="text-[10px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-100 border-0">
              Draft
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900">
            <Play className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Test Run</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="flex flex-1 min-h-0">
        {/* Mobile palette toggle */}
        <button
          onClick={() => setPaletteOpen(!paletteOpen)}
          className="md:hidden fixed bottom-20 left-3 z-30 w-10 h-10 rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-500/25 flex items-center justify-center hover:bg-[#1D4ED8] transition-colors"
          aria-label="Toggle node palette"
        >
          {paletteOpen ? <X className="w-4 h-4" /> : <Workflow className="w-4 h-4" />}
        </button>

        {/* Mobile palette overlay */}
        {paletteOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-black/20 backdrop-blur-[2px]" onClick={() => setPaletteOpen(false)} />
        )}

        {/* ─── Left Sidebar — Node Palette ─── */}
        <motion.div
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            "flex-shrink-0 w-64 bg-white border-r border-gray-200/60 flex flex-col z-20",
            "fixed md:relative inset-y-0 left-0 h-full md:h-auto",
            "transform transition-transform duration-200 ease-in-out",
            "top-12 md:top-0",
            paletteOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200/60 flex-shrink-0">
            <button
              onClick={() => setSidebarTab('nodes')}
              className={cn(
                'flex-1 py-3 text-xs font-medium transition-colors relative',
                sidebarTab === 'nodes' ? 'text-[#2563EB]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Nodes
              {sidebarTab === 'nodes' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#2563EB] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setSidebarTab('settings')}
              className={cn(
                'flex-1 py-3 text-xs font-medium transition-colors relative',
                sidebarTab === 'settings' ? 'text-[#2563EB]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Settings
              {sidebarTab === 'settings' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#2563EB] rounded-full" />
              )}
            </button>
          </div>

          {/* Nodes Tab */}
          {sidebarTab === 'nodes' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {PALETTE_SECTIONS.map((section) => {
                const sectionTemplates = NODE_TEMPLATES.filter(n => n.nodeType === section.key)
                return (
                  <div key={section.key} className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-2 mb-2 px-1">
                      {section.label}
                    </p>
                    <div className="space-y-0.5">
                      {sectionTemplates.map((template, i) => {
                        const iconColorClass = getIconColors(template.nodeType)
                        const [iconBg, iconText] = iconColorClass.split(' ')
                        return (
                          <div
                            key={`${section.key}-${i}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, template)}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing',
                              'transition-colors group border border-transparent',
                              getHoverColors(template.nodeType)
                            )}
                          >
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                              <template.icon className={cn('w-3.5 h-3.5', iconText)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">{template.label}</p>
                              <p className="text-[10px] text-gray-400 leading-tight">{template.description}</p>
                            </div>
                            {template.nodeType === 'ai' && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Settings Tab */
            <div className="flex-1 p-4 space-y-5 overflow-y-auto">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Workflow Name
                </label>
                <input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300"
                  placeholder="My Workflow"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Status
                </label>
                <select className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer">
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Paused</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-none placeholder:text-gray-300"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Tags
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300"
                  placeholder="outreach, leads, cold-email"
                />
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-2.5">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Saving...' : 'Save Workflow'}
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  <Play className="w-3.5 h-3.5" />
                  Test Run
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  Delete Workflow
                </button>
              </div>
            </div>
          )}

          {/* Node count footer */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{nodes.length} nodes</span>
              <span className="text-gray-300">|</span>
              <span>{edges.length} connections</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Canvas ─── */}
        <div ref={reactFlowWrapper} className="flex-1 bg-[#F8FAFC] relative">
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
            <Controls
              className="!rounded-xl !border-gray-200/80 !shadow-sm !overflow-hidden !bg-white"
              showInteractive={false}
            />
            <MiniMap
              nodeColor={(node) => {
                const nt = node.data?.nodeType
                if (nt === 'trigger') return '#10B981'
                if (nt === 'ai') return '#2563EB'
                if (nt === 'condition') return '#F59E0B'
                if (nt === 'delay') return '#94A3B8'
                return '#8B5CF6'
              }}
              className="!rounded-xl !border-gray-200/80 !shadow-sm hidden md:block !bg-white"
              maskColor="rgba(0,0,0,0.04)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}