import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Bell, Building2, AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp } from 'lucide-react'
import { org } from '@/lib/config'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DismissButton } from './dismiss-button'
import { ConfirmResponse } from './confirm-response'
import { SelectResponse } from './select-response'
import { TextResponse } from './text-response'
import { SnoozePopover } from './snooze-popover'
import { AssignPopover } from './assign-popover'

interface AlertsPageProps {
  params: Promise<{ id: string }>
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
  const diffMs = now.getTime() - date.getTime()
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

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const now = new Date()

  const [activeAlerts, resolvedAlerts, users] = await Promise.all([
    prisma.alert.findMany({
      where: {
        workspaceId: id,
        OR: [
          { status: 'active' },
          { status: 'snoozed', snoozedUntil: { lte: now } },
        ],
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.alert.findMany({
      where: {
        workspaceId: id,
        status: 'resolved',
      },
      include: {
        resolvedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { resolvedAt: 'desc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
    }),
  ])

  // Sort active: requires_action first, then fyi, then by createdAt desc
  const sortedActiveAlerts = activeAlerts.sort((a, b) => {
    if (a.priority === 'requires_action' && b.priority !== 'requires_action') return -1
    if (a.priority !== 'requires_action' && b.priority === 'requires_action') return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          {
            label: org.name,
            href: '/',
            icon: (
              <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">
                {org.initials}
              </span>
            ),
          },
          {
            label: workspace.name,
            href: `/workspace/${workspace.id}/event-feed`,
            icon: <Building2 className="h-4 w-4" />,
          },
          { label: 'Alerts', icon: <Bell className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {sortedActiveAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No active alerts for this workspace</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedActiveAlerts.map((alert) => {
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
                            <AssignPopover alertId={alert.id} workspaceId={workspace.id} users={users} />
                            <SnoozePopover alertId={alert.id} workspaceId={workspace.id} />
                            <DismissButton alertId={alert.id} workspaceId={workspace.id} />
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
                            <ConfirmResponse alertId={alert.id} workspaceId={workspace.id} />
                          )}
                          {alert.responseType === 'select' && alert.responseOptions && (
                            <SelectResponse
                              alertId={alert.id}
                              workspaceId={workspace.id}
                              responseOptions={alert.responseOptions}
                            />
                          )}
                          {alert.responseType === 'text' && (
                            <TextResponse alertId={alert.id} workspaceId={workspace.id} />
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
            {resolvedAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No resolved alerts for this workspace</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {resolvedAlerts.map((alert) => {
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
      </div>
    </div>
  )
}
