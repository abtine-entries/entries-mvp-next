'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ArrowLeftRight,
  Tags,
  Plug,
  Building2,
  Layers,
  FileText,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import type { RecentActivityEvent } from './actions'

// --- Sortable header ---
function SortableHeader({ column, children }: { column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: () => void }; children: React.ReactNode }) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting()}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </Button>
  )
}

const tzAbbr = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
  .formatToParts(new Date())
  .find((p) => p.type === 'timeZoneName')?.value ?? ''

function formatEventTime(date: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const base = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${base} ${tzAbbr}`
}

function SourceIcon({ source }: { source: string }) {
  if (source === 'entries') {
    return <Sparkles className="h-4 w-4 text-primary" />
  }

  const connectorTypes: ConnectorType[] = [
    'quickbooks', 'xero', 'stripe', 'chase',
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
    enableSorting: false,
    header: () => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Plug className="h-3.5 w-3.5" />
        <span>Source</span>
      </div>
    ),
    cell: ({ row }) => <SourceIcon source={row.original.source} />,
  },
  {
    accessorKey: 'workspaceName',
    size: 120,
    header: ({ column }) => <SortableHeader column={column}>Client</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm font-normal text-muted-foreground truncate">
        {row.getValue('workspaceName')}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    size: 100,
    header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <TypeIcon type={row.getValue('type')} />
        <span>{row.getValue('type')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
    cell: ({ row }) => (
      <span className="truncate">{row.getValue('description')}</span>
    ),
  },
  {
    accessorKey: 'occurredAt',
    size: 140,
    header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
    sortingFn: (rowA, rowB) => {
      const a = new Date(rowA.original.occurredAt).getTime()
      const b = new Date(rowB.original.occurredAt).getTime()
      return a - b
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatEventTime(row.getValue('occurredAt'))}
      </span>
    ),
  },
]
