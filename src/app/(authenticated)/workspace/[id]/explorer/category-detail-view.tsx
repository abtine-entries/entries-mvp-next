'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FolderTree } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryDetail, type CategoryDetail } from './actions'

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

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

interface CategoryDetailViewProps {
  categoryId: string
  workspaceId: string
}

export function CategoryDetailView({ categoryId, workspaceId }: CategoryDetailViewProps) {
  const [data, setData] = useState<CategoryDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCategoryDetail(workspaceId, categoryId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [workspaceId, categoryId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Category not found.</p>
  }

  return (
    <div className="space-y-4">
      {/* Category header with icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-medium">{data.name}</h3>
          {data.parentName && (
            <p className="text-xs text-muted-foreground">Parent: {data.parentName}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <DetailField
          label="Type"
          value={
            <Badge variant="outline" className="text-xs capitalize">
              {data.type}
            </Badge>
          }
        />
        <DetailField label="Transactions" value={data.transactionCount.toLocaleString()} />
        <DetailField
          label="Total Amount"
          value={<span className="font-mono">{formatAmount(data.totalAmount)}</span>}
        />
      </div>

      {/* Recent transactions table */}
      <div className="pt-3 mt-1 border-t border-border">
        <h4 className="text-sm font-medium mb-3">Recent Transactions</h4>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">
                      {t.description}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-xs text-right font-mono',
                        t.amount < 0 ? 'text-red-400' : 'text-green-400'
                      )}
                    >
                      {formatAmount(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
