'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Sparkles, ArrowLeftRight, Tags } from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import type { RecentActivityEvent } from './actions'

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

function SourceIcon({ source }: { source: string }) {
  if (source === 'entries') {
    return <Sparkles className="h-4 w-4 text-primary" />
  }

  const connectorTypes: ConnectorType[] = [
    'quickbooks', 'xero', 'stripe', 'plaid', 'chase',
    'bankofamerica', 'wells_fargo', 'mercury', 'brex',
    'ramp', 'gusto', 'adp'
  ]

  if (connectorTypes.includes(source as ConnectorType)) {
    return <ConnectorLogo connector={source as ConnectorType} size="sm" />
  }

  return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">?</div>
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Category':
      return <Tags className="h-4 w-4 text-muted-foreground" />
    case 'Match':
      return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
    default:
      return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
  }
}

export const recentActivityColumns: ColumnDef<RecentActivityEvent>[] = [
  {
    id: 'source',
    size: 40,
    cell: ({ row }) => <SourceIcon source={row.original.source} />,
  },
  {
    accessorKey: 'workspaceName',
    size: 120,
    cell: ({ row }) => (
      <span className="text-sm font-normal text-muted-foreground truncate">
        {row.getValue('workspaceName')}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    size: 100,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <TypeIcon type={row.getValue('type')} />
        <span>{row.getValue('type')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    cell: ({ row }) => (
      <span className="truncate">{row.getValue('description')}</span>
    ),
  },
  {
    accessorKey: 'occurredAt',
    size: 100,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatEventTime(row.getValue('occurredAt'))}
      </span>
    ),
  },
]
