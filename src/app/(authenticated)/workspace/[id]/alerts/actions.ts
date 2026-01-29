'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface DismissAlertResult {
  success: boolean
  error?: string
}

export async function dismissAlert(
  alertId: string,
  workspaceId: string
): Promise<DismissAlertResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate alert belongs to the workspace
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, workspaceId },
    })
    if (!alert) {
      return { success: false, error: 'Alert not found' }
    }

    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedById: session.user.id,
      },
    })

    revalidatePath(`/workspace/${workspaceId}/alerts`)
    return { success: true }
  } catch (error) {
    console.error('Failed to dismiss alert:', error)
    return { success: false, error: 'Failed to dismiss alert' }
  }
}
