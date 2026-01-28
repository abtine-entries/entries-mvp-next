'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export type WorkspaceWithCounts = {
  id: string
  name: string
  lastSyncAt: Date | null
  pendingCount: number
}

export async function getWorkspaces(): Promise<WorkspaceWithCounts[]> {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  const workspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      transactions: {
        where: { status: 'pending' },
        select: { id: true },
      },
    },
  })

  return workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    lastSyncAt: workspace.lastSyncAt,
    pendingCount: workspace.transactions.length,
  }))
}
