'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface UpdateEventPropertyResult {
  success: boolean
  error?: string
}

/**
 * Update (or create) an event property value for a given event and definition.
 * Creates an AuditLog entry with action 'property_updated'.
 */
export async function updateEventProperty(
  workspaceId: string,
  eventId: string,
  definitionId: string,
  value: string
): Promise<UpdateEventPropertyResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate event belongs to workspace
    const event = await prisma.event.findFirst({
      where: { id: eventId, workspaceId },
    })
    if (!event) {
      return { success: false, error: 'Event not found' }
    }

    // Validate definition belongs to workspace
    const definition = await prisma.eventPropertyDefinition.findFirst({
      where: { id: definitionId, workspaceId },
    })
    if (!definition) {
      return { success: false, error: 'Property definition not found' }
    }

    // Find existing property value
    const existing = await prisma.eventProperty.findFirst({
      where: { eventId, definitionId },
    })

    const oldValue = existing?.value ?? null

    if (existing) {
      await prisma.eventProperty.update({
        where: { id: existing.id },
        data: { value },
      })
    } else {
      await prisma.eventProperty.create({
        data: { eventId, definitionId, value },
      })
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: 'property_updated',
        entityType: 'Event',
        entityId: eventId,
        oldValue: oldValue !== null
          ? JSON.stringify({ propertyName: definition.name, oldValue })
          : null,
        newValue: JSON.stringify({ propertyName: definition.name, newValue: value }),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/event/${eventId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to update event property:', error)
    return { success: false, error: 'Failed to update property' }
  }
}
