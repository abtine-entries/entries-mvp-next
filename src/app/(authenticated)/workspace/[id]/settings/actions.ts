'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const VALID_AUTONOMY_LEVELS = ['conservative', 'balanced', 'autonomous'] as const

export async function getSettingsData(workspaceId: string) {
  const [workspace, confidences] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, autonomyLevel: true },
    }),
    prisma.esmeConfidence.findMany({
      where: { workspaceId, patternType: 'category' },
      orderBy: [{ tier: 'desc' }, { confirmCount: 'desc' }],
    }),
  ])

  return {
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          autonomyLevel: workspace.autonomyLevel,
        }
      : null,
    confidences: confidences.map((c) => ({
      id: c.id,
      patternKey: c.patternKey,
      tier: c.tier,
      confirmCount: c.confirmCount,
      correctionCount: c.correctionCount,
      isLocked: c.isLocked,
    })),
  }
}

export async function updateAutonomyLevel(
  workspaceId: string,
  autonomyLevel: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!VALID_AUTONOMY_LEVELS.includes(autonomyLevel as typeof VALID_AUTONOMY_LEVELS[number])) {
    return { success: false, error: 'Invalid autonomy level' }
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { autonomyLevel },
  })

  revalidatePath(`/workspace/${workspaceId}/settings`)

  return { success: true }
}

export async function toggleConfidenceLock(
  confidenceId: string,
  isLocked: boolean,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  await prisma.esmeConfidence.update({
    where: { id: confidenceId },
    data: { isLocked },
  })

  revalidatePath(`/workspace/${workspaceId}/settings`)

  return { success: true }
}

export type SettingsData = Awaited<ReturnType<typeof getSettingsData>>
export type ConfidenceRecord = SettingsData['confidences'][number]
