'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  Check,
  X,
  HelpCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  source: string
  suggestedCategory: string | null
  confidence: number
  reasoning: string
}

interface Category {
  id: string
  name: string
  type: string
}

interface CategorizationTableProps {
  transactions: Transaction[]
  categories: Category[]
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function CategorizationTable({
  transactions,
  categories,
}: CategorizationTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [categorizations, setCategorizations] = useState<Record<string, string>>({})

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const toggleAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map((t) => t.id)))
    }
  }

  const handleCategoryChange = (transactionId: string, categoryName: string) => {
    setCategorizations((prev) => ({
      ...prev,
      [transactionId]: categoryName,
    }))
  }

  const handleAcceptSuggestion = (transaction: Transaction) => {
    if (transaction.suggestedCategory) {
      handleCategoryChange(transaction.id, transaction.suggestedCategory)
    }
  }

  const handleAcceptAllHighConfidence = () => {
    const highConfidenceTxns = transactions.filter((t) => t.confidence >= 0.9 && t.suggestedCategory)
    const newCategorizations = { ...categorizations }
    highConfidenceTxns.forEach((t) => {
      if (t.suggestedCategory) {
        newCategorizations[t.id] = t.suggestedCategory
      }
    })
    setCategorizations(newCategorizations)
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selected` : `${transactions.length} transactions`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptAllHighConfidence}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Accept all high confidence
            </Button>
            <Button size="sm" disabled={Object.keys(categorizations).length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Save changes
            </Button>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[40px_80px_1fr_120px_150px_150px_80px] gap-4 px-4 py-3 border-b border-border text-sm text-muted-foreground">
          <div className="flex items-center">
            <Checkbox
              checked={selected.size === transactions.length && transactions.length > 0}
              onCheckedChange={toggleAll}
            />
          </div>
          <div>Date</div>
          <div>Description</div>
          <div className="text-right">Amount</div>
          <div>AI Suggestion</div>
          <div>Category</div>
          <div></div>
        </div>

        {/* Transaction rows */}
        <div className="divide-y divide-border">
          {transactions.map((transaction) => {
            const currentCategory = categorizations[transaction.id] || ''
            const isAccepted = currentCategory === transaction.suggestedCategory

            return (
              <div
                key={transaction.id}
                className="grid grid-cols-[40px_80px_1fr_120px_150px_150px_80px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={selected.has(transaction.id)}
                    onCheckedChange={() => toggleSelection(transaction.id)}
                  />
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {formatDate(transaction.date)}
                </div>
                <div className="flex items-center text-sm truncate">
                  {transaction.description}
                </div>
                <div
                  className={cn(
                    'flex items-center justify-end text-sm font-mono',
                    transaction.amount < 0 ? 'text-red-400' : 'text-green-400'
                  )}
                >
                  {formatAmount(transaction.amount)}
                </div>
                <div className="flex items-center">
                  {transaction.suggestedCategory ? (
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
                  ) : (
                    <ConfidenceIndicator confidence={0} />
                  )}
                </div>
                <div className="flex items-center">
                  <Select
                    value={currentCategory}
                    onValueChange={(value) =>
                      handleCategoryChange(transaction.id, value)
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {transaction.suggestedCategory && !isAccepted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleAcceptSuggestion(transaction)}
                      title="Accept suggestion"
                    >
                      <Check className="h-4 w-4 text-green-400" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
