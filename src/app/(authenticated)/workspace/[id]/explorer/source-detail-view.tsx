'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Landmark, RefreshCw, Unplug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSourceDetail, type SourceDetail } from './actions'

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

interface SourceDetailViewProps {
  sourceKey: string
  workspaceId: string
}

export function SourceDetailView({ sourceKey, workspaceId }: SourceDetailViewProps) {
  const [data, setData] = useState<SourceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSourceDetail(workspaceId, sourceKey)
      .then(setData)
      .finally(() => setLoading(false))
  }, [workspaceId, sourceKey])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Source not found.</p>
  }

  return (
    <div className="space-y-4">
      {/* Source header with icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-medium">{data.sourceName}</h3>
          <Badge variant="outline" className="text-xs capitalize mt-0.5">
            {sourceKey === 'qbo' ? 'QBO' : sourceKey}
          </Badge>
        </div>
      </div>

      {/* Action buttons (disabled placeholders) */}
      <div className="flex items-center gap-2">
        <span title="Coming soon">
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Re-sync
          </Button>
        </span>
        <span title="Coming soon">
          <Button variant="outline" size="sm" disabled>
            <Unplug className="h-3.5 w-3.5 mr-1.5" />
            Disconnect
          </Button>
        </span>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <DetailField label="Transactions" value={data.totalCount.toLocaleString()} />
        <DetailField
          label="Total Volume"
          value={<span className="font-mono">{formatAmount(data.totalVolume)}</span>}
        />
        {data.firstDate && (
          <DetailField label="First Transaction" value={formatDate(data.firstDate)} />
        )}
        {data.lastDate && (
          <DetailField label="Last Transaction" value={formatDate(data.lastDate)} />
        )}
        {data.firstDate && data.lastDate && (
          <DetailField
            label="Date Range"
            value={`${formatDate(data.firstDate)} — ${formatDate(data.lastDate)}`}
          />
        )}
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
