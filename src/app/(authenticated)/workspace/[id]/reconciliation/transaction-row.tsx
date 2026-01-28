import { Transaction } from '@/generated/prisma/client'
import { cn } from '@/lib/utils'

interface TransactionRowProps {
  transaction: Transaction
}

function formatAmount(amount: Transaction['amount']): string {
  const num = Number(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'auto',
  }).format(num)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function truncateDescription(description: string, maxLength: number = 30): string {
  if (description.length <= maxLength) return description
  return description.slice(0, maxLength) + '...'
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const amount = Number(transaction.amount)
  const isPositive = amount >= 0

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-sm text-muted-foreground w-12 flex-shrink-0">
          {formatDate(transaction.date)}
        </span>
        <span className="text-sm truncate" title={transaction.description}>
          {truncateDescription(transaction.description)}
        </span>
      </div>
      <span
        className={cn(
          'text-sm font-medium flex-shrink-0 ml-2',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}
      >
        {formatAmount(transaction.amount)}
      </span>
    </div>
  )
}
