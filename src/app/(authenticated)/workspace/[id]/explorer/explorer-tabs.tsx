'use client'

import { useState, useMemo, useCallback, Suspense, useTransition } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import {
  getTransactionColumns,
  getVendorColumns,
  getCategoryColumns,
  eventColumns,
} from './columns'
import { RowDetailSidebar, type DetailItem } from './row-detail-sidebar'
import { EntityDetailSidebar } from '@/components/ui/entity-detail-sidebar'
import { SourceDetailView } from './source-detail-view'
import { VendorDetailView } from './vendor-detail-view'
import { CategoryDetailView } from './category-detail-view'
import { DocumentDetailView } from '../docs/document-detail-view'
import { AddRelationColumnButton } from '@/components/ui/add-relation-column-button'
import { buildRelationColumns } from '@/components/ui/relation-column-utils'
import type { ExplorerData, ExplorerTransaction, ExplorerVendor, ExplorerCategory, ExplorerEvent } from './actions'
import { updateTransactionCategory } from './actions'
import type { RelationColumnRecord, RelationLinksMap } from './relation-actions'
import { BillsTable } from '../bills/bills-table'
import { PaymentHistory } from '../bills/payment-history'
import type { SerializedBill, SerializedBatchPayment } from '../bills/actions'

const PAGE_SIZE = 25

// --- Date range helpers ---
function getDateRangeStart(range: string): Date | null {
  const now = new Date()
  switch (range) {
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return d
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    default:
      return null
  }
}

// --- Format helpers ---
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

// --- General Ledger Table ---
interface GeneralLedgerRow {
  id: string
  date: string
  description: string
  categoryName: string | null
  categoryId: string | null
  debit: number | null
  credit: number | null
  balance: number
}

function buildGeneralLedgerRows(transactions: ExplorerTransaction[]): GeneralLedgerRow[] {
  // Sort by date ascending for running balance calculation
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let runningBalance = 0
  const rows: GeneralLedgerRow[] = []

  for (const t of sorted) {
    // Positive amounts are credits (money in), negative are debits (money out)
    const isDebit = t.amount < 0
    const absAmount = Math.abs(t.amount)

    runningBalance += t.amount

    rows.push({
      id: t.id,
      date: t.date,
      description: t.description,
      categoryName: t.categoryName,
      categoryId: t.categoryId,
      debit: isDebit ? absAmount : null,
      credit: !isDebit ? absAmount : null,
      balance: runningBalance,
    })
  }

  // Reverse to show most recent first
  return rows.reverse()
}

function GeneralLedgerTable({
  transactions,
  onCategoryClick,
  onRowClick,
}: {
  transactions: ExplorerTransaction[]
  onCategoryClick?: (categoryId: string) => void
  onRowClick?: (transaction: ExplorerTransaction) => void
}) {
  const rows = useMemo(() => buildGeneralLedgerRows(transactions), [transactions])

  // Calculate totals
  const totals = useMemo(() => {
    let totalDebit = 0
    let totalCredit = 0
    for (const row of rows) {
      if (row.debit) totalDebit += row.debit
      if (row.credit) totalCredit += row.credit
    }
    return { totalDebit, totalCredit }
  }, [rows])

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          {transactions.length} entries
        </span>
        <span className="text-red-400">
          Debits: {formatAmount(totals.totalDebit)}
        </span>
        <span className="text-green-400">
          Credits: {formatAmount(totals.totalCredit)}
        </span>
        <span className={totals.totalCredit - totals.totalDebit >= 0 ? 'text-green-400' : 'text-red-400'}>
          Net: {formatAmount(totals.totalCredit - totals.totalDebit)}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[140px]">Account</TableHead>
            <TableHead className="text-right w-[120px]">Debit</TableHead>
            <TableHead className="text-right w-[120px]">Credit</TableHead>
            <TableHead className="text-right w-[130px]">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => {
                  if (onRowClick) {
                    const original = transactions.find((t) => t.id === row.id)
                    if (original) onRowClick(original)
                  }
                }}
              >
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(row.date)}
                </TableCell>
                <TableCell className="text-sm truncate max-w-[250px]">
                  {row.description}
                </TableCell>
                <TableCell>
                  {row.categoryName ? (
                    onCategoryClick && row.categoryId ? (
                      <button
                        className="text-sm hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCategoryClick(row.categoryId!)
                        }}
                      >
                        {row.categoryName}
                      </button>
                    ) : (
                      <span className="text-sm">{row.categoryName}</span>
                    )
                  ) : (
                    <span className="text-sm text-yellow-400">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm font-mono text-red-400">
                  {row.debit ? formatAmount(row.debit) : ''}
                </TableCell>
                <TableCell className="text-right text-sm font-mono text-green-400">
                  {row.credit ? formatAmount(row.credit) : ''}
                </TableCell>
                <TableCell className={`text-right text-sm font-mono ${row.balance >= 0 ? 'text-foreground' : 'text-red-400'}`}>
                  {formatAmount(row.balance)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No entries found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// --- Chart of Accounts Table ---
interface ChartOfAccountsRow {
  id: string
  name: string
  type: string
  depth: number
  transactionCount: number
  totalAmount: number
  isTypeHeader?: boolean
}

function buildChartOfAccountsRows(
  categories: ExplorerCategory[],
  transactions: ExplorerTransaction[]
): ChartOfAccountsRow[] {
  // Compute totalAmount per category from transactions
  const amountByCategory: Record<string, number> = {}
  for (const t of transactions) {
    if (t.categoryId) {
      amountByCategory[t.categoryId] = (amountByCategory[t.categoryId] ?? 0) + Math.abs(t.amount)
    }
  }

  // Group by type
  const typeOrder = ['expense', 'income', 'asset', 'liability']
  const typeLabels: Record<string, string> = {
    expense: 'Expenses',
    income: 'Income',
    asset: 'Assets',
    liability: 'Liabilities',
  }

  const grouped: Record<string, ExplorerCategory[]> = {}
  for (const c of categories) {
    if (!grouped[c.type]) grouped[c.type] = []
    grouped[c.type].push(c)
  }

  // Sort categories within each group
  for (const type of Object.keys(grouped)) {
    grouped[type].sort((a, b) => a.name.localeCompare(b.name))
  }

  // Build flat rows with type headers
  const rows: ChartOfAccountsRow[] = []
  for (const type of typeOrder) {
    const items = grouped[type]
    if (!items || items.length === 0) continue

    // Calculate type total
    const typeTotal = items.reduce((sum, c) => sum + (amountByCategory[c.id] ?? 0), 0)

    // Add type header row
    rows.push({
      id: `header-${type}`,
      name: typeLabels[type] ?? type,
      type,
      depth: 0,
      transactionCount: items.reduce((sum, c) => sum + c.transactionCount, 0),
      totalAmount: typeTotal,
      isTypeHeader: true,
    })

    // Add category rows
    for (const c of items) {
      rows.push({
        id: c.id,
        name: c.name,
        type: c.type,
        depth: 1,
        transactionCount: c.transactionCount,
        totalAmount: amountByCategory[c.id] ?? 0,
      })
    }
  }

  return rows
}

function ChartOfAccountsTable({
  categories,
  transactions,
  onCategoryClick,
}: {
  categories: ExplorerCategory[]
  transactions: ExplorerTransaction[]
  onCategoryClick?: (categoryId: string) => void
}) {
  const rows = useMemo(
    () => buildChartOfAccountsRows(categories, transactions),
    [categories, transactions]
  )

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right w-[120px]">Transactions</TableHead>
            <TableHead className="text-right w-[140px]">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={row.isTypeHeader ? 'bg-muted/50 font-semibold' : 'hover:bg-muted/30'}
              >
                <TableCell
                  style={{ paddingLeft: row.isTypeHeader ? undefined : `${16 + row.depth * 20}px` }}
                >
                  {row.isTypeHeader ? (
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {row.name}
                    </span>
                  ) : onCategoryClick ? (
                    <button
                      className="text-sm hover:underline cursor-pointer text-left"
                      onClick={() => onCategoryClick(row.id)}
                    >
                      {row.name}
                    </button>
                  ) : (
                    <span className="text-sm">{row.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {row.transactionCount > 0 ? row.transactionCount : '—'}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {row.totalAmount > 0 ? formatAmount(row.totalAmount) : '—'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                No accounts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// --- Generic PaginatedTable with filtering ---
interface PaginatedTableProps<TData extends RowData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage: string
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  onRowClick?: (row: TData) => void
  headerExtra?: React.ReactNode
}

function PaginatedTable<TData extends RowData>({
  columns,
  data,
  emptyMessage,
  globalFilter,
  onGlobalFilterChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  onRowClick,
  headerExtra,
}: PaginatedTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSortingChange(next)
    },
    onGlobalFilterChange,
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnFilters) : updater
      onColumnFiltersChange(next)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
    },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex
  const filteredCount = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width:
                      header.getSize() !== 150
                        ? header.getSize()
                        : undefined,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
              {headerExtra && (
                <TableHead style={{ width: 40 }}>{headerExtra}</TableHead>
              )}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50 group/row' : 'group/row'}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width:
                        cell.column.getSize() !== 150
                          ? cell.column.getSize()
                          : undefined,
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
                {headerExtra && <TableCell />}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (headerExtra ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage + 1} of {pageCount} ({filteredCount} of {data.length} rows)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Filter bar ---
interface FilterBarProps {
  tab: string
  searchQuery: string
  onSearchChange: (value: string) => void
  dateRange: string
  onDateRangeChange: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
  activeFilterCount: number
}

function FilterBar({
  tab,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  source,
  onSourceChange,
  activeFilterCount,
}: FilterBarProps) {
  const hasDateColumn = tab === 'transactions' || tab === 'vendors' || tab === 'events'
  const hasSourceFilter = tab === 'transactions'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search rows..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8"
        />
      </div>

      {hasDateColumn && (
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      )}

      {hasSourceFilter && (
        <Select value={source} onValueChange={onSourceChange}>
          <SelectTrigger size="sm" className="w-[100px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="qbo">QBO</SelectItem>
          </SelectContent>
        </Select>
      )}

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {activeFilterCount} active
          </Badge>
        </div>
      )}
    </div>
  )
}

// --- Main ExplorerTabs wrapper ---
interface ExplorerTabsProps {
  data: ExplorerData
  bills: SerializedBill[]
  batchPayments: SerializedBatchPayment[]
  workspaceId: string
  relationColumnsByTable: Record<string, RelationColumnRecord[]>
  relationLinksMapByTable: Record<string, Record<string, RelationLinksMap>>
}

export function ExplorerTabs(props: ExplorerTabsProps) {
  return (
    <Suspense fallback={null}>
      <ExplorerTabsInner {...props} />
    </Suspense>
  )
}

function ExplorerTabsInner({ data, bills, batchPayments, workspaceId, relationColumnsByTable, relationLinksMapByTable }: ExplorerTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Read initial state from URL
  const initialTab = searchParams.get('tab') ?? 'transactions'
  const initialSearch = searchParams.get('q') ?? ''
  const initialDateRange = searchParams.get('dateRange') ?? 'all'
  const initialSource = searchParams.get('source') ?? 'all'
  const initialSortId = searchParams.get('sortBy') ?? ''
  const initialSortDesc = searchParams.get('sortDesc') === 'true'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [dateRange, setDateRange] = useState(initialDateRange)
  const [source, setSource] = useState(initialSource)
  const [sorting, setSorting] = useState<SortingState>(
    initialSortId ? [{ id: initialSortId, desc: initialSortDesc }] : []
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sidebarItem, setSidebarItem] = useState<DetailItem | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sourceKey, setSourceKey] = useState<string | null>(null)
  const [sourceSidebarOpen, setSourceSidebarOpen] = useState(false)
  const [vendorSidebarId, setVendorSidebarId] = useState<string | null>(null)
  const [vendorSidebarOpen, setVendorSidebarOpen] = useState(false)
  const [categorySidebarId, setCategorySidebarId] = useState<string | null>(null)
  const [categorySidebarOpen, setCategorySidebarOpen] = useState(false)
  const [documentSidebarId, setDocumentSidebarId] = useState<string | null>(null)
  const [documentSidebarOpen, setDocumentSidebarOpen] = useState(false)

  // Optimistic category overrides
  const [isPending, startTransition] = useTransition()
  const [categoryOverrides, setCategoryOverrides] = useState<
    Record<string, { categoryId: string | null; categoryName: string | null }>
  >({})

  // URL update helper
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (
          value === '' ||
          value === 'all' ||
          (key === 'tab' && value === 'transactions') ||
          (key === 'sortDesc' && value === 'false')
        ) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Tab change handler
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab)
      // Reset tab-specific filters
      setSource('all')
      setDateRange('all')
      setSearchQuery('')
      setSorting([])
      setColumnFilters([])
      // Clear all filter params, just set tab
      const params = new URLSearchParams()
      if (tab !== 'transactions') {
        params.set('tab', tab)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  // Filter change handlers that update both state and URL
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      updateParams({ q: value })
    },
    [updateParams]
  )

  const handleDateRangeChange = useCallback(
    (value: string) => {
      setDateRange(value)
      updateParams({ dateRange: value })
    },
    [updateParams]
  )

  const handleSourceChange = useCallback(
    (value: string) => {
      setSource(value)
      updateParams({ source: value })
    },
    [updateParams]
  )

  const handleSortingChange = useCallback(
    (next: SortingState) => {
      setSorting(next)
      if (next.length > 0) {
        updateParams({ sortBy: next[0].id, sortDesc: String(next[0].desc) })
      } else {
        updateParams({ sortBy: '', sortDesc: '' })
      }
    },
    [updateParams]
  )

  // Count active filters (excluding default values)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (dateRange !== 'all') count++
    if (source !== 'all') count++
    return count
  }, [searchQuery, dateRange, source])

  // Apply category overrides to transactions
  const transactionsWithOverrides = useMemo(() => {
    return data.transactions.map((t) => {
      const override = categoryOverrides[t.id]
      if (override) {
        return {
          ...t,
          categoryId: override.categoryId,
          categoryName: override.categoryName,
        }
      }
      return t
    })
  }, [data.transactions, categoryOverrides])

  // Apply client-side date range filtering
  const filteredTransactions = useMemo(() => {
    let filtered = transactionsWithOverrides
    const rangeStart = getDateRangeStart(dateRange)
    if (rangeStart) {
      filtered = filtered.filter(
        (t) => new Date(t.date) >= rangeStart
      )
    }
    if (source !== 'all') {
      filtered = filtered.filter((t) => t.source === source)
    }
    return filtered
  }, [transactionsWithOverrides, dateRange, source])

  const filteredVendors = useMemo(() => {
    if (dateRange === 'all') return data.vendors
    const rangeStart = getDateRangeStart(dateRange)
    if (!rangeStart) return data.vendors
    return data.vendors.filter(
      (v) => new Date(v.lastSeen) >= rangeStart
    )
  }, [data.vendors, dateRange])

  const filteredEvents = useMemo(() => {
    if (dateRange === 'all') return data.events
    const rangeStart = getDateRangeStart(dateRange)
    if (!rangeStart) return data.events
    return data.events.filter(
      (e) => new Date(e.createdAt) >= rangeStart
    )
  }, [data.events, dateRange])

  const tabs = useMemo(
    () => [
      {
        value: 'transactions',
        label: `Transactions (${filteredTransactions.length})`,
      },
      { value: 'vendors', label: `Vendors (${filteredVendors.length})` },
      {
        value: 'categories',
        label: `Categories (${data.categories.length})`,
      },
      { value: 'general-ledger', label: 'General Ledger' },
      { value: 'chart-of-accounts', label: 'Chart of Accounts' },
      { value: 'events', label: `Events (${filteredEvents.length})` },
      { value: 'bills', label: `Bills (${bills.length})` },
    ],
    [filteredTransactions.length, filteredVendors.length, data.categories.length, filteredEvents.length, bills.length]
  )

  const handleSourceClick = useCallback((key: string) => {
    setSourceKey(key)
    setSourceSidebarOpen(true)
  }, [])

  const handleVendorClick = useCallback((vendorId: string) => {
    setVendorSidebarId(vendorId)
    setVendorSidebarOpen(true)
  }, [])

  const handleCategoryClick = useCallback((categoryId: string) => {
    setCategorySidebarId(categoryId)
    setCategorySidebarOpen(true)
  }, [])

  const handleDocumentClick = useCallback((documentId: string) => {
    setDocumentSidebarId(documentId)
    setDocumentSidebarOpen(true)
  }, [])

  // Handle category change with optimistic update
  const handleCategoryChange = useCallback(
    (transactionId: string, categoryId: string | null, categoryName: string | null) => {
      // Optimistic update
      setCategoryOverrides((prev) => ({
        ...prev,
        [transactionId]: { categoryId, categoryName },
      }))

      // Call server action
      startTransition(async () => {
        try {
          await updateTransactionCategory(transactionId, categoryId, workspaceId)
          toast.success(
            categoryName
              ? `Category changed to "${categoryName}"`
              : 'Category removed'
          )
        } catch {
          // Revert optimistic update on error
          setCategoryOverrides((prev) => {
            const next = { ...prev }
            delete next[transactionId]
            return next
          })
          toast.error('Failed to update category')
        }
      })
    },
    [workspaceId, startTransition]
  )

  const txColumns = useMemo(
    () => getTransactionColumns({
      onSourceClick: handleSourceClick,
      onCategoryClick: handleCategoryClick,
      categories: data.categories,
      onCategoryChange: handleCategoryChange,
    }),
    [handleSourceClick, handleCategoryClick, data.categories, handleCategoryChange]
  )

  const vndrColumns = useMemo(
    () => getVendorColumns(handleVendorClick),
    [handleVendorClick]
  )

  const catColumns = useMemo(
    () => getCategoryColumns(handleCategoryClick),
    [handleCategoryClick]
  )

  const handleRelationEntityClick = useCallback((targetTable: string, entityId: string) => {
    switch (targetTable) {
      case 'vendors':
        handleVendorClick(entityId)
        break
      case 'categories':
        handleCategoryClick(entityId)
        break
      case 'documents':
        handleDocumentClick(entityId)
        break
    }
  }, [handleVendorClick, handleCategoryClick, handleDocumentClick])

  // Build dynamic relation columns per table
  const txRelCols = relationColumnsByTable['transactions'] ?? []
  const txRelLinksMap = relationLinksMapByTable['transactions'] ?? {}
  const dynamicTxRelationColumns = useMemo(
    () => buildRelationColumns<ExplorerTransaction>(txRelCols, txRelLinksMap, workspaceId, handleRelationEntityClick),
    [txRelCols, txRelLinksMap, workspaceId, handleRelationEntityClick]
  )

  const vendorRelCols = relationColumnsByTable['vendors'] ?? []
  const vendorRelLinksMap = relationLinksMapByTable['vendors'] ?? {}
  const dynamicVendorRelationColumns = useMemo(
    () => buildRelationColumns<ExplorerVendor>(vendorRelCols, vendorRelLinksMap, workspaceId, handleRelationEntityClick),
    [vendorRelCols, vendorRelLinksMap, workspaceId, handleRelationEntityClick]
  )

  const catRelCols = relationColumnsByTable['categories'] ?? []
  const catRelLinksMap = relationLinksMapByTable['categories'] ?? {}
  const dynamicCatRelationColumns = useMemo(
    () => buildRelationColumns<ExplorerCategory>(catRelCols, catRelLinksMap, workspaceId, handleRelationEntityClick),
    [catRelCols, catRelLinksMap, workspaceId, handleRelationEntityClick]
  )

  const eventRelCols = relationColumnsByTable['events'] ?? []
  const eventRelLinksMap = relationLinksMapByTable['events'] ?? {}
  const dynamicEventRelationColumns = useMemo(
    () => buildRelationColumns<ExplorerEvent>(eventRelCols, eventRelLinksMap, workspaceId, handleRelationEntityClick),
    [eventRelCols, eventRelLinksMap, workspaceId, handleRelationEntityClick]
  )

  const mergedTxColumns = useMemo(
    () => [...txColumns, ...dynamicTxRelationColumns],
    [txColumns, dynamicTxRelationColumns]
  )

  const mergedVndrColumns = useMemo(
    () => [...vndrColumns, ...dynamicVendorRelationColumns],
    [vndrColumns, dynamicVendorRelationColumns]
  )

  const mergedCatColumns = useMemo(
    () => [...catColumns, ...dynamicCatRelationColumns],
    [catColumns, dynamicCatRelationColumns]
  )

  const mergedEventColumns = useMemo(
    () => [...eventColumns, ...dynamicEventRelationColumns],
    [dynamicEventRelationColumns]
  )

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {activeTab !== 'bills' && (
        <FilterBar
          tab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          source={source}
          onSourceChange={handleSourceChange}
          activeFilterCount={activeFilterCount}
        />
      )}

      <TabsContent value="transactions">
        <PaginatedTable
          columns={mergedTxColumns}
          data={filteredTransactions}
          emptyMessage="No transactions found."
          globalFilter={searchQuery}
          onGlobalFilterChange={handleSearchChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onRowClick={(row) => {
            setSidebarItem({ tab: 'transactions', data: row })
            setSidebarOpen(true)
          }}
          headerExtra={
            <AddRelationColumnButton
              workspaceId={workspaceId}
              sourceTable="transactions"
            />
          }
        />
      </TabsContent>

      <TabsContent value="vendors">
        <PaginatedTable
          columns={mergedVndrColumns}
          data={filteredVendors}
          emptyMessage="No vendors found."
          globalFilter={searchQuery}
          onGlobalFilterChange={handleSearchChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onRowClick={(row) => {
            setSidebarItem({ tab: 'vendors', data: row })
            setSidebarOpen(true)
          }}
          headerExtra={
            <AddRelationColumnButton
              workspaceId={workspaceId}
              sourceTable="vendors"
            />
          }
        />
      </TabsContent>

      <TabsContent value="categories">
        <PaginatedTable
          columns={mergedCatColumns}
          data={data.categories}
          emptyMessage="No categories found."
          globalFilter={searchQuery}
          onGlobalFilterChange={handleSearchChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onRowClick={(row) => {
            setSidebarItem({ tab: 'categories', data: row })
            setSidebarOpen(true)
          }}
          headerExtra={
            <AddRelationColumnButton
              workspaceId={workspaceId}
              sourceTable="categories"
            />
          }
        />
      </TabsContent>

      <TabsContent value="general-ledger">
        <GeneralLedgerTable
          transactions={filteredTransactions}
          onCategoryClick={handleCategoryClick}
          onRowClick={(row) => {
            setSidebarItem({ tab: 'transactions', data: row })
            setSidebarOpen(true)
          }}
        />
      </TabsContent>

      <TabsContent value="chart-of-accounts">
        <ChartOfAccountsTable
          categories={data.categories}
          transactions={filteredTransactions}
          onCategoryClick={handleCategoryClick}
        />
      </TabsContent>

      <TabsContent value="events">
        <PaginatedTable
          columns={mergedEventColumns}
          data={filteredEvents}
          emptyMessage="No events found."
          globalFilter={searchQuery}
          onGlobalFilterChange={handleSearchChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onRowClick={(row) => {
            setSidebarItem({ tab: 'events', data: row })
            setSidebarOpen(true)
          }}
          headerExtra={
            <AddRelationColumnButton
              workspaceId={workspaceId}
              sourceTable="events"
            />
          }
        />
      </TabsContent>

      <TabsContent value="bills">
        <div className="space-y-8">
          <BillsTable
            bills={bills}
            workspaceId={workspaceId}
            onRowClick={(bill) => {
              setSidebarItem({ tab: 'bills', data: bill })
              setSidebarOpen(true)
            }}
          />
          <PaymentHistory batchPayments={batchPayments} />
        </div>
      </TabsContent>

      <RowDetailSidebar
        item={sidebarItem}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <EntityDetailSidebar
        open={sourceSidebarOpen}
        onOpenChange={setSourceSidebarOpen}
        entityType="source"
        entityId={sourceKey ?? ''}
        workspaceId={workspaceId}
      >
        {sourceKey && (
          <SourceDetailView sourceKey={sourceKey} workspaceId={workspaceId} />
        )}
      </EntityDetailSidebar>

      <EntityDetailSidebar
        open={vendorSidebarOpen}
        onOpenChange={setVendorSidebarOpen}
        entityType="vendor"
        entityId={vendorSidebarId ?? ''}
        workspaceId={workspaceId}
      >
        {vendorSidebarId && (
          <VendorDetailView vendorId={vendorSidebarId} workspaceId={workspaceId} />
        )}
      </EntityDetailSidebar>

      <EntityDetailSidebar
        open={categorySidebarOpen}
        onOpenChange={setCategorySidebarOpen}
        entityType="category"
        entityId={categorySidebarId ?? ''}
        workspaceId={workspaceId}
      >
        {categorySidebarId && (
          <CategoryDetailView categoryId={categorySidebarId} workspaceId={workspaceId} />
        )}
      </EntityDetailSidebar>

      <EntityDetailSidebar
        open={documentSidebarOpen}
        onOpenChange={setDocumentSidebarOpen}
        entityType="document"
        entityId={documentSidebarId ?? ''}
        workspaceId={workspaceId}
      >
        {documentSidebarId && (
          <DocumentDetailView documentId={documentSidebarId} workspaceId={workspaceId} />
        )}
      </EntityDetailSidebar>
    </Tabs>
  )
}
