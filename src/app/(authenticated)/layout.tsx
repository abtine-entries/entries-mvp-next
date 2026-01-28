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

  return (
    <AppShell workspaces={workspaces}>
      {children}
    </AppShell>
  )
}
