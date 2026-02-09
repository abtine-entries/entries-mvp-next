'use client'

import { useState, useTransition } from 'react'
import { Plus, Database, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
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

const SOURCE_TABLE_LABELS: Record<string, string> = {
  transactions: 'Transactions',
  documents: 'Documents',
  bills: 'Bills',
  vendors: 'Vendors',
  categories: 'Categories',
  events: 'Events',
  rules: 'Rules',
}

type Step = 'select-table' | 'configure'

interface AddRelationColumnButtonProps {
  workspaceId: string
  sourceTable: string
}

export function AddRelationColumnButton({
  workspaceId,
  sourceTable,
}: AddRelationColumnButtonProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('select-table')
  const [name, setName] = useState('')
  const [targetTable, setTargetTable] = useState('')
  const [isBidirectional, setIsBidirectional] = useState(false)
  const [inverseName, setInverseName] = useState('')
  const [isPending, startTransition] = useTransition()

  const targetLabel =
    TARGET_TABLE_OPTIONS.find((o) => o.value === targetTable)?.label ?? ''
  const sourceLabel = SOURCE_TABLE_LABELS[sourceTable] ?? sourceTable

  function resetForm() {
    setStep('select-table')
    setName('')
    setTargetTable('')
    setIsBidirectional(false)
    setInverseName('')
  }

  function handleSelectTable(value: string) {
    const label =
      TARGET_TABLE_OPTIONS.find((o) => o.value === value)?.label ?? value
    setTargetTable(value)
    setName(label)
    setStep('configure')
  }

  function handleBack() {
    setStep('select-table')
    setTargetTable('')
    setName('')
    setIsBidirectional(false)
    setInverseName('')
  }

  function handleBidirectionalChange(checked: boolean) {
    setIsBidirectional(checked)
    if (checked && !inverseName) {
      setInverseName(sourceLabel)
    }
  }

  function handleSubmit() {
    if (!name.trim() || !targetTable) return
    if (isBidirectional && !inverseName.trim()) return

    startTransition(async () => {
      await createRelationColumn(
        workspaceId,
        name.trim(),
        sourceTable,
        targetTable,
        isBidirectional ? { name: inverseName.trim() } : undefined
      )
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
      <PopoverContent className="w-72 p-0" align="end">
        {step === 'select-table' ? (
          <SelectTableStep onSelect={handleSelectTable} />
        ) : (
          <ConfigureStep
            name={name}
            onNameChange={setName}
            targetLabel={targetLabel}
            sourceLabel={sourceLabel}
            isBidirectional={isBidirectional}
            onBidirectionalChange={handleBidirectionalChange}
            inverseName={inverseName}
            onInverseNameChange={setInverseName}
            isPending={isPending}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1 – Select a table to link                                    */
/* ------------------------------------------------------------------ */

function SelectTableStep({
  onSelect,
}: {
  onSelect: (value: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-sm font-medium">Related to</span>
      </div>
      <Command>
        <CommandInput placeholder="Link to a data source..." autoFocus />
        <CommandList>
          <CommandEmpty>No tables found.</CommandEmpty>
          <CommandGroup heading="Existing data sources">
            {TARGET_TABLE_OPTIONS.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.value}
                onSelect={() => onSelect(opt.value)}
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                {opt.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2 – Configure the relation                                    */
/* ------------------------------------------------------------------ */

interface ConfigureStepProps {
  name: string
  onNameChange: (v: string) => void
  targetLabel: string
  sourceLabel: string
  isBidirectional: boolean
  onBidirectionalChange: (checked: boolean) => void
  inverseName: string
  onInverseNameChange: (v: string) => void
  isPending: boolean
  onBack: () => void
  onSubmit: () => void
}

function ConfigureStep({
  name,
  onNameChange,
  targetLabel,
  sourceLabel,
  isBidirectional,
  onBidirectionalChange,
  inverseName,
  onInverseNameChange,
  isPending,
  onBack,
  onSubmit,
}: ConfigureStepProps) {
  return (
    <div className="p-3 space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">New relation</span>
      </div>

      {/* Relation name */}
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        autoFocus
      />

      {/* Related to display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <Database className="h-4 w-4" />
          Related to
        </span>
        <span className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          {targetLabel}
        </span>
      </div>

      {/* Two-way relation toggle */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Two-way relation</span>
        <Switch
          checked={isBidirectional}
          onCheckedChange={onBidirectionalChange}
        />
      </div>

      {/* Reverse column name (shown when two-way is on) */}
      {isBidirectional && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">
            Related property name
          </span>
          <Input
            value={inverseName}
            onChange={(e) => onInverseNameChange(e.target.value)}
            placeholder={sourceLabel}
          />
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full"
        size="sm"
        disabled={
          !name.trim() ||
          (isBidirectional && !inverseName.trim()) ||
          isPending
        }
        onClick={onSubmit}
      >
        {isPending ? 'Adding...' : 'Add relation'}
      </Button>
    </div>
  )
}
