'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Check, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  source: string
  suggestedCategory: string | null
  confidence: number
  reasoning: string
}

export interface Category {
  id: string
  name: string
  type: string
}

export interface CategorizationTableMeta {
  categories: Category[]
  categorizations: Record<string, string>
  onCategoryChange: (transactionId: string, categoryName: string) => void
  onAcceptSuggestion: (transaction: Transaction) => void
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  if (confidence === 0) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-500/20 text-gray-400 border-gray-500/30"
      >
        No suggestion
      </Badge>
    )
  }

  const percentage = Math.round(confidence * 100)
  const color =
    confidence >= 0.9
      ? 'bg-green-500'
      : confidence >= 0.7
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percentage}%</span>
    </div>
  )
}

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return amount < 0 ? `-${formatted}` : formatted
}

function formatDate(date: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const categorizationColumns: ColumnDef<Transaction>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    size: 80,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.getValue('date'))}
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className="text-sm truncate">{row.getValue('description')}</div>
    ),
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
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
    id: 'aiSuggestion',
    header: 'AI Suggestion',
    size: 150,
    cell: ({ row }) => {
      const transaction = row.original

      if (!transaction.suggestedCategory) {
        return <ConfidenceIndicator confidence={0} />
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-sm hover:text-foreground transition-colors">
              <span className="truncate">{transaction.suggestedCategory}</span>
              <HelpCircle className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">AI Reasoning</span>
                <ConfidenceIndicator confidence={transaction.confidence} />
              </div>
              <p className="text-sm text-muted-foreground">
                {transaction.reasoning}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      )
    },
  },
  {
    id: 'category',
    header: 'Category',
    size: 150,
    cell: ({ row, table }) => {
      const meta = table.options.meta as CategorizationTableMeta | undefined
      if (!meta) return null

      const currentCategory = meta.categorizations[row.original.id] || ''

      return (
        <Select
          value={currentCategory}
          onValueChange={(value) =>
            meta.onCategoryChange(row.original.id, value)
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {meta.categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  },
  {
    id: 'actions',
    size: 80,
    cell: ({ row, table }) => {
      const meta = table.options.meta as CategorizationTableMeta | undefined
      if (!meta) return null

      const transaction = row.original
      const currentCategory = meta.categorizations[transaction.id] || ''
      const isAccepted = currentCategory === transaction.suggestedCategory

      if (!transaction.suggestedCategory || isAccepted) return null

      return (
        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => meta.onAcceptSuggestion(transaction)}
              >
                <Check className="h-4 w-4 text-green-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept suggestion</TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]
