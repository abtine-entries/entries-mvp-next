import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Activity, Building2 } from 'lucide-react'
import { PropertiesSection } from './properties-section'
import { NotesSection } from './notes-section'
import { AuditTrailSection } from './audit-trail-section'

interface EventPageProps {
  params: Promise<{ id: string; eventId: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { id: workspaceId, eventId } = await params

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
    notFound()
  }

  const propertyDefinitions = await prisma.eventPropertyDefinition.findMany({
    where: { workspaceId },
    select: { id: true, name: true, type: true, options: true, position: true },
    orderBy: { position: 'asc' },
  })

  // Fetch audit logs for both the Event entity AND the underlying entity
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: event.workspace.name, href: `/workspace/${workspaceId}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Event Feed', href: `/workspace/${workspaceId}/event-feed`, icon: <Activity className="h-4 w-4" /> },
          { label: event.title },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <Badge variant="outline">{event.entityType}</Badge>
          </div>

          {/* Properties Section */}
          <PropertiesSection
            workspaceId={workspaceId}
            eventId={eventId}
            definitions={propertyDefinitions}
            properties={event.properties}
          />

          {/* Notes Section */}
          <NotesSection
            workspaceId={workspaceId}
            eventId={eventId}
            initialNotes={event.notes.map((note) => ({
              id: note.id,
              content: note.content,
              authorType: note.authorType,
              authorName: note.authorType === 'ai' ? 'Entries AI' : (note.author?.name ?? 'Unknown'),
              createdAt: note.createdAt.toISOString(),
            }))}
          />

          {/* Audit Trail Section */}
          <AuditTrailSection entries={auditEntries} />
        </div>
      </div>
    </div>
  )
}
