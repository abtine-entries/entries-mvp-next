import { Suspense } from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Activity, Building2 } from 'lucide-react'
import { EsmeAvatar } from '@/components/esme-avatar'
import { org } from '@/lib/config'
import { EventFeedDataTable } from './event-feed-data-table'
import { WorkspaceAlertsSummary, type WorkspaceAlert } from './workspace-alerts-summary'
import { getRelationColumns, getRelationLinks } from '../explorer/relation-actions'
import { generateDailyBriefing } from '../esme/actions'
import type { RelationLinksMap } from '../explorer/relation-actions'

interface EventFeedPageProps {
  params: Promise<{ id: string }>
}

// Map transaction source field to feed source identifier
function mapTransactionSource(source: string): { source: string; sourceLabel: string } {
  if (source === 'bank') return { source: 'chase', sourceLabel: 'Chase' }
  if (source === 'qbo') return { source: 'qbo', sourceLabel: 'QBO' }
  return { source: 'entries', sourceLabel: 'Entries' }
}

// Map entity type to feed source identifier for non-transaction entities
function mapEntityTypeSource(_entityType: string): { source: string; sourceLabel: string } {
  return { source: 'entries', sourceLabel: 'Entries' }
}

export default async function EventFeedPage({ params }: EventFeedPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  // Initialize workspace: check if a briefing exists for today and create one if not
  const today = new Date().toISOString().split('T')[0]
  const existingBriefing = await prisma.esmeMessage.findFirst({
    where: {
      workspaceId: id,
      role: 'esme',
      metadata: { contains: `"briefingDate":"${today}"` },
    },
  })

  if (!existingBriefing) {
    const briefingData = await generateDailyBriefing(id)
    await prisma.esmeMessage.create({
      data: {
        workspaceId: id,
        role: 'esme',
        content: briefingData.summary,
        metadata: JSON.stringify({
          blockType: 'briefing',
          briefingDate: today,
          greeting: briefingData.greeting,
          summary: briefingData.summary,
          stats: briefingData.stats,
        }),
      },
    })
  }

  // Fetch real Event records for this workspace
  const events = await prisma.event.findMany({
    where: { workspaceId: id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // For transaction events, look up the transaction source to determine feed source
  const transactionEntityIds = events
    .filter((e) => e.entityType === 'transaction')
    .map((e) => e.entityId)

  const transactions = transactionEntityIds.length > 0
    ? await prisma.transaction.findMany({
        where: { id: { in: transactionEntityIds } },
        select: { id: true, source: true },
      })
    : []

  const transactionSourceMap = new Map(
    transactions.map((t) => [t.id, t.source])
  )

  // Map entityType to a display-friendly type label
  function mapEntityTypeLabel(entityType: string): string {
    switch (entityType) {
      case 'transaction': return 'Transaction'
      case 'match': return 'Match'
      case 'anomaly': return 'Anomaly'
      case 'rule': return 'Rule'
      case 'sync': return 'Sync'
      case 'ai_action': return 'AI Action'
      default: return entityType.charAt(0).toUpperCase() + entityType.slice(1)
    }
  }

  // Fetch active alerts for this workspace
  const now = new Date()
  const activeAlerts = await prisma.alert.findMany({
    where: {
      workspaceId: id,
      OR: [
        { status: 'active' },
        { status: 'snoozed', snoozedUntil: { lte: now } },
      ],
    },
    select: {
      id: true,
      title: true,
      type: true,
      priority: true,
    },
    orderBy: [
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  })

  const workspaceAlerts: WorkspaceAlert[] = activeAlerts.map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    priority: a.priority,
  }))

  // Build feed items with source info
  const relationColumns = await getRelationColumns(id, 'events')

  const feedItems = events.map((event) => {
    let sourceInfo: { source: string; sourceLabel: string }

    if (event.entityType === 'transaction') {
      const txnSource = transactionSourceMap.get(event.entityId)
      sourceInfo = txnSource
        ? mapTransactionSource(txnSource)
        : mapEntityTypeSource(event.entityType)
    } else {
      sourceInfo = mapEntityTypeSource(event.entityType)
    }

    return {
      id: event.id,
      occurredAt: event.createdAt,
      source: sourceInfo.source,
      sourceLabel: sourceInfo.sourceLabel,
      type: mapEntityTypeLabel(event.entityType),
      description: event.title,
      entityType: event.entityType,
      entityId: event.entityId,
      eventId: event.id,
    }
  })

  // Batch-fetch relation links for all event IDs per relation column
  const eventIds = feedItems.map((e) => e.id)
  const relationLinksMap: Record<string, RelationLinksMap> = {}
  if (relationColumns.length > 0 && eventIds.length > 0) {
    const linkResults = await Promise.all(
      relationColumns.map((col) => getRelationLinks(col.id, eventIds))
    )
    for (let i = 0; i < relationColumns.length; i++) {
      relationLinksMap[relationColumns[i].id] = linkResults[i]
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: org.name, href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" unoptimized /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/esme`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Event Feed', icon: <Activity className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="space-y-10">
          {/* Esme Summary */}
          <section>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <EsmeAvatar className="h-4 w-4" />
              Esme
            </p>
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
              <WorkspaceAlertsSummary alerts={workspaceAlerts} workspaceId={workspace.id} />
            </Suspense>
          </section>

          {/* Event Feed Section */}
          <section>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              Event feed
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-foreground/30 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-foreground/45" />
              </span>
            </p>
            <EventFeedDataTable
              data={feedItems}
              workspaceId={workspace.id}
              relationColumns={relationColumns}
              relationLinksMap={relationLinksMap}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
