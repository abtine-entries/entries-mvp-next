'use client'

import { useState, useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { assignAlert } from './actions'

interface User {
  id: string
  name: string | null
  email: string
}

interface AssignPopoverProps {
  alertId: string
  workspaceId: string
  users: User[]
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function AssignPopover({ alertId, workspaceId, users }: AssignPopoverProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleAssign(user: User) {
    startTransition(async () => {
      const result = await assignAlert(alertId, workspaceId, user.id)
      if (result.success) {
        toast.success(`Alert assigned to ${user.name ?? user.email}`)
        setOpen(false)
      } else {
        toast.error(result.error ?? 'Failed to assign alert')
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          title="Assign alert"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        <div className="flex flex-col">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              className="justify-start h-auto py-2 px-3"
              disabled={isPending}
              onClick={() => handleAssign(user)}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {getInitials(user.name, user.email)}
                </span>
                <div className="flex flex-col items-start">
                  {user.name && (
                    <span className="text-sm">{user.name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
