'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
 DialogDescription,
} from '@/components/ui/dialog'
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
 Tooltip,
 TooltipContent,
 TooltipTrigger,
 TooltipProvider,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import {
 Plus,
 Search,
 Pencil,
 Trash2,
 Globe,
 FileSearch,
 UserCheck,
 Mail,
 Target,
 FileText,
 BarChart3,
 Star,
 BookOpen,
 type LucideIcon,
} from 'lucide-react'
import { PROMPT_CATEGORIES, type PromptCategory } from '@/lib/types'

interface Prompt {
 id: string
 name: string
 category: PromptCategory
 prompt: string
 isDefault: boolean
 createdAt: string
 updatedAt: string
}

const CATEGORY_META: Record<
 string,
 { label: string; icon: LucideIcon; gradient: string; borderColor: string; iconColor: string }
> = {
 website_audit: {
  label: 'Website Audit',
  icon: Globe,
  gradient: 'from-cyan-500/20 to-sky-500/20',
  borderColor: 'border-cyan-500/30',
  iconColor: 'text-cyan-400',
 },
 industry_research: {
  label: 'Industry Research',
  icon: FileSearch,
  gradient: 'from-amber-500/20 to-orange-500/20',
  borderColor: 'border-amber-500/30',
  iconColor: 'text-amber-400',
 },
 lead_qualification: {
  label: 'Lead Qualification',
  icon: UserCheck,
  gradient: 'from-emerald-500/20 to-teal-500/20',
  borderColor: 'border-emerald-500/30',
  iconColor: 'text-emerald-400',
 },
 email_generation: {
  label: 'Email Generation',
  icon: Mail,
  gradient: 'from-rose-500/20 to-pink-500/20',
  borderColor: 'border-rose-500/30',
  iconColor: 'text-rose-400',
 },
 sales_strategy: {
  label: 'Sales Strategy',
  icon: Target,
  gradient: 'from-blue-500/20 to-purple-500/20',
  borderColor: 'border-blue-500/30',
  iconColor: 'text-blue-400',
 },
 proposal_writing: {
  label: 'Proposal Writing',
  icon: FileText,
  gradient: 'from-fuchsia-500/20 to-pink-500/20',
  borderColor: 'border-fuchsia-500/30',
  iconColor: 'text-fuchsia-400',
 },
 campaign_analysis: {
  label: 'Campaign Analysis',
  icon: BarChart3,
  gradient: 'from-lime-500/20 to-green-500/20',
  borderColor: 'border-lime-500/30',
  iconColor: 'text-lime-400',
 },
}

const EMPTY_FORM = { name: '', category: 'website_audit' as PromptCategory, prompt: '', isDefault: false }

function PromptCard({
 prompt,
 onEdit,
 onDelete,
}: {
 prompt: Prompt
 onEdit: (p: Prompt) => void
 onDelete: (p: Prompt) => void
}) {
 const meta = CATEGORY_META[prompt.category] || CATEGORY_META.website_audit
 const Icon = meta.icon

 return (
  <Card
 className={`border-gray-200 bg-gray-50 hover:bg-white transition-all duration-200 group ${
    prompt.isDefault ? 'ring-1 ring-blue-500/30' : ''
   }`}
  >
   <CardContent className="p-4">
    <div className="flex items-start justify-between gap-3">
     <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
       <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0`}>
        <Icon className={`w-3 h-3 ${meta.iconColor}`} />
       </div>
       <h3 className="text-sm font-medium text-gray-900 truncate">{prompt.name}</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
       {prompt.prompt.length > 100 ? prompt.prompt.slice(0, 100) + '...' : prompt.prompt}
      </p>
     </div>

     <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip>
       <TooltipTrigger asChild>
        <button
         onClick={() => onEdit(prompt)}
 className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
        >
         <Pencil className="w-3.5 h-3.5" />
        </button>
       </TooltipTrigger>
       <TooltipContent className="bg-gray-100 text-gray-900 border-gray-200">Edit prompt</TooltipContent>
      </Tooltip>
      <Tooltip>
       <TooltipTrigger asChild>
        <button
         onClick={() => onDelete(prompt)}
 className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
        >
         <Trash2 className="w-3.5 h-3.5" />
        </button>
       </TooltipTrigger>
       <TooltipContent className="bg-gray-100 text-gray-900 border-gray-200">Delete prompt</TooltipContent>
      </Tooltip>
     </div>
    </div>

    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
     <div className="flex items-center gap-1.5">
      {prompt.isDefault && (
       <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/25 text-[10px] px-1.5 py-0">
        <Star className="w-2.5 h-2.5 mr-0.5" />
        Default
       </Badge>
      )}
     </div>
     <span className="text-[10px] text-gray-300">
      {new Date(prompt.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
     </span>
    </div>
   </CardContent>
  </Card>
 )
}

function PromptFormDialog({
 open,
 onOpenChange,
 initialData,
 onSave,
}: {
 open: boolean
 onOpenChange: (v: boolean) => void
 initialData: Prompt | null
 onSave: (data: { name: string; category: string; prompt: string; isDefault: boolean }) => Promise<void>
}) {
 const isEditing = !!initialData
 const [form, setForm] = useState(() =>
  initialData
   ? {
     name: initialData.name,
     category: initialData.category,
     prompt: initialData.prompt,
     isDefault: initialData.isDefault,
    }
   : { ...EMPTY_FORM }
 )
 const [saving, setSaving] = useState(false)

 const handleSave = async () => {
  if (!form.name.trim() || !form.prompt.trim()) return
  setSaving(true)
  try {
   await onSave(form)
   onOpenChange(false)
  } catch {
   setSaving(false)
  }
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="bg-white border-gray-200 w-[95vw] sm:w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
     <DialogTitle className="text-gray-900">{isEditing ? 'Edit Prompt' : 'New Prompt'}</DialogTitle>
     <DialogDescription className="text-gray-500">
      {isEditing ? 'Update this prompt template.' : 'Create a new prompt template for your AI workflows.'}
     </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 mt-1">
     <div>
      <Label className="text-gray-600 text-sm">Name</Label>
      <Input
       value={form.name}
       onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
       placeholder="e.g., Cold Outreach - Pain Point Discovery"
 className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
      />
     </div>
     <div>
      <Label className="text-gray-600 text-sm">Category</Label>
      <Select
       value={form.category}
       onValueChange={(v) => setForm((f) => ({ ...f, category: v as PromptCategory }))}
      >
       <SelectTrigger className="mt-1.5 bg-gray-50 border-gray-200 text-gray-900">
        <SelectValue placeholder="Select category" />
       </SelectTrigger>
       <SelectContent className="bg-white border-gray-200">
        {PROMPT_CATEGORIES.map((cat) => {
         const meta = CATEGORY_META[cat]
         return (
          <SelectItem key={cat} value={cat} className="text-gray-200 focus:bg-gray-100 focus:text-gray-900">
           <div className="flex items-center gap-2">
            <meta.icon className={`w-3.5 h-3.5 ${meta.iconColor}`} />
            {meta.label}
           </div>
          </SelectItem>
         )
        })}
       </SelectContent>
      </Select>
     </div>
     <div>
      <Label className="text-gray-600 text-sm">Prompt</Label>
      <Textarea
       value={form.prompt}
       onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
       placeholder="Write your AI prompt template here. Use {company}, {industry}, {website} as placeholders..."
 className="mt-1.5 min-h-[200px] bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm leading-relaxed focus-visible:ring-blue-500/30"
      />
     </div>
     <div className="flex items-center justify-between">
      <Label htmlFor="is-default" className="text-gray-600 text-sm cursor-pointer">
       Set as default prompt for this category
      </Label>
      <Switch
       id="is-default"
       checked={form.isDefault}
       onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
      />
     </div>
    </div>
    <DialogFooter className="mt-4">
     <Button
      variant="outline"
      onClick={() => onOpenChange(false)}
 className="bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
     >
      Cancel
     </Button>
     <Button
      onClick={handleSave}
      disabled={saving || !form.name.trim() || !form.prompt.trim()}
 className="bg-blue-600 hover:from-blue-500 hover:to-fuchsia-500 text-gray-900"
     >
      {saving ? (
       <span className="flex items-center gap-2">
        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        {isEditing ? 'Updating...' : 'Creating...'}
       </span>
      ) : isEditing ? (
       'Update Prompt'
      ) : (
       'Create Prompt'
      )}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 )
}

function DeleteConfirmDialog({
 open,
 onOpenChange,
 prompt,
 onConfirm,
}: {
 open: boolean
 onOpenChange: (v: boolean) => void
 prompt: Prompt | null
 onConfirm: () => Promise<void>
}) {
 const [deleting, setDeleting] = useState(false)

 const handleDelete = async () => {
  setDeleting(true)
  try {
   await onConfirm()
   onOpenChange(false)
  } catch {
   setDeleting(false)
  }
 }

 return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
   <AlertDialogContent className="bg-white border-gray-200">
    <AlertDialogHeader>
     <AlertDialogTitle className="text-gray-900">Delete Prompt</AlertDialogTitle>
     <AlertDialogDescription className="text-gray-500">
      Are you sure you want to delete <span className="text-gray-900 font-medium">{prompt?.name}</span>? This action
      cannot be undone.
     </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
     <AlertDialogCancel className="bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900">
      Cancel
     </AlertDialogCancel>
     <AlertDialogAction
      onClick={handleDelete}
      disabled={deleting}
 className="bg-red-600 hover:bg-red-500 text-gray-900 focus:ring-red-500"
     >
      {deleting ? (
       <span className="flex items-center gap-2">
        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Deleting...
       </span>
      ) : (
       'Delete'
      )}
     </AlertDialogAction>
    </AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 )
}

export function PromptsView() {
 const [prompts, setPrompts] = useState<Prompt[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [activeCategory, setActiveCategory] = useState<PromptCategory | 'all'>('all')

 const [formDialogOpen, setFormDialogOpen] = useState(false)
 const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
 const [formDialogKey, setFormDialogKey] = useState(0)

 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
 const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null)
 const [deleteDialogKey, setDeleteDialogKey] = useState(0)

 const [refreshKey, setRefreshKey] = useState(0)

 const fetchPrompts = useCallback(async () => {
  setLoading(true)
  try {
   const params = new URLSearchParams()
   if (search) params.set('search', search)
   if (activeCategory !== 'all') params.set('category', activeCategory)

   const res = await fetch(`/api/prompts?${params}`, { credentials: 'same-origin' })
   if (res.ok) {
    const data = await res.json()
    setPrompts(data.prompts || [])
   }
  } catch {
   // silently fail
  } finally {
   setLoading(false)
  }
 }, [search, activeCategory, refreshKey])

 useEffect(() => {
  fetchPrompts()
 }, [fetchPrompts])

 const handleCreate = () => {
  setEditingPrompt(null)
  setFormDialogKey((k) => k + 1)
  setFormDialogOpen(true)
 }

 const handleEdit = (prompt: Prompt) => {
  setEditingPrompt(prompt)
  setFormDialogKey((k) => k + 1)
  setFormDialogOpen(true)
 }

 const handleDeleteClick = (prompt: Prompt) => {
  setDeletingPrompt(prompt)
  setDeleteDialogKey((k) => k + 1)
  setDeleteDialogOpen(true)
 }

 const handleSave = async (data: {
  name: string
  category: string
  prompt: string
  isDefault: boolean
 }) => {
  if (editingPrompt) {
   const res = await fetch(`/api/prompts/${editingPrompt.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(data),
   })
   if (!res.ok) throw new Error('Failed to update')
  } else {
   const res = await fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(data),
   })
   if (!res.ok) throw new Error('Failed to create')
  }
  setRefreshKey((k) => k + 1)
 }

 const handleDelete = async () => {
  if (!deletingPrompt) return
  const res = await fetch(`/api/prompts/${deletingPrompt.id}`, {
   method: 'DELETE',
   credentials: 'same-origin',
  })
  if (!res.ok) throw new Error('Failed to delete')
  setRefreshKey((k) => k + 1)
 }

 const filteredPrompts = activeCategory === 'all'
  ? prompts
  : prompts.filter((p) => p.category === activeCategory)

 // Default prompts first, then by updatedAt
 const sortedPrompts = [...filteredPrompts].sort((a, b) => {
  if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
 })

 const categoryCounts = prompts.reduce<Record<string, number>>((acc, p) => {
  acc[p.category] = (acc[p.category] || 0) + 1
  return acc
 }, {})

 return (
  <TooltipProvider delayDuration={200}>
   <div className="space-y-4 dark:text-gray-100">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
     <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Prompt Library</h1>
      <p className="text-sm text-gray-500 mt-0.5">
       Manage AI prompt templates for your workflows
      </p>
     </div>
     <div className="flex items-center gap-2">
      <div className="relative">
       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
       <Input
        placeholder="Search prompts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
 className="pl-8 w-48 h-8 text-sm bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500/30"
       />
      </div>
      <Button
       onClick={handleCreate}
 className="h-8 bg-blue-600 hover:from-blue-500 hover:to-fuchsia-500 text-gray-900"
      >
       <Plus className="w-3.5 h-3.5 mr-1.5" />
       New Prompt
      </Button>
     </div>
    </div>

    {/* Main content: sidebar + cards */}
    <div className="flex gap-4 min-h-[calc(100vh-10rem)]">
     {/* Category sidebar */}
     <div className="w-56 shrink-0 hidden md:block">
      <Card className="border-gray-200 bg-gray-50 sticky top-0">
       <CardContent className="p-2">
        <div className="px-3 py-2 mb-1">
         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
        </div>
        <ScrollArea className="max-h-[calc(100vh-14rem)]">
         <button
          onClick={() => setActiveCategory('all')}
 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
           activeCategory === 'all'
            ? 'bg-blue-500/15 text-blue-300'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
         >
          <div className="flex items-center gap-2">
           <BookOpen className="w-3.5 h-3.5" />
           <span>All Prompts</span>
          </div>
          <span className="text-xs tabular-nums">{prompts.length}</span>
         </button>
         <Separator className="my-1 bg-gray-100" />
         {PROMPT_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat]
          const Icon = meta.icon
          const count = categoryCounts[cat] || 0
          return (
           <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
             activeCategory === cat
              ? `bg-blue-600 ${meta.gradient} text-gray-900`
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
           >
            <div className="flex items-center gap-2">
             <Icon className={`w-3.5 h-3.5 ${activeCategory === cat ? meta.iconColor : ''}`} />
             <span>{meta.label}</span>
            </div>
            <span className="text-xs tabular-nums">{count}</span>
           </button>
          )
         })}
        </ScrollArea>
       </CardContent>
      </Card>
     </div>

     {/* Mobile category selector */}
     <div className="md:hidden w-full">
      <div className="flex gap-2 overflow-x-auto pb-2">
       <button
        onClick={() => setActiveCategory('all')}
 className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
         activeCategory === 'all'
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'
        }`}
       >
        All ({prompts.length})
       </button>
       {PROMPT_CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat]
        const count = categoryCounts[cat] || 0
        return (
         <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
 className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
           activeCategory === cat
            ? `bg-blue-600 ${meta.gradient} text-gray-900 border-transparent`
            : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'
          }`}
         >
          {meta.label} ({count})
         </button>
        )
       })}
      </div>
     </div>

     {/* Prompt cards grid */}
     <div className="flex-1 min-w-0">
      {loading ? (
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
         <Card key={i} className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 space-y-3">
           <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md bg-gray-100" />
            <Skeleton className="h-4 w-40 bg-gray-100" />
           </div>
           <Skeleton className="h-3 w-full bg-gray-100" />
           <Skeleton className="h-3 w-3/4 bg-gray-100" />
          </CardContent>
         </Card>
        ))}
       </div>
      ) : sortedPrompts.length === 0 ? (
       <Card className="border-gray-200 bg-gray-50/80">
        <CardContent className="flex flex-col items-center justify-center py-16">
         <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-gray-400" />
         </div>
         <h3 className="text-sm font-medium text-gray-600 mb-1">
          {search ? 'No matching prompts' : 'No prompts yet'}
         </h3>
         <p className="text-xs text-gray-400 mb-4">
          {search
           ? 'Try a different search term or category'
           : 'Create your first prompt template to get started'}
         </p>
         {!search && (
          <Button
           onClick={handleCreate}
           variant="outline"
 className="bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
           <Plus className="w-3.5 h-3.5 mr-1.5" />
           Create Prompt
          </Button>
         )}
        </CardContent>
       </Card>
      ) : (
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {sortedPrompts.map((prompt) => (
         <PromptCard
          key={prompt.id}
          prompt={prompt}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
         />
        ))}
       </div>
      )}
     </div>
    </div>

    {/* Form Dialog */}
    <PromptFormDialog
     key={formDialogKey}
     open={formDialogOpen}
     onOpenChange={setFormDialogOpen}
     initialData={editingPrompt}
     onSave={handleSave}
    />

    {/* Delete Confirmation Dialog */}
    <DeleteConfirmDialog
     key={deleteDialogKey}
     open={deleteDialogOpen}
     onOpenChange={setDeleteDialogOpen}
     prompt={deletingPrompt}
     onConfirm={handleDelete}
    />
   </div>
  </TooltipProvider>
 )
}