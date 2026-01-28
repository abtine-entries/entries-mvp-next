'use client'

import { useState } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Sparkles } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import {
  categorizationColumns,
  type Transaction,
  type Category,
  type CategorizationTableMeta,
} from './columns'

interface CategorizationTableProps {
  transactions: Transaction[]
  categories: Category[]
}

export function CategorizationTable({
  transactions,
  categories,
}: CategorizationTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [categorizations, setCategorizations] = useState<Record<string, string>>({})

  const selectedCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  ).length

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
    const highConfidenceTxns = transactions.filter(
      (t) => t.confidence >= 0.9 && t.suggestedCategory
    )
    const newCategorizations = { ...categorizations }
    highConfidenceTxns.forEach((t) => {
      if (t.suggestedCategory) {
        newCategorizations[t.id] = t.suggestedCategory
      }
    })
    setCategorizations(newCategorizations)
  }

  const meta: CategorizationTableMeta = {
    categories,
    categorizations,
    onCategoryChange: handleCategoryChange,
    onAcceptSuggestion: handleAcceptSuggestion,
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} selected`
                : `${transactions.length} transactions`}
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
            <Button
              size="sm"
              disabled={Object.keys(categorizations).length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Save changes
            </Button>
          </div>
        </div>

        <DataTable
          columns={categorizationColumns}
          data={transactions}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => row.id}
          meta={meta}
          emptyMessage="No uncategorized transactions."
        />
      </CardContent>
    </Card>
  )
}
