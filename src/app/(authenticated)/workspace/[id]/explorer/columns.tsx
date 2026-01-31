'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type {
  ExplorerTransaction,
  ExplorerVendor,
  ExplorerCategory,
  ExplorerEvent,
  WorkspaceDocument,
} from './actions'
import { StatementCell } from './statement-cell'

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return amount < 0 ? `-${formatted}` : formatted
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SortableHeader({ label, column }: { label: string; column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' } }) {
  const sorted = column.getIsSorted()
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      <Icon className={cn('h-3.5 w-3.5', sorted ? 'text-foreground' : 'text-muted-foreground/50')} />
    </button>
  )
}

// --- Transaction columns ---
export function getTransactionColumns(
  documents: WorkspaceDocument[],
  workspaceId: string,
  onSourceClick?: (sourceKey: string) => void
): ColumnDef<ExplorerTransaction>[] {
  return [
    {
      accessorKey: 'date',
      header: ({ column }) => <SortableHeader label="Date" column={column} />,
      size: 120,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.getValue('date'))}
        </span>
      ),
      sortingFn: (a, b) => {
        return new Date(a.original.date).getTime() - new Date(b.original.date).getTime()
      },
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <SortableHeader label="Description" column={column} />,
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[300px] block">
          {row.getValue('description')}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader label="Amount" column={column} />
        </div>
      ),
      size: 120,
      cell: ({ row }) => {
        const amount = row.getValue<number>('amount')
        return (
          <div
            className={cn(
              'text-right text-sm font-mono',
              amount < 0 ? 'text-red-400' : 'text-green-400'
            )}
          >
            {formatAmount(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: 'categoryName',
      header: ({ column }) => <SortableHeader label="Category" column={column} />,
      size: 150,
      cell: ({ row }) => {
        const name = row.getValue<string | null>('categoryName')
        return name ? (
          <span className="text-sm">{name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'source',
      header: ({ column }) => <SortableHeader label="Source" column={column} />,
      size: 100,
      cell: ({ row }) => {
        const source = row.getValue<string>('source')
        return onSourceClick ? (
          <button
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              onSourceClick(source)
            }}
          >
            <Badge variant="outline" className="text-xs capitalize pointer-events-none">
              {source === 'qbo' ? 'QBO' : source}
            </Badge>
          </button>
        ) : (
          <Badge variant="outline" className="text-xs capitalize">
            {source === 'qbo' ? 'QBO' : source}
          </Badge>
        )
      },
    },
    {
      id: 'statement',
      header: () => <span className="text-sm">Statement</span>,
      size: 180,
      cell: ({ row }) => (
        <StatementCell
          transactionId={row.original.id}
          documentId={row.original.documentId}
          documentFileName={row.original.documentFileName}
          documents={documents}
          workspaceId={workspaceId}
        />
      ),
    },
  ]
}

// --- Vendor columns ---
export const vendorColumns: ColumnDef<ExplorerVendor>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'totalSpend',
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader label="Total Spend" column={column} />
      </div>
    ),
    size: 140,
    cell: ({ row }) => (
      <div className="text-right text-sm font-mono">
        {formatAmount(row.getValue('totalSpend'))}
      </div>
    ),
  },
  {
    accessorKey: 'transactionCount',
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader label="Transactions" column={column} />
      </div>
    ),
    size: 130,
    cell: ({ row }) => (
      <div className="text-right text-sm text-muted-foreground">
        {row.getValue<number>('transactionCount')}
      </div>
    ),
  },
  {
    accessorKey: 'firstSeen',
    header: ({ column }) => <SortableHeader label="First Seen" column={column} />,
    size: 130,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.getValue('firstSeen'))}
      </span>
    ),
    sortingFn: (a, b) => {
      return new Date(a.original.firstSeen).getTime() - new Date(b.original.firstSeen).getTime()
    },
  },
  {
    accessorKey: 'lastSeen',
    header: ({ column }) => <SortableHeader label="Last Seen" column={column} />,
    size: 130,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.getValue('lastSeen'))}
      </span>
    ),
    sortingFn: (a, b) => {
      return new Date(a.original.lastSeen).getTime() - new Date(b.original.lastSeen).getTime()
    },
  },
]

// --- Category columns ---
export const categoryColumns: ColumnDef<ExplorerCategory>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <SortableHeader label="Type" column={column} />,
    size: 120,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs capitalize">
        {row.getValue('type')}
      </Badge>
    ),
  },
  {
    accessorKey: 'transactionCount',
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader label="Transactions" column={column} />
      </div>
    ),
    size: 130,
    cell: ({ row }) => (
      <div className="text-right text-sm text-muted-foreground">
        {row.getValue<number>('transactionCount')}
      </div>
    ),
  },
]

// --- Event columns ---
export const eventColumns: ColumnDef<ExplorerEvent>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <SortableHeader label="Title" column={column} />,
    cell: ({ row }) => (
      <span className="text-sm truncate max-w-[400px] block">
        {row.getValue('title')}
      </span>
    ),
  },
  {
    accessorKey: 'entityType',
    header: ({ column }) => <SortableHeader label="Entity Type" column={column} />,
    size: 140,
    cell: ({ row }) => {
      const entityType = row.getValue<string>('entityType')
      const label = entityType.charAt(0).toUpperCase() + entityType.slice(1).replace('_', ' ')
      return (
        <Badge variant="outline" className="text-xs capitalize">
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader label="Created At" column={column} />,
    size: 180,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.getValue('createdAt'))}
      </span>
    ),
    sortingFn: (a, b) => {
      return new Date(a.original.createdAt).getTime() - new Date(b.original.createdAt).getTime()
    },
  },
]
