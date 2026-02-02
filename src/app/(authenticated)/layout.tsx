import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/layout'
import type { SerializedAlert } from './workspace/[id]/esme/types'

async function getWorkspacesForSidebar(userId: string) {
  const workspaces = await prisma.workspace.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
  return workspaces
}

async function getAlertCountsByWorkspace(workspaceIds: string[]) {
  if (workspaceIds.length === 0) return {}
  const alerts = await prisma.alert.groupBy({
    by: ['workspaceId'],
    where: {
      workspaceId: { in: workspaceIds },
      status: 'active',
      priority: 'requires_action',
    },
    _count: true,
  })
  const counts: Record<string, number> = {}
  for (const row of alerts) {
    counts[row.workspaceId] = row._count
  }
  return counts
}

async function getActiveAlertsByWorkspace(workspaceIds: string[]) {
  if (workspaceIds.length === 0) return {}
  const now = new Date()
  const alerts = await prisma.alert.findMany({
    where: {
      workspaceId: { in: workspaceIds },
      OR: [
        { status: 'active' },
        { status: 'snoozed', snoozedUntil: { lt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // cap to avoid loading too many
  })

  const byWorkspace: Record<string, SerializedAlert[]> = {}
  for (const a of alerts) {
    const serialized: SerializedAlert = {
      id: a.id,
      type: a.type,
      priority: a.priority,
      status: a.status,
      title: a.title,
      body: a.body,
      responseType: a.responseType,
      responseOptions: a.responseOptions,
      responseValue: a.responseValue,
      createdAt: a.createdAt.toISOString(),
    }
    if (!byWorkspace[a.workspaceId]) {
      byWorkspace[a.workspaceId] = []
    }
    byWorkspace[a.workspaceId].push(serialized)
  }
  return byWorkspace
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const workspaces = await getWorkspacesForSidebar(session.user.id!)
  const wsIds = workspaces.map((w) => w.id)
  const [alertCounts, alertsByWorkspace] = await Promise.all([
    getAlertCountsByWorkspace(wsIds),
    getActiveAlertsByWorkspace(wsIds),
  ])

  const user = {
    name: session.user.name ?? null,
    email: session.user.email!,
  }

  return (
    <AppShell
      workspaces={workspaces}
      user={user}
      alertCounts={alertCounts}
      alertsByWorkspace={alertsByWorkspace}
    >
      {children}
    </AppShell>
  )
}
