'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  updateRelationColumn,
  deleteRelationColumn,
} from '@/app/(authenticated)/workspace/[id]/explorer/relation-actions'

interface RelationColumnHeaderProps {
  columnId: string
  columnName: string
  workspaceId: string
}

export function RelationColumnHeader({
  columnId,
  columnName,
  workspaceId,
}: RelationColumnHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [name, setName] = useState(columnName)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  function handleRenameSubmit() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === columnName) {
      setName(columnName)
      setIsRenaming(false)
      return
    }

    startTransition(async () => {
      await updateRelationColumn(columnId, workspaceId, trimmed)
      setIsRenaming(false)
    })
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setName(columnName)
      setIsRenaming(false)
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRelationColumn(columnId, workspaceId)
      setShowDeleteDialog(false)
    })
  }

  if (isRenaming) {
    return (
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleRenameSubmit}
        onKeyDown={handleRenameKeyDown}
        className="h-6 text-xs px-1.5 py-0 min-w-[80px]"
        disabled={isPending}
      />
    )
  }

  return (
    <>
      <div className="group/header flex items-center gap-1">
        <span className="truncate text-xs">{columnName}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the column and all its links. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
