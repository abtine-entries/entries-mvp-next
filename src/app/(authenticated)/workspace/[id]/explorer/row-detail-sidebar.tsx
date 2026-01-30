'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ExplorerTransaction,
  ExplorerVendor,
  ExplorerCategory,
  ExplorerEvent,
  VendorRecentTransaction,
} from './actions'
import { getVendorRecentTransactions } from './actions'

// --- Shared formatting helpers ---

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// --- Field row for key-value display ---

function DetailField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0', className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

// --- Transaction detail ---

function TransactionDetail({ transaction }: { transaction: ExplorerTransaction }) {
  return (
    <div className="space-y-1">
      <DetailField label="Date" value={formatDate(transaction.date)} />
      <DetailField label="Description" value={transaction.description} />
      <DetailField
        label="Amount"
        value={
          <span
            className={cn(
              'font-mono font-medium',
              transaction.amount < 0 ? 'text-red-400' : 'text-green-400'
            )}
          >
            {formatAmount(transaction.amount)}
          </span>
        }
      />
      <DetailField
        label="Category"
        value={
          transaction.categoryName ? (
            <span className="flex items-center gap-1.5">
              {transaction.categoryName}
              {transaction.aiReasoning && (
                <Bot className="h-3.5 w-3.5 text-primary" />
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        }
      />
      <DetailField label="Vendor" value={transaction.vendorName ?? <span className="text-muted-foreground">—</span>} />
      <DetailField
        label="Source"
        value={
          <Badge variant="outline" className="text-xs capitalize">
            {transaction.source === 'qbo' ? 'QBO' : transaction.source}
          </Badge>
        }
      />
      <DetailField
        label="Status"
        value={
          <Badge
            variant={
              transaction.status === 'matched'
                ? 'success'
                : transaction.status === 'pending'
                  ? 'warning'
                  : 'outline'
            }
            className="text-xs capitalize"
          >
            {transaction.status}
          </Badge>
        }
      />
      {transaction.externalId && (
        <DetailField
          label="External ID"
          value={<span className="font-mono text-xs">{transaction.externalId}</span>}
        />
      )}
      {transaction.confidence != null && (
        <DetailField
          label="Confidence"
          value={`${Math.round(transaction.confidence * 100)}%`}
        />
      )}
      {transaction.aiReasoning && (
        <div className="pt-3 mt-1 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium">AI Reasoning</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{transaction.aiReasoning}</p>
        </div>
      )}
      <DetailField label="Created" value={formatDateTime(transaction.createdAt)} />
    </div>
  )
}

// --- Vendor detail with recent transactions ---

function VendorDetail({ vendor }: { vendor: ExplorerVendor }) {
  const [recentTransactions, setRecentTransactions] = useState<VendorRecentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getVendorRecentTransactions(vendor.id)
      .then(setRecentTransactions)
      .finally(() => setLoading(false))
  }, [vendor.id])

  return (
    <div className="space-y-1">
      <DetailField label="Name" value={<span className="font-medium">{vendor.name}</span>} />
      <DetailField
        label="Total Spend"
        value={<span className="font-mono">{formatAmount(vendor.totalSpend)}</span>}
      />
      <DetailField label="Transactions" value={vendor.transactionCount} />
      <DetailField label="First Seen" value={formatDate(vendor.firstSeen)} />
      <DetailField label="Last Seen" value={formatDate(vendor.lastSeen)} />

      <div className="pt-3 mt-1 border-t border-border">
        <h4 className="text-sm font-medium mb-3">Recent Transactions</h4>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : recentTransactions.length === 0 ? (
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
                {recentTransactions.map((t) => (
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

// --- Category detail ---

function CategoryDetail({ category }: { category: ExplorerCategory }) {
  return (
    <div className="space-y-1">
      <DetailField label="Name" value={<span className="font-medium">{category.name}</span>} />
      <DetailField
        label="Type"
        value={
          <Badge variant="outline" className="text-xs capitalize">
            {category.type}
          </Badge>
        }
      />
      <DetailField label="Transactions" value={category.transactionCount} />
    </div>
  )
}

// --- Event detail ---

function EventDetail({ event }: { event: ExplorerEvent }) {
  return (
    <div className="space-y-1">
      <DetailField label="Title" value={event.title} />
      <DetailField
        label="Entity Type"
        value={
          <Badge variant="outline" className="text-xs capitalize">
            {event.entityType.replace('_', ' ')}
          </Badge>
        }
      />
      <DetailField label="Created At" value={formatDateTime(event.createdAt)} />
    </div>
  )
}

// --- Main sidebar component ---

export type DetailItem =
  | { tab: 'transactions'; data: ExplorerTransaction }
  | { tab: 'vendors'; data: ExplorerVendor }
  | { tab: 'categories'; data: ExplorerCategory }
  | { tab: 'events'; data: ExplorerEvent }

interface RowDetailSidebarProps {
  item: DetailItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getTitle(item: DetailItem): string {
  switch (item.tab) {
    case 'transactions':
      return item.data.description
    case 'vendors':
      return item.data.name
    case 'categories':
      return item.data.name
    case 'events':
      return item.data.title
  }
}

function getDescription(item: DetailItem): string {
  switch (item.tab) {
    case 'transactions':
      return 'Transaction Details'
    case 'vendors':
      return 'Vendor Details'
    case 'categories':
      return 'Category Details'
    case 'events':
      return 'Event Details'
  }
}

export function RowDetailSidebar({ item, open, onOpenChange }: RowDetailSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        {item && (
          <>
            <SheetHeader>
              <SheetDescription>{getDescription(item)}</SheetDescription>
              <SheetTitle className="text-lg leading-snug pr-6">{getTitle(item)}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              {item.tab === 'transactions' && <TransactionDetail transaction={item.data} />}
              {item.tab === 'vendors' && <VendorDetail vendor={item.data} />}
              {item.tab === 'categories' && <CategoryDetail category={item.data} />}
              {item.tab === 'events' && <EventDetail event={item.data} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
