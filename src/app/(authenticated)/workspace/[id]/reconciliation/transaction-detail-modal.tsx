'use client'

import { useState, useEffect } from 'react'
import { Transaction, Category, Match } from '@/generated/prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExternalLink, ArrowRight, Sparkles } from 'lucide-react'
import { getTransactionDetails, TransactionWithDetails } from './actions'

interface TransactionDetailModalProps {
  transactionId: string | null
  onClose: () => void
  onViewMatchedTransaction?: (transactionId: string) => void
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'matched':
      return 'bg-green-600 hover:bg-green-600'
    case 'pending':
      return 'bg-yellow-500 hover:bg-yellow-500'
    case 'unmatched':
      return 'bg-gray-500 hover:bg-gray-500'
    default:
      return ''
  }
}

function getSourceLabel(source: string): string {
  return source === 'bank' ? 'Bank' : 'QuickBooks'
}

export function TransactionDetailModal({
  transactionId,
  onClose,
  onViewMatchedTransaction,
}: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!transactionId) {
      setTransaction(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    getTransactionDetails(transactionId)
      .then((result) => {
        if (result.error) {
          setError(result.error)
          setTransaction(null)
        } else {
          setTransaction(result.transaction ?? null)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch transaction details:', err)
        setError('Failed to load transaction details')
        setTransaction(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [transactionId])

  const handleViewMatchedTransaction = (matchedTxnId: string) => {
    if (onViewMatchedTransaction) {
      onViewMatchedTransaction(matchedTxnId)
    }
  }

  const matchedTransaction = transaction?.bankMatches?.[0]?.qboTransaction ||
    transaction?.qboMatches?.[0]?.bankTransaction ||
    null

  const match = transaction?.bankMatches?.[0] || transaction?.qboMatches?.[0] || null

  return (
    <Dialog open={!!transactionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            Loading transaction details...
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-red-600">{error}</div>
        )}

        {transaction && !isLoading && !error && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Date
                </div>
                <div className="text-sm font-medium">
                  {formatDate(transaction.date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Source
                </div>
                <div className="text-sm font-medium">
                  {getSourceLabel(transaction.source)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Description
              </div>
              <div className="text-sm">{transaction.description}</div>
            </div>

            {/* Amount and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Amount
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    Number(transaction.amount) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatAmount(transaction.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Status
                </div>
                <Badge
                  className={cn(
                    'capitalize',
                    getStatusBadgeColor(transaction.status)
                  )}
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Category
              </div>
              <div className="text-sm">
                {transaction.category ? (
                  <span>
                    {transaction.category.name}
                    <span className="text-muted-foreground ml-2">
                      ({transaction.category.type})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not categorized
                  </span>
                )}
              </div>
            </div>

            {/* AI Reasoning */}
            {transaction.aiReasoning && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-700 uppercase tracking-wide font-medium">
                    AI Reasoning
                  </span>
                  {transaction.confidence !== null && (
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-[10px] px-1.5 py-0">
                      {Math.round(transaction.confidence * 100)}% confident
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-blue-800">
                  {transaction.aiReasoning}
                </div>
              </div>
            )}

            {/* Matched Transaction */}
            {matchedTransaction && match && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 uppercase tracking-wide font-medium">
                    Matched Transaction
                  </span>
                  <Badge className="bg-green-600 hover:bg-green-600 text-[10px] px-1.5 py-0 capitalize">
                    {match.matchType}
                  </Badge>
                  <Badge className="bg-green-700 hover:bg-green-700 text-[10px] px-1.5 py-0">
                    {Math.round(match.confidence * 100)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-800">
                      {formatDate(matchedTransaction.date)}
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        Number(matchedTransaction.amount) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {formatAmount(matchedTransaction.amount)}
                    </span>
                  </div>
                  <div className="text-sm text-green-800">
                    {matchedTransaction.description}
                  </div>
                  {match.reasoning && (
                    <div className="text-xs text-green-700 italic mt-1">
                      {match.reasoning}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={() => handleViewMatchedTransaction(matchedTransaction.id)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View {getSourceLabel(matchedTransaction.source)} Transaction
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {formatDateTime(transaction.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {formatDateTime(transaction.updatedAt)}
                </div>
                {transaction.externalId && (
                  <div className="col-span-2">
                    <span className="font-medium">External ID:</span>{' '}
                    {transaction.externalId}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
