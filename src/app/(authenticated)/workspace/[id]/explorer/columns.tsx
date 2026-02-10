'use client'

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown, Bot } from 'lucide-react'
import type {
  ExplorerTransaction,
  ExplorerVendor,
  ExplorerCategory,
  ExplorerEvent,
} from './actions'

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

// --- Category dropdown for inline editing ---
function CategoryDropdown({
  transaction,
  categories,
  onCategoryChange,
  onCategoryClick,
}: {
  transaction: ExplorerTransaction
  categories: ExplorerCategory[]
  onCategoryChange: (transactionId: string, categoryId: string | null, categoryName: string | null) => void
  onCategoryClick?: (categoryId: string) => void
}) {
  // Group categories by type
  const grouped = useMemo(() => {
    const groups: Record<string, ExplorerCategory[]> = {}
    for (const c of categories) {
      if (!groups[c.type]) groups[c.type] = []
      groups[c.type].push(c)
    }
    return groups
  }, [categories])

  const typeLabels: Record<string, string> = {
    expense: 'Expenses',
    income: 'Income',
    asset: 'Assets',
    liability: 'Liabilities',
  }
  const typeOrder = ['expense', 'income', 'asset', 'liability']

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={transaction.categoryId ?? '__none__'}
        onValueChange={(value) => {
          const newCategoryId = value === '__none__' ? null : value
          const newCategoryName = newCategoryId
            ? categories.find((c) => c.id === newCategoryId)?.name ?? null
            : null
          onCategoryChange(transaction.id, newCategoryId, newCategoryName)
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            'h-7 min-w-[120px] max-w-[160px] text-xs',
            !transaction.categoryId && 'text-yellow-400 border-yellow-500/30'
          )}
        >
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-yellow-400">Uncategorized</span>
          </SelectItem>
          {typeOrder.map((type) => {
            const items = grouped[type]
            if (!items || items.length === 0) return null
            return (
              <SelectGroup key={type}>
                <SelectLabel>{typeLabels[type] ?? type}</SelectLabel>
                {items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )
          })}
        </SelectContent>
      </Select>
      {transaction.categoryId && onCategoryClick && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            onCategoryClick(transaction.categoryId!)
          }}
          title="View category details"
        >
          ↗
        </button>
      )}
      {transaction.aiReasoning && (
        <span title="AI-suggested category">
          <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
        </span>
      )}
    </div>
  )
}

// --- Transaction columns ---
export function getTransactionColumns(options: {
  onSourceClick?: (sourceKey: string) => void
  onCategoryClick?: (categoryId: string) => void
  categories?: ExplorerCategory[]
  onCategoryChange?: (transactionId: string, categoryId: string | null, categoryName: string | null) => void
}): ColumnDef<ExplorerTransaction>[] {
  const { onSourceClick, onCategoryClick, categories, onCategoryChange } = options
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
      size: 180,
      cell: ({ row }) => {
        // If categories and onCategoryChange are provided, show dropdown
        if (categories && onCategoryChange) {
          return (
            <CategoryDropdown
              transaction={row.original}
              categories={categories}
              onCategoryChange={onCategoryChange}
              onCategoryClick={onCategoryClick}
            />
          )
        }
        // Fallback to simple text/button display
        const name = row.getValue<string | null>('categoryName')
        const categoryId = row.original.categoryId
        if (!name) {
          return <span className="text-sm text-muted-foreground">—</span>
        }
        return onCategoryClick && categoryId ? (
          <button
            className="cursor-pointer hover:underline text-sm"
            onClick={(e) => {
              e.stopPropagation()
              onCategoryClick(categoryId)
            }}
          >
            {name}
          </button>
        ) : (
          <span className="text-sm">{name}</span>
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
  ]
}

// --- Vendor columns ---
export function getVendorColumns(
  onVendorClick?: (vendorId: string) => void
): ColumnDef<ExplorerVendor>[] {
  return [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader label="Name" column={column} />,
    cell: ({ row }) => {
      const name = row.getValue<string>('name')
      const vendorId = row.original.id
      return onVendorClick ? (
        <button
          className="cursor-pointer hover:underline text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation()
            onVendorClick(vendorId)
          }}
        >
          {name}
        </button>
      ) : (
        <span className="text-sm font-medium">{name}</span>
      )
    },
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
}

// --- Category columns ---
export function getCategoryColumns(
  onCategoryClick?: (categoryId: string) => void
): ColumnDef<ExplorerCategory>[] {
  return [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader label="Name" column={column} />,
    cell: ({ row }) => {
      const name = row.getValue<string>('name')
      const categoryId = row.original.id
      return onCategoryClick ? (
        <button
          className="cursor-pointer hover:underline text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation()
            onCategoryClick(categoryId)
          }}
        >
          {name}
        </button>
      ) : (
        <span className="text-sm font-medium">{name}</span>
      )
    },
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
}

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
