'use client'

import { useState, useRef, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Bell,
  Check,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { EsmeAvatar } from '@/components/esme-avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEsmeAlerts } from './esme-alert-provider'
import { showEsmeAlertToast } from './esme-alert-toast'
import { dismissAlert } from '@/app/(authenticated)/workspace/[id]/alerts/actions'
import type { SerializedAlert } from '@/app/(authenticated)/workspace/[id]/esme/types'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

export function EsmeHeaderPresence() {
  const { alerts, workspaceId, removeAlert } = useEsmeAlerts()
  const [open, setOpen] = useState(false)
  const knownAlertIds = useRef<Set<string> | null>(null)
  const router = useRouter()

  const totalAlerts = alerts.length
  const actionAlerts = alerts.filter((a) => a.priority === 'requires_action')

  // Track known alerts. On first mount, mark all existing alerts as known
  // (no toast). Only truly new alerts that appear later get auto-toasted.
  useEffect(() => {
    if (knownAlertIds.current === null) {
      // First mount — seed with current alerts, don't toast
      knownAlertIds.current = new Set(alerts.map((a) => a.id))
      return
    }

    for (const alert of alerts) {
      if (!knownAlertIds.current.has(alert.id)) {
        knownAlertIds.current.add(alert.id)
        showEsmeAlertToast(alert, workspaceId!, removeAlert)
      }
    }
  }, [alerts, workspaceId, removeAlert])

  const handleShowAll = useCallback(() => {
    setOpen(false)
    // Fire all current alerts as toasts
    alerts.forEach((alert, i) => {
      setTimeout(() => {
        showEsmeAlertToast(alert, workspaceId!, removeAlert)
      }, i * 200)
    })
  }, [alerts, workspaceId, removeAlert])

  // Don't render if not in a workspace
  if (!workspaceId) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 hover:bg-accent transition-colors"
          aria-label={`Esme – ${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''}`}
        >
          <EsmeAvatar className="h-5 w-5" />
          <span className="text-xs font-medium text-foreground">Esme</span>
          {totalAlerts > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
              {totalAlerts}
            </span>
          )}
          {actionAlerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-background animate-pulse" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[340px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <EsmeAvatar className="h-4 w-4" />
            <span className="text-sm font-medium">Esme Alerts</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalAlerts} active
          </span>
        </div>

        {/* Alert list */}
        <div className="max-h-[320px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Bell className="h-6 w-6" />
              <p className="text-xs">All clear</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.slice(0, 8).map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  workspaceId={workspaceId}
                  onDismissed={removeAlert}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleShowAll}
            >
              Show as toasts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setOpen(false)
                router.push(`/workspace/${workspaceId}/esme`)
              }}
            >
              Open Esme
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function AlertRow({
  alert,
  workspaceId,
  onDismissed,
  onNavigate,
}: {
  alert: SerializedAlert
  workspaceId: string
  onDismissed: (id: string) => void
  onNavigate: () => void
}) {
  const Icon = typeIcons[alert.type] ?? Bell
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleResolve(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      const result = await dismissAlert(alert.id, workspaceId)
      if (result.success) {
        onDismissed(alert.id)
        toast.success('Resolved')
      } else {
        toast.error(result.error ?? 'Failed to resolve')
      }
    })
  }

  function handleClick() {
    onNavigate()
    router.push(`/workspace/${workspaceId}/esme`)
  }

  return (
    <div
      className="group flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2">{alert.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(alert.createdAt)}
          </span>
          {alert.priority === 'requires_action' && (
            <span className="text-[10px] font-medium text-amber-500">
              Action needed
            </span>
          )}
        </div>
      </div>
      {alert.priority === 'requires_action' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleResolve}
          disabled={isPending}
          title="Quick resolve"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
