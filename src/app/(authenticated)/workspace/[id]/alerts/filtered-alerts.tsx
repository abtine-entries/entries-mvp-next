'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Bell, AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DismissButton } from './dismiss-button'
import { ConfirmResponse } from './confirm-response'
import { SelectResponse } from './select-response'
import { TextResponse } from './text-response'
import { SnoozePopover } from './snooze-popover'
import { AssignPopover } from './assign-popover'
import { AlertFilters } from './alert-filters'

interface AlertData {
  id: string
  type: string
  priority: string
  status: string
  title: string
  body: string
  responseType: string | null
  responseOptions: string | null
  responseValue: string | null
  resolvedAt: Date | null
  createdAt: Date
  assignedTo: { id: string; name: string | null; email: string } | null
  resolvedBy?: { id: string; name: string | null; email: string } | null
}

interface FilteredAlertsProps {
  activeAlerts: AlertData[]
  resolvedAlerts: AlertData[]
  users: { id: string; name: string | null; email: string }[]
  workspaceId: string
}

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

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffDay > 0) return `${diffDay}d ago`
  if (diffHr > 0) return `${diffHr}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'just now'
}

function getResolutionLabel(alert: { responseValue: string | null }): string {
  if (!alert.responseValue) return 'Dismissed'
  if (alert.responseValue === 'approved') return 'Approved'
  if (alert.responseValue === 'rejected') return 'Rejected'
  return `Response: ${alert.responseValue}`
}

function filterAlerts(alerts: AlertData[], priority: string, type: string, q: string): AlertData[] {
  return alerts.filter((alert) => {
    if (priority !== 'all' && alert.priority !== priority) return false
    if (type !== 'all' && alert.type !== type) return false
    if (q) {
      const query = q.toLowerCase()
      if (
        !alert.title.toLowerCase().includes(query) &&
        !alert.body.toLowerCase().includes(query)
      ) {
        return false
      }
    }
    return true
  })
}

function FilteredAlertsInner({ activeAlerts, resolvedAlerts, users, workspaceId }: FilteredAlertsProps) {
  const searchParams = useSearchParams()

  const priority = searchParams.get('priority') ?? 'all'
  const type = searchParams.get('type') ?? 'all'
  const q = searchParams.get('q') ?? ''

  const filteredActive = filterAlerts(activeAlerts, priority, type, q)
  const filteredResolved = filterAlerts(resolvedAlerts, priority, type, q)

  return (
    <>
      <AlertFilters />
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {filteredActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">
                {priority !== 'all' || type !== 'all' || q
                  ? 'No alerts match your filters'
                  : 'No active alerts for this workspace'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredActive.map((alert) => {
                const Icon = typeIcons[alert.type] ?? Bell
                const isRequiresAction = alert.priority === 'requires_action'

                return (
                  <Card
                    key={alert.id}
                    className={
                      isRequiresAction
                        ? 'border-l-4 border-l-warning py-4'
                        : 'py-4'
                    }
                  >
                    <CardContent className="flex gap-3 items-start">
                      <div className="mt-0.5 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isRequiresAction ? 'warning' : 'secondary'}>
                            {isRequiresAction ? 'Requires Action' : 'FYI'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {typeLabels[alert.type] ?? alert.type}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {getRelativeTime(alert.createdAt)}
                          </span>
                          <AssignPopover alertId={alert.id} workspaceId={workspaceId} users={users} />
                          <SnoozePopover alertId={alert.id} workspaceId={workspaceId} />
                          <DismissButton alertId={alert.id} workspaceId={workspaceId} />
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium leading-snug">
                            {alert.title}
                          </h3>
                          {alert.assignedTo && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {alert.assignedTo.name ?? alert.assignedTo.email}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {alert.body}
                        </p>
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
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {filteredResolved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">
                {priority !== 'all' || type !== 'all' || q
                  ? 'No resolved alerts match your filters'
                  : 'No resolved alerts for this workspace'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredResolved.map((alert) => {
                const Icon = typeIcons[alert.type] ?? Bell
                const isRequiresAction = alert.priority === 'requires_action'

                return (
                  <Card
                    key={alert.id}
                    className="py-4 opacity-75"
                  >
                    <CardContent className="flex gap-3 items-start">
                      <div className="mt-0.5 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isRequiresAction ? 'warning' : 'secondary'}>
                            {isRequiresAction ? 'Requires Action' : 'FYI'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {typeLabels[alert.type] ?? alert.type}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {getRelativeTime(alert.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium leading-snug text-muted-foreground">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {alert.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {getResolutionLabel(alert)}
                          </Badge>
                          {alert.resolvedBy && (
                            <span>
                              by {alert.resolvedBy.name ?? alert.resolvedBy.email}
                            </span>
                          )}
                          {alert.resolvedAt && (
                            <span>
                              &middot; {getRelativeTime(alert.resolvedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

export function FilteredAlerts(props: FilteredAlertsProps) {
  return (
    <Suspense fallback={null}>
      <FilteredAlertsInner {...props} />
    </Suspense>
  )
}
