'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface AlertActionResult {
  success: boolean
  error?: string
}

export type DismissAlertResult = AlertActionResult

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
    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to dismiss alert:', error)
    return { success: false, error: 'Failed to dismiss alert' }
  }
}

export async function snoozeAlert(
  alertId: string,
  workspaceId: string,
  snoozedUntil: string // ISO date string
): Promise<AlertActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const alert = await prisma.alert.findFirst({
      where: { id: alertId, workspaceId },
    })
    if (!alert) {
      return { success: false, error: 'Alert not found' }
    }

    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'snoozed',
        snoozedUntil: new Date(snoozedUntil),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/alerts`)
    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to snooze alert:', error)
    return { success: false, error: 'Failed to snooze alert' }
  }
}

export async function assignAlert(
  alertId: string,
  workspaceId: string,
  userId: string
): Promise<AlertActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const alert = await prisma.alert.findFirst({
      where: { id: alertId, workspaceId },
    })
    if (!alert) {
      return { success: false, error: 'Alert not found' }
    }

    await prisma.alert.update({
      where: { id: alertId },
      data: { assignedToId: userId },
    })

    revalidatePath(`/workspace/${workspaceId}/alerts`)
    return { success: true }
  } catch (error) {
    console.error('Failed to assign alert:', error)
    return { success: false, error: 'Failed to assign alert' }
  }
}

export async function resolveAlert(
  alertId: string,
  workspaceId: string,
  responseValue: string
): Promise<AlertActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

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
        responseValue,
      },
    })

    revalidatePath(`/workspace/${workspaceId}/alerts`)
    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to resolve alert:', error)
    return { success: false, error: 'Failed to resolve alert' }
  }
}
