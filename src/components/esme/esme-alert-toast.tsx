'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Bell,
  X,
  Check,
  ArrowRight,
} from 'lucide-react'
import { EsmeAvatar } from '@/components/esme-avatar'
import { Button } from '@/components/ui/button'
import { dismissAlert } from '@/app/(authenticated)/workspace/[id]/alerts/actions'
import type { SerializedAlert } from '@/app/(authenticated)/workspace/[id]/esme/types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

const priorityColors: Record<string, string> = {
  requires_action: 'border-l-amber-500',
  fyi: 'border-l-blue-400',
}

interface EsmeAlertToastContentProps {
  alert: SerializedAlert
  workspaceId: string
  toastId: string | number
  onDismissed?: (id: string) => void
}

function EsmeAlertToastContent({
  alert,
  workspaceId,
  toastId,
  onDismissed,
}: EsmeAlertToastContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const Icon = typeIcons[alert.type] ?? Bell

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      const result = await dismissAlert(alert.id, workspaceId)
      if (result.success) {
        onDismissed?.(alert.id)
        toast.dismiss(toastId)
      }
    })
  }

  function handleResolve(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      const result = await dismissAlert(alert.id, workspaceId)
      if (result.success) {
        onDismissed?.(alert.id)
        toast.dismiss(toastId)
        toast.success('Resolved', { duration: 2000 })
      }
    })
  }

  function handleNavigate() {
    toast.dismiss(toastId)
    router.push(`/workspace/${workspaceId}/esme`)
  }

  return (
    <div
      className={`flex gap-3 items-start w-full cursor-pointer border-l-2 pl-3 ${priorityColors[alert.priority] ?? 'border-l-muted'}`}
      onClick={handleNavigate}
    >
      {/* Esme avatar */}
      <div className="shrink-0 mt-0.5">
        <EsmeAvatar className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {alert.priority === 'requires_action' ? 'Action needed' : 'FYI'}
          </span>
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {alert.title}
        </p>
        {alert.body && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {alert.body}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2">
          {alert.priority === 'requires_action' && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleResolve}
              disabled={isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={handleNavigate}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Open
          </Button>
        </div>
      </div>

      {/* Dismiss X */}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
        onClick={handleDismiss}
        disabled={isPending}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

/**
 * Fire an Esme-styled alert toast using Sonner.
 */
export function showEsmeAlertToast(
  alert: SerializedAlert,
  workspaceId: string,
  onDismissed?: (id: string) => void
) {
  toast.custom(
    (id) => (
      <EsmeAlertToastContent
        alert={alert}
        workspaceId={workspaceId}
        toastId={id}
        onDismissed={onDismissed}
      />
    ),
    {
      duration: 8000,
      className:
        '!bg-background !border !border-border !rounded-lg !shadow-lg !p-3 !w-[380px]',
    }
  )
}
