'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldLabel } from '@/components/ui/field'
import { createRelationColumn } from '@/app/(authenticated)/workspace/[id]/explorer/relation-actions'

const TARGET_TABLE_OPTIONS = [
  { value: 'transactions', label: 'Transactions' },
  { value: 'documents', label: 'Documents' },
  { value: 'bills', label: 'Bills' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'categories', label: 'Categories' },
  { value: 'events', label: 'Events' },
  { value: 'rules', label: 'Rules' },
] as const

interface AddRelationColumnButtonProps {
  workspaceId: string
  sourceTable: string
}

export function AddRelationColumnButton({
  workspaceId,
  sourceTable,
}: AddRelationColumnButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [targetTable, setTargetTable] = useState('')
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setName('')
    setTargetTable('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !targetTable) return

    startTransition(async () => {
      await createRelationColumn(workspaceId, name.trim(), sourceTable, targetTable)
      resetForm()
      setOpen(false)
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="flex items-center justify-center h-full w-10 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          title="Add relation column"
        >
          <Plus className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="relation-col-name">Column name</FieldLabel>
            <Input
              id="relation-col-name"
              placeholder="e.g. Related Docs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="relation-target-table">Target table</FieldLabel>
            <Select value={targetTable} onValueChange={setTargetTable}>
              <SelectTrigger id="relation-target-table" className="w-full">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TABLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!name.trim() || !targetTable || isPending}
          >
            {isPending ? 'Creating...' : 'Create column'}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
