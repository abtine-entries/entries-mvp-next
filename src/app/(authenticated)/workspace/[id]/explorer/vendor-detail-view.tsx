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
import { Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getVendorDetail, type VendorDetail } from './actions'

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

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

interface VendorDetailViewProps {
  vendorId: string
  workspaceId: string
}

export function VendorDetailView({ vendorId, workspaceId }: VendorDetailViewProps) {
  const [data, setData] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getVendorDetail(workspaceId, vendorId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [workspaceId, vendorId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Vendor not found.</p>
  }

  const activeSince = formatDate(data.firstSeen)
  const maxMonthly = data.monthlySpend.length > 0
    ? Math.max(...data.monthlySpend.map((m) => m.amount))
    : 0

  return (
    <div className="space-y-4">
      {/* Vendor header with icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
          <Store className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-medium">{data.name}</h3>
          {data.normalizedName !== data.name && (
            <p className="text-xs text-muted-foreground">{data.normalizedName}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <DetailField
          label="Total Spend"
          value={<span className="font-mono">{formatAmount(data.totalSpend)}</span>}
        />
        <DetailField label="Transactions" value={data.transactionCount.toLocaleString()} />
        <DetailField label="Active Since" value={activeSince} />
        <DetailField label="First Seen" value={formatDate(data.firstSeen)} />
        <DetailField label="Last Seen" value={formatDate(data.lastSeen)} />
      </div>

      {/* Monthly spending */}
      {data.monthlySpend.length > 0 && (
        <div className="pt-3 mt-1 border-t border-border">
          <h4 className="text-sm font-medium mb-3">Monthly Spending (Last 6 Months)</h4>
          <div className="space-y-2">
            {data.monthlySpend.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {formatMonth(m.month)}
                </span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded"
                    style={{
                      width: maxMonthly > 0 ? `${(m.amount / maxMonthly) * 100}%` : '0%',
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-24 text-right shrink-0">
                  {formatAmount(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
