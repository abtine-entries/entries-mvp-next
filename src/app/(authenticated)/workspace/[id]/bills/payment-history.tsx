'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SerializedBatchPayment } from './actions'

const statusVariant: Record<string, 'secondary' | 'info' | 'success' | 'error'> = {
  draft: 'secondary',
  submitted: 'info',
  processing: 'info',
  completed: 'success',
  failed: 'error',
}

function getMethodLabel(bp: SerializedBatchPayment): string {
  if (bp.wiseTransferId) return 'Wise Transfer'
  if (bp.fileExportPath) return 'CSV Export'
  return 'Unknown'
}

interface PaymentHistoryProps {
  batchPayments: SerializedBatchPayment[]
}

export function PaymentHistory({ batchPayments }: PaymentHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Payment History</h2>
      {batchPayments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No batch payments yet</p>
      ) : (
        <div className="space-y-2">
          {batchPayments.map((bp) => {
            const isExpanded = expandedIds.has(bp.id)
            return (
              <div key={bp.id} className="rounded-lg border">
                <button
                  type="button"
                  className="flex items-center gap-3 w-full p-4 text-left text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(bp.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">
                    {new Date(bp.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    {bp.totalAmount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: bp.currency,
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {bp.items.length} recipient{bp.items.length !== 1 ? 's' : ''}
                  </span>
                  <Badge variant={statusVariant[bp.status] ?? 'secondary'}>
                    {bp.status.charAt(0).toUpperCase() + bp.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {getMethodLabel(bp)}
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-2">
                    {bp.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="font-medium">{item.vendorName}</span>
                          <span className="text-muted-foreground ml-2">
                            {item.invoiceNumber}
                          </span>
                        </div>
                        <span className="font-medium">
                          {item.amount.toLocaleString('en-US', {
                            style: 'currency',
                            currency: item.currency,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
