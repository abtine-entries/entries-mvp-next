import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Bell, Building2, AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp } from 'lucide-react'
import { org } from '@/lib/config'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DismissButton } from './dismiss-button'
import { ConfirmResponse } from './confirm-response'
import { SelectResponse } from './select-response'

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

  // Fetch active alerts: status='active' OR (status='snoozed' AND snoozedUntil <= now)
  const alerts = await prisma.alert.findMany({
    where: {
      workspaceId: id,
      OR: [
        { status: 'active' },
        { status: 'snoozed', snoozedUntil: { lte: now } },
      ],
    },
    orderBy: [
      { priority: 'asc' }, // 'requires_action' sorts before 'fyi' alphabetically
      { createdAt: 'desc' },
    ],
  })

  // Sort: requires_action first, then fyi, then by createdAt desc
  const sortedAlerts = alerts.sort((a, b) => {
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
        {sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No active alerts for this workspace</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedAlerts.map((alert) => {
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
                        <DismissButton alertId={alert.id} workspaceId={workspace.id} />
                      </div>
                      <h3 className="text-sm font-medium leading-snug">
                        {alert.title}
                      </h3>
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
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
