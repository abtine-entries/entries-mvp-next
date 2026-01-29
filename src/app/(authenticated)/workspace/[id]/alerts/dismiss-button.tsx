'use client'

import { useTransition } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { dismissAlert } from './actions'

interface DismissButtonProps {
  alertId: string
  workspaceId: string
}

export function DismissButton({ alertId, workspaceId }: DismissButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissAlert(alertId, workspaceId)
      if (result.success) {
        toast.success('Alert dismissed')
      } else {
        toast.error(result.error ?? 'Failed to dismiss alert')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={handleDismiss}
      disabled={isPending}
      title="Dismiss alert"
    >
      <X className="h-4 w-4" />
    </Button>
  )
}
