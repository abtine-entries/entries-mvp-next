'use client'

import { useState, useTransition } from 'react'
import { FileText, Check, X, Plus } from 'lucide-react'
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
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  linkTransactionDocument,
  unlinkTransactionDocument,
  type WorkspaceDocument,
} from './actions'

interface StatementCellProps {
  transactionId: string
  documentId: string | null
  documentFileName: string | null
  documents: WorkspaceDocument[]
  workspaceId: string
  onDocumentClick?: (documentId: string) => void
}

export function StatementCell({
  transactionId,
  documentId,
  documentFileName,
  documents,
  workspaceId,
  onDocumentClick,
}: StatementCellProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticDocId, setOptimisticDocId] = useState<string | null | undefined>(undefined)
  const [optimisticDocName, setOptimisticDocName] = useState<string | null | undefined>(undefined)

  const currentDocId = optimisticDocId !== undefined ? optimisticDocId : documentId
  const currentDocName = optimisticDocName !== undefined ? optimisticDocName : documentFileName

  function handleSelect(doc: WorkspaceDocument) {
    setOptimisticDocId(doc.id)
    setOptimisticDocName(doc.fileName)
    setOpen(false)
    startTransition(async () => {
      await linkTransactionDocument(transactionId, doc.id, workspaceId)
      setOptimisticDocId(undefined)
      setOptimisticDocName(undefined)
    })
  }

  function handleClear() {
    setOptimisticDocId(null)
    setOptimisticDocName(null)
    setOpen(false)
    startTransition(async () => {
      await unlinkTransactionDocument(transactionId, workspaceId)
      setOptimisticDocId(undefined)
      setOptimisticDocName(undefined)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
          className={cn(
            'flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm transition-colors max-w-[180px]',
            'hover:bg-muted/80',
            isPending && 'opacity-60',
            currentDocName
              ? 'text-primary underline-offset-2 hover:underline'
              : 'text-muted-foreground'
          )}
        >
          {currentDocName ? (
            <>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              {onDocumentClick && currentDocId ? (
                <span
                  className="truncate hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDocumentClick(currentDocId)
                  }}
                >
                  {currentDocName}
                </span>
              ) : (
                <span className="truncate">{currentDocName}</span>
              )}
            </>
          ) : (
            <span className="group-hover/row:visible invisible flex items-center gap-1 text-muted-foreground/60">
              <Plus className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder="Search documents..." />
          <CommandList>
            <CommandEmpty>No documents found.</CommandEmpty>
            <CommandGroup heading="Documents">
              {documents.map((doc) => (
                <CommandItem
                  key={doc.id}
                  value={doc.fileName}
                  onSelect={() => handleSelect(doc)}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{doc.fileName}</span>
                  <Badge variant="outline" className="text-[10px] ml-1 shrink-0">
                    {doc.fileType.toUpperCase()}
                  </Badge>
                  {currentDocId === doc.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {currentDocId && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 shrink-0" />
                    <span>Remove link</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
