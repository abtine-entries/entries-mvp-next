import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Bell, Building2 } from 'lucide-react'
import { org } from '@/lib/config'
import { FilteredAlerts } from './filtered-alerts'

interface AlertsPageProps {
  params: Promise<{ id: string }>
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
        <FilteredAlerts
          activeAlerts={sortedActiveAlerts}
          resolvedAlerts={resolvedAlerts}
          users={users}
          workspaceId={workspace.id}
        />
      </div>
    </div>
  )
}
