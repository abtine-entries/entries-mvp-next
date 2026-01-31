'use client'

import { useState, useTransition, useEffect } from 'react'
import { Check, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  addRelationLink,
  removeRelationLink,
  getTargetRecordOptions,
  type TargetRecordOption,
} from '@/app/(authenticated)/workspace/[id]/explorer/relation-actions'

interface LinkedRecord {
  id: string
  label: string
}

interface RelationCellProps {
  relationColumnId: string
  sourceRecordId: string
  linkedRecords: LinkedRecord[]
  workspaceId: string
  targetTable: string
  onEntityClick?: (entityId: string) => void
}

const MAX_VISIBLE_CHIPS = 3

export function RelationCell({
  relationColumnId,
  sourceRecordId,
  linkedRecords,
  workspaceId,
  targetTable,
  onEntityClick,
}: RelationCellProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticLinks, setOptimisticLinks] = useState<LinkedRecord[]>(linkedRecords)
  const [options, setOptions] = useState<TargetRecordOption[]>([])
  const [search, setSearch] = useState('')

  // Sync optimistic state when server data changes
  useEffect(() => {
    setOptimisticLinks(linkedRecords)
  }, [linkedRecords])

  // Fetch options when popover opens
  useEffect(() => {
    if (open) {
      getTargetRecordOptions(workspaceId, targetTable).then(setOptions)
    }
  }, [open, workspaceId, targetTable])

  const linkedIds = new Set(optimisticLinks.map((r) => r.id))

  function handleToggle(option: TargetRecordOption) {
    const isLinked = linkedIds.has(option.id)

    if (isLinked) {
      // Optimistically remove
      setOptimisticLinks((prev) => prev.filter((r) => r.id !== option.id))
      startTransition(async () => {
        await removeRelationLink(relationColumnId, sourceRecordId, option.id)
      })
    } else {
      // Optimistically add
      setOptimisticLinks((prev) => [...prev, { id: option.id, label: option.label }])
      startTransition(async () => {
        await addRelationLink(relationColumnId, sourceRecordId, option.id)
      })
    }
  }

  function handleChipClick(e: React.MouseEvent, entityId: string) {
    e.stopPropagation()
    e.preventDefault()
    if (onEntityClick) {
      onEntityClick(entityId)
    }
  }

  const visibleChips = optimisticLinks.slice(0, MAX_VISIBLE_CHIPS)
  const overflowCount = optimisticLinks.length - MAX_VISIBLE_CHIPS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
          className={cn(
            'flex items-center gap-1 rounded px-1.5 py-0.5 text-sm transition-colors min-w-[60px] max-w-[240px] min-h-[28px]',
            'hover:bg-muted/80',
            isPending && 'opacity-60'
          )}
        >
          {optimisticLinks.length > 0 ? (
            <span className="flex items-center gap-1 flex-wrap">
              {visibleChips.map((record) => (
                <Badge
                  key={record.id}
                  variant="secondary"
                  className={cn(
                    'text-[11px] px-1.5 py-0 max-w-[100px]',
                    onEntityClick && 'cursor-pointer hover:bg-secondary/80'
                  )}
                  onClick={
                    onEntityClick
                      ? (e: React.MouseEvent) => handleChipClick(e, record.id)
                      : undefined
                  }
                >
                  <span className="truncate">{record.label}</span>
                </Badge>
              ))}
              {overflowCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  +{overflowCount}
                </span>
              )}
            </span>
          ) : (
            <span className="group-hover/row:visible invisible flex items-center gap-1 text-muted-foreground/60">
              <Plus className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${targetTable}...`}
            value={search}
            onValueChange={(value) => {
              setSearch(value)
              startTransition(async () => {
                const results = await getTargetRecordOptions(
                  workspaceId,
                  targetTable,
                  value || undefined
                )
                setOptions(results)
              })
            }}
          />
          <CommandList>
            <CommandEmpty>No records found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isLinked = linkedIds.has(option.id)
                return (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => handleToggle(option)}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                        isLinked
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {isLinked && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate flex-1">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export type { RelationCellProps, LinkedRecord }
