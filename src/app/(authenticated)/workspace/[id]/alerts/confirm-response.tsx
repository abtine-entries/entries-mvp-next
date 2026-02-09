'use client'

import { useTransition } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { resolveAlert } from './actions'

interface ConfirmResponseProps {
  alertId: string
  workspaceId: string
}

export function ConfirmResponse({ alertId, workspaceId }: ConfirmResponseProps) {
  const [isPending, startTransition] = useTransition()

  function handleResponse(value: 'approved' | 'rejected') {
    startTransition(async () => {
      const result = await resolveAlert(alertId, workspaceId, value)
      if (result.success) {
        toast.success(value === 'approved' ? 'Alert approved' : 'Alert rejected')
      } else {
        toast.error(result.error ?? 'Failed to respond to alert')
      }
    })
  }

  return (
    <div className="flex gap-2 mt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse('approved')}
        disabled={isPending}
        className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
      >
        <CheckCircle2 className="h-4 w-4 mr-1.5" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse('rejected')}
        disabled={isPending}
        className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
      >
        <XCircle className="h-4 w-4 mr-1.5" />
        Reject
      </Button>
    </div>
  )
}
