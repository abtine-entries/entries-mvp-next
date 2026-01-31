'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  ArrowLeftRight,
  Tags,
  Plug,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react'
import { SourceIcon } from '@/components/ui/source-icon'

export type EventFeedItem = {
  id: string
  occurredAt: Date
  source: string
  sourceLabel: string
  type: string
  description: string
  entityType: string
  entityId: string
  eventId: string | null
}

// --- Sortable header (matches explorer pattern) ---
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

const sourceConnectorMap: Record<string, string> = {
  qbo: 'quickbooks',
  chase: 'chase',
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

function FeedSourceIcon({ source }: { source: string }) {
  const sourceKey = sourceConnectorMap[source] ?? source
  return <SourceIcon sourceKey={sourceKey} size="sm" />
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

export const columns: ColumnDef<EventFeedItem>[] = [
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
    cell: ({ row }) => <FeedSourceIcon source={row.original.source} />,
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
