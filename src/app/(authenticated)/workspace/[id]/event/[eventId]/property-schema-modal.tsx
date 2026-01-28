'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import {
  createPropertyDefinition,
  updatePropertyDefinition,
  deletePropertyDefinition,
  reorderPropertyDefinitions,
} from './actions'

interface PropertyDefinition {
  id: string
  name: string
  type: string
  options: string | null
  position: number
}

interface PropertySchemaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  definitions: PropertyDefinition[]
}

const PROPERTY_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
]

export function PropertySchemaModal({
  open,
  onOpenChange,
  workspaceId,
  definitions: initialDefinitions,
}: PropertySchemaModalProps) {
  const [definitions, setDefinitions] = useState(initialDefinitions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('text')
  const [editOptions, setEditOptions] = useState('')
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('text')
  const [newOptions, setNewOptions] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync with parent when modal opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDefinitions(initialDefinitions)
    }
    setEditingId(null)
    setDeleteConfirmId(null)
    setNewName('')
    setNewType('text')
    setNewOptions('')
    onOpenChange(nextOpen)
  }

  const sortedDefinitions = [...definitions].sort((a, b) => a.position - b.position)

  const handleAdd = () => {
    if (!newName.trim()) return
    const optionsValue = newType === 'select' && newOptions.trim()
      ? JSON.stringify(newOptions.split(',').map((o) => o.trim()).filter(Boolean))
      : null

    startTransition(async () => {
      const result = await createPropertyDefinition(workspaceId, newName, newType, optionsValue)
      if (result.success && result.definition) {
        setDefinitions((prev) => [...prev, result.definition!])
        setNewName('')
        setNewType('text')
        setNewOptions('')
      }
    })
  }

  const handleStartEdit = (def: PropertyDefinition) => {
    setEditingId(def.id)
    setEditName(def.name)
    setEditType(def.type)
    setEditOptions(
      def.options
        ? (() => {
            try {
              return (JSON.parse(def.options) as string[]).join(', ')
            } catch {
              return ''
            }
          })()
        : ''
    )
  }

  const handleSaveEdit = (defId: string) => {
    if (!editName.trim()) return
    const optionsValue = editType === 'select' && editOptions.trim()
      ? JSON.stringify(editOptions.split(',').map((o) => o.trim()).filter(Boolean))
      : null

    startTransition(async () => {
      const result = await updatePropertyDefinition(workspaceId, defId, editName, editType, optionsValue)
      if (result.success && result.definition) {
        setDefinitions((prev) =>
          prev.map((d) => (d.id === defId ? result.definition! : d))
        )
        setEditingId(null)
      }
    })
  }

  const handleDelete = (defId: string) => {
    startTransition(async () => {
      const result = await deletePropertyDefinition(workspaceId, defId)
      if (result.success) {
        setDefinitions((prev) => prev.filter((d) => d.id !== defId))
        setDeleteConfirmId(null)
      }
    })
  }

  const handleMove = (defId: string, direction: 'up' | 'down') => {
    const sorted = [...definitions].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex((d) => d.id === defId)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newOrder = sorted.map((d) => d.id)
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]

    // Optimistically update positions
    const updatedDefs = definitions.map((d) => ({
      ...d,
      position: newOrder.indexOf(d.id),
    }))
    setDefinitions(updatedDefs)

    startTransition(async () => {
      await reorderPropertyDefinitions(workspaceId, newOrder)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Property Definitions</DialogTitle>
          <DialogDescription>
            Define custom properties for all events in this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {sortedDefinitions.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              No properties defined yet. Add one below.
            </p>
          )}

          {sortedDefinitions.map((def, idx) => (
            <div key={def.id}>
              {deleteConfirmId === def.id ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                  <p className="text-sm font-medium">Delete &quot;{def.name}&quot;?</p>
                  <p className="text-xs text-muted-foreground">
                    All property values for this definition will be permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(def.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : editingId === def.id ? (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Property name"
                      className="h-8 text-sm flex-1"
                      disabled={isPending}
                    />
                    <Select
                      value={editType}
                      onValueChange={setEditType}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[110px]" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {editType === 'select' && (
                    <Input
                      value={editOptions}
                      onChange={(e) => setEditOptions(e.target.value)}
                      placeholder="Options (comma-separated)"
                      className="h-8 text-sm"
                      disabled={isPending}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isPending || !editName.trim()}
                      onClick={() => handleSaveEdit(def.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border p-2">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={isPending || idx === 0}
                      onClick={() => handleMove(def.id, 'up')}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={isPending || idx === sortedDefinitions.length - 1}
                      onClick={() => handleMove(def.id, 'down')}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <button
                    className="flex-1 text-left cursor-pointer hover:underline"
                    onClick={() => handleStartEdit(def)}
                  >
                    <span className="text-sm font-medium">{def.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {def.type}
                      {def.type === 'select' && def.options && (
                        <> &middot; {(() => {
                          try {
                            return (JSON.parse(def.options) as string[]).length
                          } catch {
                            return 0
                          }
                        })()} options</>
                      )}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                    onClick={() => setDeleteConfirmId(def.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new property */}
        <div className="border-t pt-3 space-y-2">
          <Label className="text-sm font-medium">Add property</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Property name"
              className="h-8 text-sm flex-1"
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
            />
            <Select
              value={newType}
              onValueChange={setNewType}
              disabled={isPending}
            >
              <SelectTrigger className="w-[110px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={isPending || !newName.trim()}
              onClick={handleAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {newType === 'select' && (
            <Input
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              placeholder="Options (comma-separated, e.g. High, Medium, Low)"
              className="h-8 text-sm"
              disabled={isPending}
            />
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
