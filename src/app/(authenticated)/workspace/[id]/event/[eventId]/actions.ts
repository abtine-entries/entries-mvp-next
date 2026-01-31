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

// --- Event Detail (for drawer) ---

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info'

export interface SerializedEntityDetail {
  label: string
  value: string | null
  badge?: { variant: BadgeVariant }
  sourceKey?: string
}

export interface EventDetailData {
  event: {
    id: string
    title: string
    entityType: string
    entityId: string
    createdAt: string
    updatedAt: string
  }
  entityDetails: SerializedEntityDetail[]
  entitySourceKey: string | null
  entitySourceLabel: string | null
  propertyDefinitions: {
    id: string
    name: string
    type: string
    options: string | null
    position: number
  }[]
  properties: {
    id: string
    definitionId: string
    value: string
  }[]
  notes: {
    id: string
    content: string
    authorType: string
    authorName: string
    createdAt: string
  }[]
  auditEntries: {
    id: string
    action: string
    userId: string
    userName: string | null
    oldValue: string | null
    newValue: string | null
    createdAt: string
  }[]
  originPayload: Record<string, unknown>
}

function formatCurrency(amount: number | { toNumber(): number }): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber()
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'matched': return 'success'
    case 'pending': return 'warning'
    case 'unmatched': return 'outline'
    case 'resolved': return 'success'
    case 'dismissed': return 'secondary'
    case 'open': return 'warning'
    default: return 'outline'
  }
}

function getSeverityBadgeVariant(severity: string): BadgeVariant {
  switch (severity) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'bank': return 'Chase'
    case 'qbo': return 'QuickBooks'
    default: return source
  }
}

async function fetchEntitySource(entityType: string, entityId: string): Promise<{ key: string; label: string } | null> {
  switch (entityType) {
    case 'transaction': {
      const txn = await prisma.transaction.findUnique({
        where: { id: entityId },
        select: { source: true },
      })
      if (!txn) return null
      const keyMap: Record<string, string> = { bank: 'chase', qbo: 'quickbooks' }
      return { key: keyMap[txn.source] ?? txn.source, label: getSourceLabel(txn.source) }
    }
    case 'match':
    case 'anomaly':
    case 'rule':
      return { key: 'entries', label: 'Esme' }
    default:
      return null
  }
}

async function fetchEntityDetails(entityType: string, entityId: string): Promise<SerializedEntityDetail[]> {
  switch (entityType) {
    case 'transaction': {
      const txn = await prisma.transaction.findUnique({
        where: { id: entityId },
        include: { category: { select: { name: true } } },
      })
      if (!txn) return []
      return [
        { label: 'Amount', value: formatCurrency(txn.amount) },
        { label: 'Date', value: formatDate(txn.date) },
        { label: 'Source', value: getSourceLabel(txn.source), badge: { variant: txn.source === 'bank' ? 'info' : 'secondary' } },
        { label: 'Status', value: txn.status, badge: { variant: getStatusBadgeVariant(txn.status) } },
        { label: 'Category', value: txn.category?.name ?? null },
        { label: 'Confidence', value: txn.confidence != null ? `${Math.round(txn.confidence * 100)}%` : null },
      ]
    }
    case 'match': {
      const match = await prisma.match.findUnique({
        where: { id: entityId },
        include: {
          bankTransaction: { select: { description: true } },
          qboTransaction: { select: { description: true } },
        },
      })
      if (!match) return []
      return [
        { label: 'Bank Transaction', value: match.bankTransaction.description },
        { label: 'QBO Transaction', value: match.qboTransaction.description },
        { label: 'Match Type', value: match.matchType, badge: { variant: match.matchType === 'exact' ? 'success' : match.matchType === 'manual' ? 'info' : 'warning' } },
        { label: 'Confidence', value: `${Math.round(match.confidence * 100)}%` },
      ]
    }
    case 'anomaly': {
      const anomaly = await prisma.anomaly.findUnique({
        where: { id: entityId },
      })
      if (!anomaly) return []
      return [
        { label: 'Severity', value: anomaly.severity, badge: { variant: getSeverityBadgeVariant(anomaly.severity) } },
        { label: 'Type', value: anomaly.type },
        { label: 'Status', value: anomaly.status, badge: { variant: getStatusBadgeVariant(anomaly.status) } },
        { label: 'Suggested Resolution', value: anomaly.suggestedResolution },
      ]
    }
    case 'rule': {
      const rule = await prisma.rule.findUnique({
        where: { id: entityId },
        include: { category: { select: { name: true } } },
      })
      if (!rule) return []
      return [
        { label: 'Rule Text', value: rule.ruleText },
        { label: 'Category', value: rule.category?.name ?? '—' },
        { label: 'Active', value: rule.isActive ? 'Yes' : 'No', badge: { variant: rule.isActive ? 'success' : 'outline' } },
        { label: 'Match Count', value: String(rule.matchCount) },
      ]
    }
    default:
      return []
  }
}

export async function getEventDetail(
  workspaceId: string,
  eventId: string
): Promise<{ success: boolean; error?: string; data?: EventDetailData }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        workspace: { select: { id: true, name: true } },
        properties: {
          select: { id: true, definitionId: true, value: true },
        },
        notes: {
          select: {
            id: true,
            content: true,
            authorType: true,
            authorId: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!event || event.workspaceId !== workspaceId) {
      return { success: false, error: 'Event not found' }
    }

    const [entityDetailsRaw, entitySource] = await Promise.all([
      fetchEntityDetails(event.entityType, event.entityId),
      fetchEntitySource(event.entityType, event.entityId),
    ])

    // Tag Source detail row with sourceKey so the client can render the icon
    const entityDetails = entityDetailsRaw.map((detail) => {
      if (detail.label === 'Source' && entitySource) {
        return { ...detail, sourceKey: entitySource.key }
      }
      return detail
    })

    const propertyDefinitions = await prisma.eventPropertyDefinition.findMany({
      where: { workspaceId },
      select: { id: true, name: true, type: true, options: true, position: true },
      orderBy: { position: 'asc' },
    })

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        workspaceId,
        OR: [
          { entityType: 'Event', entityId: eventId },
          { entityType: event.entityType, entityId: event.entityId },
        ],
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const auditEntries = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userName: log.user.name,
      oldValue: log.oldValue,
      newValue: log.newValue,
      createdAt: log.createdAt.toISOString(),
    }))

    const originPayload: Record<string, unknown> = {
      id: event.id,
      entity_type: event.entityType,
      entity_id: event.entityId,
      title: event.title,
      workspace: {
        id: event.workspace.id,
        name: event.workspace.name,
      },
      created_at: event.createdAt.toISOString(),
      updated_at: event.updatedAt.toISOString(),
      entity_details: entityDetails.reduce((acc, d) => {
        acc[d.label.toLowerCase().replace(/\s+/g, '_')] = d.value
        return acc
      }, {} as Record<string, string | null>),
      properties: event.properties.map((p) => ({
        id: p.id,
        definition_id: p.definitionId,
        value: p.value,
      })),
      notes_count: event.notes.length,
      audit_log_count: auditLogs.length,
    }

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          entityType: event.entityType,
          entityId: event.entityId,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
        },
        entityDetails,
        entitySourceKey: entitySource?.key ?? null,
        entitySourceLabel: entitySource?.label ?? null,
        propertyDefinitions,
        properties: event.properties,
        notes: event.notes.map((note) => ({
          id: note.id,
          content: note.content,
          authorType: note.authorType,
          authorName: note.authorType === 'ai' ? 'Esme' : (note.author?.name ?? 'Unknown'),
          createdAt: note.createdAt.toISOString(),
        })),
        auditEntries,
        originPayload,
      },
    }
  } catch (error) {
    console.error('Failed to fetch event detail:', error)
    return { success: false, error: 'Failed to fetch event detail' }
  }
}
