'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Activity, Filter, Sparkles } from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'

export type EventFeedItem = {
  id: string
  occurredAt: Date
  source: string
  sourceLabel: string
  description: string
  entityType: string
}

const sourceConnectorMap: Record<string, ConnectorType> = {
  qbo: 'quickbooks',
  plaid: 'plaid',
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

function formatEventTime(date: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export const columns: ColumnDef<EventFeedItem>[] = [
  {
    accessorKey: 'occurredAt',
    header: () => (
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Occurred
      </div>
    ),
    size: 180,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatEventTime(row.getValue('occurredAt'))}
      </div>
    ),
  },
  {
    accessorKey: 'source',
    header: () => (
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        Source
      </div>
    ),
    size: 100,
    cell: ({ row }) => (
      <SourceBadge source={row.original.source} label={row.original.sourceLabel} />
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue('description')}</div>
    ),
  },
]
