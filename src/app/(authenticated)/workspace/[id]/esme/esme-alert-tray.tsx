'use client'

import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Bell,
} from 'lucide-react'
import { formatRelativeTime } from './canvas-block'
import type { SerializedAlert } from './types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

interface EsmeAlertTrayProps {
  alerts: SerializedAlert[]
}

export function EsmeAlertTray({ alerts }: EsmeAlertTrayProps) {
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
              <AlertTrayCard key={alert.id} alert={alert} />
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
              <AlertTrayCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertTrayCard({ alert }: { alert: SerializedAlert }) {
  const Icon = typeIcons[alert.type] ?? Bell
  const isRequiresAction = alert.priority === 'requires_action'

  return (
    <div className="p-3 rounded-lg border text-sm">
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
    </div>
  )
}
