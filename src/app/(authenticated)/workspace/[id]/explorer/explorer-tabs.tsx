'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
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
import type { ExplorerData, WorkspaceDocument } from './actions'
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
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
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
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
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
  documents: WorkspaceDocument[]
  bills: SerializedBill[]
  batchPayments: SerializedBatchPayment[]
  workspaceId: string
}

export function ExplorerTabs(props: ExplorerTabsProps) {
  return (
    <Suspense fallback={null}>
      <ExplorerTabsInner {...props} />
    </Suspense>
  )
}

function ExplorerTabsInner({ data, documents, bills, batchPayments, workspaceId }: ExplorerTabsProps) {
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

  // Apply client-side date range filtering
  const filteredTransactions = useMemo(() => {
    let filtered = data.transactions
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
  }, [data.transactions, dateRange, source])

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

  const txColumns = useMemo(
    () => getTransactionColumns(documents, workspaceId, handleSourceClick, handleCategoryClick),
    [documents, workspaceId, handleSourceClick, handleCategoryClick]
  )

  const vndrColumns = useMemo(
    () => getVendorColumns(handleVendorClick),
    [handleVendorClick]
  )

  const catColumns = useMemo(
    () => getCategoryColumns(handleCategoryClick),
    [handleCategoryClick]
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
          columns={txColumns}
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
        />
      </TabsContent>

      <TabsContent value="vendors">
        <PaginatedTable
          columns={vndrColumns}
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
        />
      </TabsContent>

      <TabsContent value="categories">
        <PaginatedTable
          columns={catColumns}
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
        />
      </TabsContent>

      <TabsContent value="events">
        <PaginatedTable
          columns={eventColumns}
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
    </Tabs>
  )
}
