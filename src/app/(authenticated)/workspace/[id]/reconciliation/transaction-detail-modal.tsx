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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ExternalLink, ArrowRight, Sparkles, Check, ChevronsUpDown, History } from 'lucide-react'
import { toast } from 'sonner'
import {
  getTransactionDetails,
  TransactionWithDetails,
  getWorkspaceCategories,
  getAICategorySuggestion,
  updateTransactionCategory,
  getTransactionAuditLogs,
  CategoryInfo,
  AuditLogEntry,
} from './actions'

interface TransactionDetailModalProps {
  transactionId: string | null
  workspaceId: string
  onClose: () => void
  onViewMatchedTransaction?: (transactionId: string) => void
  onCategoryUpdated?: () => void
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

function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 0.9) return 'bg-green-600 hover:bg-green-600'
  if (confidence >= 0.7) return 'bg-yellow-500 hover:bg-yellow-500'
  return 'bg-gray-500 hover:bg-gray-500'
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'High'
  if (confidence >= 0.7) return 'Medium'
  return 'Low'
}

function formatActionLabel(action: string): string {
  const actionLabels: Record<string, string> = {
    category_updated: 'Category Changed',
    status_updated: 'Status Changed',
    matched: 'Transaction Matched',
    unmatched: 'Match Removed',
    created: 'Created',
    updated: 'Updated',
  }
  return actionLabels[action] || action.replace(/_/g, ' ')
}

function formatAuditLogValues(
  action: string,
  oldValueJson: string | null,
  newValueJson: string | null
): string {
  try {
    const oldValue = oldValueJson ? JSON.parse(oldValueJson) : null
    const newValue = newValueJson ? JSON.parse(newValueJson) : null

    if (action === 'category_updated') {
      const oldCat = oldValue?.categoryName || 'None'
      const newCat = newValue?.categoryName || 'None'
      return `${oldCat} → ${newCat}`
    }

    if (action === 'status_updated') {
      const oldStatus = oldValue?.status || 'unknown'
      const newStatus = newValue?.status || 'unknown'
      return `${oldStatus} → ${newStatus}`
    }

    // Generic fallback for other actions
    if (oldValue && newValue) {
      return 'Values changed'
    } else if (newValue) {
      return 'Value set'
    } else if (oldValue) {
      return 'Value cleared'
    }

    return ''
  } catch {
    return ''
  }
}

export function TransactionDetailModal({
  transactionId,
  workspaceId,
  onClose,
  onViewMatchedTransaction,
  onCategoryUpdated,
}: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Category editing state
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [aiSuggestion, setAiSuggestion] = useState<{
    categoryId: string
    confidence: number
    reasoning: string
  } | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false)

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch transaction details
  useEffect(() => {
    if (!transactionId) {
      setTransaction(null)
      setError(null)
      setAiSuggestion(null)
      setSelectedCategoryId(null)
      setAuditLogs([])
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
          setSelectedCategoryId(result.transaction?.categoryId ?? null)
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

  // Fetch categories, AI suggestion, and audit logs when transaction is loaded
  useEffect(() => {
    if (!transactionId || !workspaceId) return

    // Fetch categories
    getWorkspaceCategories(workspaceId).then((result) => {
      if (result.categories) {
        setCategories(result.categories)
      }
    })

    // Fetch AI suggestion
    getAICategorySuggestion(transactionId, workspaceId).then((result) => {
      if (result.suggestion) {
        setAiSuggestion(result.suggestion)
      }
    })

    // Fetch audit logs (history)
    setIsLoadingHistory(true)
    getTransactionAuditLogs(transactionId, workspaceId)
      .then((result) => {
        if (result.auditLogs) {
          setAuditLogs(result.auditLogs)
        }
      })
      .finally(() => {
        setIsLoadingHistory(false)
      })
  }, [transactionId, workspaceId])

  const handleViewMatchedTransaction = (matchedTxnId: string) => {
    if (onViewMatchedTransaction) {
      onViewMatchedTransaction(matchedTxnId)
    }
  }

  const handleCategorySelect = async (categoryId: string | null) => {
    if (!transactionId || categoryId === selectedCategoryId) {
      setCategoryOpen(false)
      return
    }

    setIsUpdatingCategory(true)
    setSelectedCategoryId(categoryId)
    setCategoryOpen(false)

    try {
      const result = await updateTransactionCategory(transactionId, workspaceId, categoryId)

      if (result.success) {
        const categoryName = categoryId
          ? categories.find((c) => c.id === categoryId)?.name ?? 'Unknown'
          : 'None'
        toast.success(`Category updated to "${categoryName}"`)

        // Update local transaction state
        if (transaction) {
          const updatedCategory = categoryId
            ? categories.find((c) => c.id === categoryId)
            : null
          setTransaction({
            ...transaction,
            categoryId,
            category: updatedCategory
              ? {
                  ...updatedCategory,
                  workspaceId,
                  parentId: null,
                  createdAt: new Date(),
                }
              : null,
          })
        }

        // Refresh audit logs to show the new entry
        if (transactionId) {
          getTransactionAuditLogs(transactionId, workspaceId).then((logResult) => {
            if (logResult.auditLogs) {
              setAuditLogs(logResult.auditLogs)
            }
          })
        }

        onCategoryUpdated?.()
      } else {
        toast.error(result.error ?? 'Failed to update category')
        // Revert selection on error
        setSelectedCategoryId(transaction?.categoryId ?? null)
      }
    } catch {
      toast.error('Failed to update category')
      setSelectedCategoryId(transaction?.categoryId ?? null)
    } finally {
      setIsUpdatingCategory(false)
    }
  }

  const matchedTransaction = transaction?.bankMatches?.[0]?.qboTransaction ||
    transaction?.qboMatches?.[0]?.bankTransaction ||
    null

  const match = transaction?.bankMatches?.[0] || transaction?.qboMatches?.[0] || null

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null

  const suggestedCategory = aiSuggestion
    ? categories.find((c) => c.id === aiSuggestion.categoryId)
    : null

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

            {/* Category - Editable Dropdown */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Category
              </div>

              {/* AI Suggestion */}
              {aiSuggestion && suggestedCategory && (
                <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs text-purple-700 font-medium">
                      AI Suggestion
                    </span>
                    <Badge
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        getConfidenceBadgeColor(aiSuggestion.confidence)
                      )}
                    >
                      {getConfidenceLabel(aiSuggestion.confidence)} ({Math.round(aiSuggestion.confidence * 100)}%)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-800">
                      {suggestedCategory.name}
                      <span className="text-purple-600 ml-1 text-xs">
                        ({suggestedCategory.type})
                      </span>
                    </span>
                    {selectedCategoryId !== aiSuggestion.categoryId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                        onClick={() => handleCategorySelect(aiSuggestion.categoryId)}
                        disabled={isUpdatingCategory}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-purple-600 mt-1 italic">
                    {aiSuggestion.reasoning}
                  </div>
                </div>
              )}

              {/* Category Dropdown */}
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                    disabled={isUpdatingCategory}
                  >
                    {selectedCategory ? (
                      <span>
                        {selectedCategory.name}
                        <span className="text-muted-foreground ml-2">
                          ({selectedCategory.type})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select category...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={`${category.name} ${category.type}`}
                            onSelect={() => handleCategorySelect(category.id)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedCategoryId === category.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <span className="flex-1">{category.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {category.type}
                            </span>
                            {aiSuggestion?.categoryId === category.id && (
                              <Badge
                                className="ml-2 bg-purple-600 hover:bg-purple-600 text-[10px] px-1.5 py-0"
                              >
                                AI
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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

            {/* History / Audit Log */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  History
                </span>
              </div>

              {isLoadingHistory && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Loading history...
                </div>
              )}

              {!isLoadingHistory && auditLogs.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No history available
                </div>
              )}

              {!isLoadingHistory && auditLogs.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs bg-muted/50 rounded-md p-2 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground capitalize">
                          {formatActionLabel(log.action)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        by {log.user.name || log.user.email}
                      </div>
                      {(log.oldValue || log.newValue) && (
                        <div className="text-muted-foreground pt-1">
                          {formatAuditLogValues(log.action, log.oldValue, log.newValue)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
