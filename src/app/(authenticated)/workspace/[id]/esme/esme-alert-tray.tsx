'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Bell,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRelativeTime } from './canvas-block'
import { dismissAlert } from '../alerts/actions'
import { SnoozePopover } from '../alerts/snooze-popover'
import type { SerializedAlert } from './types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

interface EsmeAlertTrayProps {
  alerts: SerializedAlert[]
  workspaceId: string
}

export function EsmeAlertTray({ alerts, workspaceId }: EsmeAlertTrayProps) {
  const requiresAction = alerts.filter((a) => a.priority === 'requires_action')
  const fyi = alerts.filter((a) => a.priority === 'fyi')
  const totalCount = alerts.length

  if (totalCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Bell className="h-8 w-8" />
        <p className="text-sm">No active alerts</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {requiresAction.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Requires Action ({requiresAction.length})
          </p>
          <div className="space-y-2">
            {requiresAction.map((alert) => (
              <AlertTrayCard key={alert.id} alert={alert} workspaceId={workspaceId} />
            ))}
          </div>
        </div>
      )}
      {fyi.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            FYI ({fyi.length})
          </p>
          <div className="space-y-2">
            {fyi.map((alert) => (
              <AlertTrayCard key={alert.id} alert={alert} workspaceId={workspaceId} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertTrayCard({ alert, workspaceId }: { alert: SerializedAlert; workspaceId: string }) {
  const Icon = typeIcons[alert.type] ?? Bell
  const isRequiresAction = alert.priority === 'requires_action'
  const [isPending, startTransition] = useTransition()

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissAlert(alert.id, workspaceId)
      if (result.success) {
        toast.success('Alert dismissed')
      } else {
        toast.error(result.error ?? 'Failed to dismiss alert')
      }
    })
  }

  return (
    <div className="group p-3 rounded-lg border text-sm relative">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Badge
          variant={isRequiresAction ? 'warning' : 'secondary'}
          className="text-[10px] px-1.5 py-0"
        >
          {isRequiresAction ? 'Action' : 'FYI'}
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {formatRelativeTime(alert.createdAt)}
        </span>
      </div>
      <p className="font-medium line-clamp-2">{alert.title}</p>

      {/* Hover action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
          disabled={isPending}
          title="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <SnoozePopover alertId={alert.id} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
