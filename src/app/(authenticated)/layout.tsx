import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/layout'

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
  const alertCounts = await getAlertCountsByWorkspace(workspaces.map((w) => w.id))

  const user = {
    name: session.user.name ?? null,
    email: session.user.email!,
  }

  return (
    <AppShell workspaces={workspaces} user={user} alertCounts={alertCounts}>
      {children}
    </AppShell>
  )
}
