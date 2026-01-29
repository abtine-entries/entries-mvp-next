import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Activity, Building2 } from 'lucide-react'
import { SourceIcon } from '@/components/ui/source-icon'
import { PropertiesSection } from './properties-section'
import { NotesSection } from './notes-section'
import { AuditTrailSection } from './audit-trail-section'
import { EntityDetails } from './entity-details'

import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info'

interface EntityDetail {
  label: string
  value: string | null
  badge?: {
    variant: BadgeVariant
  }
  icon?: ReactNode
}

function formatCurrency(amount: number | { toNumber(): number }): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber()
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' {
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

function getSeverityBadgeVariant(severity: string): 'error' | 'warning' | 'info' {
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

interface EntitySource {
  /** Raw key for logo rendering, e.g. "chase", "quickbooks", "entries" */
  key: string
  /** Human-readable label, e.g. "Chase", "QuickBooks", "Entries AI" */
  label: string
}

async function fetchEntitySource(entityType: string, entityId: string): Promise<EntitySource | null> {
  switch (entityType) {
    case 'transaction': {
      const txn = await prisma.transaction.findUnique({
        where: { id: entityId },
        select: { source: true },
      })
      if (!txn) return null
      // Map DB source values to connector keys
      const keyMap: Record<string, string> = { bank: 'chase', qbo: 'quickbooks' }
      return { key: keyMap[txn.source] ?? txn.source, label: getSourceLabel(txn.source) }
    }
    case 'match':
      return { key: 'entries', label: 'Entries AI' }
    case 'anomaly':
      return { key: 'entries', label: 'Entries AI' }
    case 'rule':
      return { key: 'entries', label: 'Entries AI' }
    default:
      return null
  }
}

async function fetchEntityDetails(entityType: string, entityId: string): Promise<EntityDetail[]> {
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
        { label: 'Category', value: rule.category.name },
        { label: 'Active', value: rule.isActive ? 'Yes' : 'No', badge: { variant: rule.isActive ? 'success' : 'outline' } },
        { label: 'Match Count', value: String(rule.matchCount) },
      ]
    }
    default:
      return []
  }
}

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

  const [entityDetailsRaw, entitySource] = await Promise.all([
    fetchEntityDetails(event.entityType, event.entityId),
    fetchEntitySource(event.entityType, event.entityId),
  ])

  // Inject source logo into the Source detail row
  const entityDetails = entityDetailsRaw.map((detail) => {
    if (detail.label === 'Source' && entitySource) {
      return { ...detail, icon: <SourceIcon sourceKey={entitySource.key} /> }
    }
    return detail
  })

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

  // Build raw event payload for developer inspection
  const eventPayload: Record<string, unknown> = {
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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{event.title}</h1>
              <Badge variant="outline">{event.entityType}</Badge>
            </div>
            <EntityDetails details={entityDetails} />
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
          <AuditTrailSection
            entries={auditEntries}
            originPayload={eventPayload}
            originTimestamp={event.createdAt.toISOString()}
            originSourceKey={entitySource?.key}
            originSourceLabel={entitySource?.label}
          />
        </div>
      </div>
    </div>
  )
}
