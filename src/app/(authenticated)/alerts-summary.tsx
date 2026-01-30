'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AlertSummaryWorkspace } from './actions'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

function getEsmeGreeting(totalAlerts: number, workspaceCount: number): string {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (totalAlerts === 0) {
    return `${timeGreeting}! All clear — no alerts across your clients.`
  }

  const clientWord = workspaceCount === 1 ? 'client needs' : 'clients need'
  return `${timeGreeting}! ${workspaceCount} ${clientWord} attention today.`
}

type FlatAlert = {
  id: string
  title: string
  type: string
  priority: string
  workspaceId: string
  workspaceName: string
}

export function AlertsSummary({
  workspaces,
}: {
  workspaces: AlertSummaryWorkspace[]
}) {
  const [showAll, setShowAll] = useState(false)

  const totalAlerts = workspaces.reduce(
    (sum, ws) => sum + ws.requiresActionCount + ws.fyiCount,
    0
  )

  // Flatten alerts with workspace context, prioritizing requires_action
  const flatAlerts: FlatAlert[] = workspaces.flatMap((ws) =>
    ws.alerts.map((alert) => ({
      ...alert,
      workspaceId: ws.workspaceId,
      workspaceName: ws.workspaceName,
    }))
  )

  // Sort: requires_action first, then by original order
  flatAlerts.sort((a, b) => {
    if (a.priority === 'requires_action' && b.priority !== 'requires_action') return -1
    if (a.priority !== 'requires_action' && b.priority === 'requires_action') return 1
    return 0
  })

  const topIssues = flatAlerts.slice(0, 5)
  const hasMore = flatAlerts.length > 5

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Esme header with greeting */}
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">Esme</span>
            {totalAlerts > 0 && (
              <Badge variant="warning" className="text-xs">
                {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {getEsmeGreeting(totalAlerts, workspaces.length)}
          </p>
        </div>
      </div>

      {/* Top issues list */}
      {topIssues.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-2 space-y-0.5">
            {topIssues.map((alert) => {
              const Icon = typeIcons[alert.type] ?? Sparkles
              const isRequiresAction = alert.priority === 'requires_action'

              return (
                <Link
                  key={alert.id}
                  href={`/workspace/${alert.workspaceId}/alerts`}
                  className="flex items-center gap-2 py-1.5 text-sm hover:text-primary transition-colors group"
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isRequiresAction ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={`flex-1 truncate ${isRequiresAction ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {alert.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 group-hover:text-primary">
                    {alert.workspaceName}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* View all alerts / expand */}
          {hasMore && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? 'Show less' : `View all ${flatAlerts.length} alerts`}
              </button>
            </div>
          )}

          {/* Expanded full list */}
          {showAll && hasMore && (
            <div className="border-t border-border px-4 py-2 space-y-0.5">
              {flatAlerts.slice(5).map((alert) => {
                const Icon = typeIcons[alert.type] ?? Sparkles
                const isRequiresAction = alert.priority === 'requires_action'

                return (
                  <Link
                    key={alert.id}
                    href={`/workspace/${alert.workspaceId}/alerts`}
                    className="flex items-center gap-2 py-1.5 text-sm hover:text-primary transition-colors group"
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isRequiresAction ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className={`flex-1 truncate ${isRequiresAction ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {alert.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 group-hover:text-primary">
                      {alert.workspaceName}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
