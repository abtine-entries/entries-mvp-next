import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Building2,
  Sparkles,
  Plus,
  Filter,
} from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'

interface EventFeedPageProps {
  params: Promise<{ id: string }>
}

// Map event source IDs to ConnectorType for logo.dev logos
const sourceConnectorMap: Record<string, ConnectorType> = {
  qbo: 'quickbooks',
  plaid: 'plaid',
}

// Mock data sources
const dataSources = [
  { id: 'qbo', name: 'QuickBooks Online', connector: 'quickbooks' as ConnectorType, connected: true },
  { id: 'plaid', name: 'Plaid', connector: 'plaid' as ConnectorType, connected: true },
  { id: 'entries', name: 'Entries AI', connected: true },
]

// Map transaction source field to feed source identifier
function mapTransactionSource(source: string): { source: string; sourceLabel: string } {
  if (source === 'bank') return { source: 'plaid', sourceLabel: 'Plaid' }
  if (source === 'qbo') return { source: 'qbo', sourceLabel: 'QBO' }
  return { source: 'entries', sourceLabel: 'Entries' }
}

// Map entity type to feed source identifier for non-transaction entities
function mapEntityTypeSource(_entityType: string): { source: string; sourceLabel: string } {
  // Matches, anomalies, rules, AI actions are all Entries-originated
  return { source: 'entries', sourceLabel: 'Entries' }
}

function formatEventTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function SourceBadge({ source, label }: { source: string; label?: string }) {
  const connectorType = sourceConnectorMap[source]

  if (source === 'entries') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-primary">
        <Sparkles className="h-4 w-4" />
        <span>Entries</span>
      </div>
    )
  }

  if (connectorType) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <ConnectorLogo connector={connectorType} size="sm" />
        <span className="text-muted-foreground">{label}</span>
      </div>
    )
  }

  return (
    <Badge variant="outline" className="text-xs font-normal">
      {label}
    </Badge>
  )
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

  // Build feed items with source info
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
      description: event.title,
      entityType: event.entityType,
    }
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Event Feed', icon: <Activity className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex gap-6 max-w-6xl">
          {/* Left sidebar with filters */}
          <div className="w-64 shrink-0 space-y-6">
            {/* Data Sources */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Data Sources
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      {source.connector ? (
                        <ConnectorLogo connector={source.connector} size="sm" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm">{source.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filter by Source */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Filter by Source
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-border bg-background"
                    />
                    <span className="text-sm">All Sources</span>
                  </label>
                  {dataSources.map((source) => (
                    <label
                      key={source.id}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-border bg-background"
                      />
                      <span className="text-sm text-muted-foreground">
                        {source.name}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Date Range
                </h3>
                <Button variant="outline" className="w-full justify-start text-sm">
                  All time
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Event list */}
          <div className="flex-1">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {/* Table header */}
                <div className="grid grid-cols-[180px_100px_1fr] gap-4 px-4 py-3 border-b border-border text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Occurred
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Source
                  </div>
                  <div>Description</div>
                </div>

                {/* Event rows */}
                <div className="divide-y divide-border">
                  {feedItems.map((event) => (
                    <Link
                      key={event.id}
                      href={`/workspace/${workspace.id}/event/${event.id}`}
                      className="grid grid-cols-[180px_100px_1fr] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="text-sm text-muted-foreground">
                        {formatEventTime(event.occurredAt)}
                      </div>
                      <div>
                        <SourceBadge
                          source={event.source}
                          label={event.sourceLabel}
                        />
                      </div>
                      <div className="text-sm">{event.description}</div>
                    </Link>
                  ))}
                  {feedItems.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No events yet. Events will appear here as transactions, matches, and other activities occur.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
