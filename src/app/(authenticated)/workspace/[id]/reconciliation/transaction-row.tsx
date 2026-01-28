import { Transaction } from '@/generated/prisma/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { MatchSuggestion } from './actions'

interface TransactionRowProps {
  transaction: Transaction
  isSelected?: boolean
  onClick?: () => void
  matchSuggestion?: MatchSuggestion
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

function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.7) return 'medium'
  return 'low'
}

function getConfidenceLabel(confidence: number): string {
  const level = getConfidenceLevel(confidence)
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function getMatchTypeLabel(matchType: string): string {
  switch (matchType) {
    case 'exact':
      return 'Exact'
    case 'timing':
      return 'Timing'
    case 'fee_adjusted':
      return 'Fee Adjusted'
    case 'partial':
      return 'Partial'
    default:
      return matchType
  }
}

export function TransactionRow({
  transaction,
  isSelected = false,
  onClick,
  matchSuggestion,
}: TransactionRowProps) {
  const amount = Number(transaction.amount)
  const isPositive = amount >= 0
  const hasSuggestion = !!matchSuggestion
  const confidenceLevel = hasSuggestion ? getConfidenceLevel(matchSuggestion.confidence) : null

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 transition-colors',
        onClick && 'cursor-pointer',
        isSelected
          ? 'bg-primary/10 border-l-2 border-l-primary'
          : hasSuggestion
            ? cn(
                'border-l-2',
                confidenceLevel === 'high' && 'bg-green-50 border-l-green-500',
                confidenceLevel === 'medium' && 'bg-yellow-50 border-l-yellow-500',
                confidenceLevel === 'low' && 'bg-red-50 border-l-red-400'
              )
            : onClick ? 'hover:bg-muted/50' : ''
      )}
      onClick={onClick}
      title={hasSuggestion ? matchSuggestion.reasoning : undefined}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-sm text-muted-foreground w-12 flex-shrink-0">
          {formatDate(transaction.date)}
        </span>
        <span className="text-sm truncate" title={transaction.description}>
          {truncateDescription(transaction.description)}
        </span>
        {hasSuggestion && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0',
                confidenceLevel === 'high' && 'bg-green-600 hover:bg-green-600',
                confidenceLevel === 'medium' && 'bg-yellow-500 hover:bg-yellow-500',
                confidenceLevel === 'low' && 'bg-red-500 hover:bg-red-500'
              )}
            >
              {getConfidenceLabel(matchSuggestion.confidence)}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {getMatchTypeLabel(matchSuggestion.matchType)}
            </Badge>
          </div>
        )}
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
