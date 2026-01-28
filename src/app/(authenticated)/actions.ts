'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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

export type CreateWorkspaceResult = {
  success: boolean
  error?: string
  workspaceId?: string
}

export async function createWorkspace(name: string): Promise<CreateWorkspaceResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { success: false, error: 'Workspace name is required' }
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: trimmedName,
        userId: session.user.id,
        qboStatus: 'connected',
      },
    })

    revalidatePath('/')
    return { success: true, workspaceId: workspace.id }
  } catch {
    return { success: false, error: 'Failed to create workspace' }
  }
}
