'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { AlertSummaryWorkspace } from './actions'

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

export function AlertsSummary({
  workspaces,
}: {
  workspaces: AlertSummaryWorkspace[]
}) {
  if (workspaces.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-8 text-center">
        <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">
          All clear — no alerts across your clients
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
      {workspaces.map((ws) => (
        <WorkspaceAlertGroup key={ws.workspaceId} workspace={ws} />
      ))}
    </div>
  )
}

function WorkspaceAlertGroup({
  workspace,
}: {
  workspace: AlertSummaryWorkspace
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors">
          <ChevronRight
            className={`h-4 w-4 mr-2 text-muted-foreground shrink-0 transition-transform ${
              open ? 'rotate-90' : ''
            }`}
          />
          <span className="text-sm font-medium flex-1">{workspace.workspaceName}</span>
          <div className="flex items-center gap-2">
            {workspace.requiresActionCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {workspace.requiresActionCount} action{workspace.requiresActionCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {workspace.fyiCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {workspace.fyiCount} FYI
              </Badge>
            )}
            <Link
              href={`/workspace/${workspace.workspaceId}/alerts`}
              className="text-xs text-primary hover:underline ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              View all
            </Link>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-3 pt-0">
          {workspace.alerts.map((alert) => {
            const Icon = typeIcons[alert.type] ?? Bell
            const isRequiresAction = alert.priority === 'requires_action'

            return (
              <Link
                key={alert.id}
                href={`/workspace/${workspace.workspaceId}/alerts`}
                className="flex items-center gap-2 py-1.5 text-sm hover:text-primary transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className={isRequiresAction ? 'text-foreground' : 'text-muted-foreground'}>
                  {alert.title}
                </span>
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
