'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp, Bell, CheckCircle2 } from 'lucide-react'
import { ConfirmResponse } from '../alerts/confirm-response'
import { SelectResponse } from '../alerts/select-response'
import { TextResponse } from '../alerts/text-response'
import type { CanvasBlock as CanvasBlockType, SerializedAlert } from './types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

const typeLabels: Record<string, string> = {
  anomaly: 'Anomaly',
  ai_question: 'AI Question',
  system: 'System',
  insight: 'Insight',
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AlertActionCard({ alert, workspaceId }: { alert: SerializedAlert; workspaceId: string }) {
  const Icon = typeIcons[alert.type] ?? Bell
  const isRequiresAction = alert.priority === 'requires_action'
  const isResolved = alert.status === 'resolved'

  return (
    <div className={cn(
      'mt-2 rounded-xl border p-3 text-sm',
      isResolved ? 'opacity-60' : '',
      isRequiresAction && !isResolved ? 'border-l-4 border-l-warning' : ''
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Badge variant={isRequiresAction ? 'warning' : 'secondary'} className="text-xs">
          {isRequiresAction ? 'Requires Action' : 'FYI'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {typeLabels[alert.type] ?? alert.type}
        </span>
      </div>
      <p className="font-medium mb-1">{alert.title}</p>
      <p className="text-muted-foreground line-clamp-2">{alert.body}</p>

      {isResolved ? (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Resolved{alert.responseValue ? `: ${alert.responseValue}` : ''}</span>
        </div>
      ) : (
        <>
          {alert.responseType === 'confirm' && (
            <ConfirmResponse alertId={alert.id} workspaceId={workspaceId} />
          )}
          {alert.responseType === 'select' && alert.responseOptions && (
            <SelectResponse
              alertId={alert.id}
              workspaceId={workspaceId}
              responseOptions={alert.responseOptions}
            />
          )}
          {alert.responseType === 'text' && (
            <TextResponse alertId={alert.id} workspaceId={workspaceId} />
          )}
        </>
      )}
    </div>
  )
}

interface CanvasBlockProps {
  block: CanvasBlockType
  workspaceId: string
}

export function CanvasBlock({ block, workspaceId }: CanvasBlockProps) {
  switch (block.type) {
    case 'user_message':
      return (
        <div className="flex gap-3 justify-end">
          <div className="max-w-[80%] space-y-1 items-end">
            <div className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap bg-muted">
              {block.content}
            </div>
            <p className="text-xs text-muted-foreground px-1">
              {formatRelativeTime(block.createdAt)}
            </p>
          </div>
        </div>
      )

    case 'alert':
      return (
        <div className="space-y-1">
          <div className="text-sm whitespace-pre-wrap">
            {block.content}
          </div>
          <AlertActionCard alert={block.alert} workspaceId={workspaceId} />
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(block.createdAt)}
          </p>
        </div>
      )

    case 'text':
    default:
      return (
        <div className="space-y-1">
          <div className="text-sm whitespace-pre-wrap">
            {block.content}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(block.createdAt)}
          </p>
        </div>
      )
  }
}
