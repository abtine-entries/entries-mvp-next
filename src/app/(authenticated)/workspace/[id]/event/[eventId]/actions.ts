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
        oldValue: JSON.stringify({ propertyName: definition.name, oldValue: oldValue ?? null }),
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

export interface AddEventNoteResult {
  success: boolean
  error?: string
  note?: {
    id: string
    content: string
    authorType: string
    authorId: string | null
    authorName: string
    createdAt: string
  }
}

/**
 * Add a new note to an event.
 * Creates an AuditLog entry with action 'note_added'.
 */
export async function addEventNote(
  workspaceId: string,
  eventId: string,
  content: string
): Promise<AddEventNoteResult> {
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

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { success: false, error: 'Note content cannot be empty' }
    }

    const note = await prisma.eventNote.create({
      data: {
        eventId,
        authorId: session.user.id,
        authorType: 'user',
        content: trimmedContent,
      },
      include: {
        author: { select: { name: true } },
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: 'note_added',
        entityType: 'Event',
        entityId: eventId,
        newValue: JSON.stringify({
          content: trimmedContent,
          authorType: 'user',
        }),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/event/${eventId}`)

    return {
      success: true,
      note: {
        id: note.id,
        content: note.content,
        authorType: note.authorType,
        authorId: note.authorId,
        authorName: note.author?.name ?? session.user.name ?? 'Unknown',
        createdAt: note.createdAt.toISOString(),
      },
    }
  } catch (error) {
    console.error('Failed to add event note:', error)
    return { success: false, error: 'Failed to add note' }
  }
}

// --- Property Definition CRUD ---

export interface PropertyDefinitionResult {
  success: boolean
  error?: string
  definition?: {
    id: string
    name: string
    type: string
    options: string | null
    position: number
  }
}

export async function createPropertyDefinition(
  workspaceId: string,
  name: string,
  type: string,
  options: string | null
): Promise<PropertyDefinitionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Name is required' }
    }

    // Get next position
    const maxPosition = await prisma.eventPropertyDefinition.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const definition = await prisma.eventPropertyDefinition.create({
      data: {
        workspaceId,
        name: trimmedName,
        type,
        options,
        position: (maxPosition?.position ?? -1) + 1,
      },
    })

    revalidatePath(`/workspace/${workspaceId}`)

    return {
      success: true,
      definition: {
        id: definition.id,
        name: definition.name,
        type: definition.type,
        options: definition.options,
        position: definition.position,
      },
    }
  } catch (error) {
    console.error('Failed to create property definition:', error)
    return { success: false, error: 'Failed to create property definition' }
  }
}

export async function updatePropertyDefinition(
  workspaceId: string,
  definitionId: string,
  name: string,
  type: string,
  options: string | null
): Promise<PropertyDefinitionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.eventPropertyDefinition.findFirst({
      where: { id: definitionId, workspaceId },
    })
    if (!existing) {
      return { success: false, error: 'Property definition not found' }
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Name is required' }
    }

    const definition = await prisma.eventPropertyDefinition.update({
      where: { id: definitionId },
      data: { name: trimmedName, type, options },
    })

    revalidatePath(`/workspace/${workspaceId}`)

    return {
      success: true,
      definition: {
        id: definition.id,
        name: definition.name,
        type: definition.type,
        options: definition.options,
        position: definition.position,
      },
    }
  } catch (error) {
    console.error('Failed to update property definition:', error)
    return { success: false, error: 'Failed to update property definition' }
  }
}

export async function deletePropertyDefinition(
  workspaceId: string,
  definitionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.eventPropertyDefinition.findFirst({
      where: { id: definitionId, workspaceId },
    })
    if (!existing) {
      return { success: false, error: 'Property definition not found' }
    }

    // Delete all property values for this definition, then the definition
    await prisma.$transaction([
      prisma.eventProperty.deleteMany({
        where: { definitionId },
      }),
      prisma.eventPropertyDefinition.delete({
        where: { id: definitionId },
      }),
    ])

    revalidatePath(`/workspace/${workspaceId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete property definition:', error)
    return { success: false, error: 'Failed to delete property definition' }
  }
}

export async function reorderPropertyDefinitions(
  workspaceId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify all definitions belong to workspace
    const definitions = await prisma.eventPropertyDefinition.findMany({
      where: { workspaceId },
      select: { id: true },
    })
    const validIds = new Set(definitions.map((d) => d.id))
    for (const id of orderedIds) {
      if (!validIds.has(id)) {
        return { success: false, error: 'Invalid definition id' }
      }
    }

    // Update positions in a transaction
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.eventPropertyDefinition.update({
          where: { id },
          data: { position: index },
        })
      )
    )

    revalidatePath(`/workspace/${workspaceId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to reorder property definitions:', error)
    return { success: false, error: 'Failed to reorder property definitions' }
  }
}
