'use client'

import { useState, useMemo, useCallback, useTransition, Suspense } from 'react'
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
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, ArrowUp, ArrowDown, ArrowUpDown, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateTransactionCategory } from './actions'
import type { CategorizeData, CategorizeTransaction, CategorizeCategory } from './actions'

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

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return amount < 0 ? `-${formatted}` : formatted
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// --- Sortable header ---
function SortableHeader({ column, children }: { column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: () => void }; children: React.ReactNode }) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting()}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </Button>
  )
}

// --- Inline category dropdown ---
function CategoryDropdown({
  transaction,
  categories,
  onCategoryChange,
}: {
  transaction: CategorizeTransaction
  categories: CategorizeCategory[]
  onCategoryChange: (transactionId: string, categoryId: string | null, categoryName: string | null) => void
}) {
  // Group categories by type
  const grouped = useMemo(() => {
    const groups: Record<string, CategorizeCategory[]> = {}
    for (const c of categories) {
      if (!groups[c.type]) groups[c.type] = []
      groups[c.type].push(c)
    }
    return groups
  }, [categories])

  const typeLabels: Record<string, string> = {
    expense: 'Expenses',
    income: 'Income',
    asset: 'Assets',
    liability: 'Liabilities',
  }
  const typeOrder = ['expense', 'income', 'asset', 'liability']

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={transaction.categoryId ?? '__none__'}
        onValueChange={(value) => {
          const newCategoryId = value === '__none__' ? null : value
          const newCategoryName = newCategoryId
            ? categories.find((c) => c.id === newCategoryId)?.name ?? null
            : null
          onCategoryChange(transaction.id, newCategoryId, newCategoryName)
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            'h-7 min-w-[120px] max-w-[160px] text-xs',
            !transaction.categoryId && 'text-yellow-400 border-yellow-500/30'
          )}
        >
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-yellow-400">Uncategorized</span>
          </SelectItem>
          {typeOrder.map((type) => {
            const items = grouped[type]
            if (!items || items.length === 0) return null
            return (
              <SelectGroup key={type}>
                <SelectLabel>{typeLabels[type] ?? type}</SelectLabel>
                {items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )
          })}
        </SelectContent>
      </Select>
      {transaction.aiReasoning && (
        <span title="AI-suggested category">
          <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
        </span>
      )}
    </div>
  )
}

// --- Transaction table column factory ---
function createTransactionColumns(
  categories: CategorizeCategory[],
  onCategoryChange: (transactionId: string, categoryId: string | null, categoryName: string | null) => void,
): ColumnDef<CategorizeTransaction, unknown>[] {
  return [
    {
      accessorKey: 'date',
      header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
      size: 90,
      sortingFn: (rowA, rowB) => {
        const a = new Date(rowA.original.date).getTime()
        const b = new Date(rowB.original.date).getTime()
        return a - b
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.date)}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-sm truncate max-w-[200px]">{row.original.description}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column}>Amount</SortableHeader>
        </div>
      ),
      size: 110,
      cell: ({ row }) => {
        const amount = row.original.amount
        return (
          <div className={cn('text-right text-sm font-mono', amount < 0 ? 'text-red-400' : 'text-green-400')}>
            {formatAmount(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: 'categoryName',
      header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
      size: 180,
      cell: ({ row }) => (
        <CategoryDropdown
          transaction={row.original}
          categories={categories}
          onCategoryChange={onCategoryChange}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      size: 100,
      cell: ({ row }) => {
        const status = row.original.status
        const variants: Record<string, string> = {
          unmatched: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          matched: 'bg-green-500/10 text-green-400 border-green-500/30',
          pending: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        }
        return (
          <Badge variant="outline" className={cn('text-xs capitalize', variants[status])}>
            {status}
          </Badge>
        )
      },
    },
  ]
}

// --- Category tree item ---
interface CategoryTreeNode {
  id: string
  name: string
  type: string
  parentId: string | null
  transactionCount: number
  totalAmount: number
  children: CategoryTreeNode[]
}

function buildCategoryTree(
  categories: CategorizeCategory[],
  transactions: CategorizeTransaction[]
): CategoryTreeNode[] {
  // Compute totalAmount per category from filtered transactions
  const amountByCategory: Record<string, number> = {}
  for (const t of transactions) {
    if (t.categoryId) {
      amountByCategory[t.categoryId] = (amountByCategory[t.categoryId] ?? 0) + Math.abs(t.amount)
    }
  }

  // Build nodes
  const nodeMap: Record<string, CategoryTreeNode> = {}
  for (const c of categories) {
    nodeMap[c.id] = {
      id: c.id,
      name: c.name,
      type: c.type,
      parentId: c.parentId,
      transactionCount: c.transactionCount,
      totalAmount: amountByCategory[c.id] ?? 0,
      children: [],
    }
  }

  // Assemble tree
  const roots: CategoryTreeNode[] = []
  for (const node of Object.values(nodeMap)) {
    if (node.parentId && nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Group roots by type
  const typeOrder = ['expense', 'income', 'asset', 'liability']
  roots.sort((a, b) => {
    const ai = typeOrder.indexOf(a.type)
    const bi = typeOrder.indexOf(b.type)
    if (ai !== bi) return ai - bi
    return a.name.localeCompare(b.name)
  })

  return roots
}

function CategoryTreeItem({ node, depth = 0 }: { node: CategoryTreeNode; depth?: number }) {
  return (
    <>
      <div
        className="flex items-center justify-between py-1.5 px-2 text-sm hover:bg-muted/50 rounded"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{node.name}</span>
          {node.transactionCount > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              ({node.transactionCount})
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">
          {node.totalAmount > 0 ? formatAmount(node.totalAmount) : '—'}
        </span>
      </div>
      {node.children.map((child) => (
        <CategoryTreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

// --- Chart of accounts panel ---
function ChartOfAccounts({
  categories,
  transactions,
}: {
  categories: CategorizeCategory[]
  transactions: CategorizeTransaction[]
}) {
  const tree = useMemo(() => buildCategoryTree(categories, transactions), [categories, transactions])

  // Group by type
  const typeLabels: Record<string, string> = {
    expense: 'Expenses',
    income: 'Income',
    asset: 'Assets',
    liability: 'Liabilities',
  }

  const grouped = useMemo(() => {
    const groups: Record<string, CategoryTreeNode[]> = {}
    for (const node of tree) {
      if (!groups[node.type]) groups[node.type] = []
      groups[node.type].push(node)
    }
    return groups
  }, [tree])

  const typeOrder = ['expense', 'income', 'asset', 'liability']

  // Compute group totals
  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const [type, nodes] of Object.entries(grouped)) {
      totals[type] = nodes.reduce((sum, n) => sum + n.totalAmount, 0)
    }
    return totals
  }, [grouped])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Chart of Accounts</h3>
      </div>
      <div className="space-y-3">
        {typeOrder.map((type) => {
          const nodes = grouped[type]
          if (!nodes || nodes.length === 0) return null
          return (
            <div key={type}>
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {typeLabels[type] ?? type}
                </span>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {groupTotals[type] > 0 ? formatAmount(groupTotals[type]) : '—'}
                </span>
              </div>
              {nodes.map((node) => (
                <CategoryTreeItem key={node.id} node={node} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Filter bar ---
function FilterBar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  catStatus,
  onCatStatusChange,
  source,
  onSourceChange,
  activeFilterCount,
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
  dateRange: string
  onDateRangeChange: (value: string) => void
  catStatus: string
  onCatStatusChange: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
  activeFilterCount: number
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8"
        />
      </div>

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

      <Select value={catStatus} onValueChange={onCatStatusChange}>
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue placeholder="Categorization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="uncategorized">Uncategorized</SelectItem>
          <SelectItem value="categorized">Categorized</SelectItem>
        </SelectContent>
      </Select>

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

// --- Main split view ---
interface CategorizeSplitViewProps {
  data: CategorizeData
  workspaceId: string
}

export function CategorizeSplitView(props: CategorizeSplitViewProps) {
  return (
    <Suspense fallback={null}>
      <CategorizeSplitViewInner {...props} />
    </Suspense>
  )
}

function CategorizeSplitViewInner({ data, workspaceId }: CategorizeSplitViewProps) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Read initial state from URL
  const initialSearch = searchParams.get('q') ?? ''
  const initialDateRange = searchParams.get('dateRange') ?? 'all'
  const initialCatStatus = searchParams.get('catStatus') ?? 'all'
  const initialSource = searchParams.get('source') ?? 'all'
  const initialSortId = searchParams.get('sortBy') ?? ''
  const initialSortDesc = searchParams.get('sortDesc') === 'true'

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [dateRange, setDateRange] = useState(initialDateRange)
  const [catStatus, setCatStatus] = useState(initialCatStatus)
  const [source, setSource] = useState(initialSource)
  const [sorting, setSorting] = useState<SortingState>(
    initialSortId ? [{ id: initialSortId, desc: initialSortDesc }] : []
  )

  // Optimistic category overrides: transactionId -> { categoryId, categoryName }
  const [categoryOverrides, setCategoryOverrides] = useState<
    Record<string, { categoryId: string | null; categoryName: string | null }>
  >({})

  // Apply category overrides to transactions
  const transactions = useMemo(() => {
    return data.transactions.map((t) => {
      const override = categoryOverrides[t.id]
      if (override) {
        return {
          ...t,
          categoryId: override.categoryId,
          categoryName: override.categoryName,
          categoryType: override.categoryId
            ? data.categories.find((c) => c.id === override.categoryId)?.type ?? t.categoryType
            : null,
        }
      }
      return t
    })
  }, [data.transactions, data.categories, categoryOverrides])

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

  // Create columns with category dropdown
  const transactionColumns = useMemo(
    () => createTransactionColumns(data.categories, handleCategoryChange),
    [data.categories, handleCategoryChange]
  )

  // URL update helper
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value === 'all') {
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

  // Filter change handlers
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
  const handleCatStatusChange = useCallback(
    (value: string) => {
      setCatStatus(value)
      updateParams({ catStatus: value })
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

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (dateRange !== 'all') count++
    if (catStatus !== 'all') count++
    if (source !== 'all') count++
    return count
  }, [searchQuery, dateRange, catStatus, source])

  // Apply pre-filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions
    const rangeStart = getDateRangeStart(dateRange)
    if (rangeStart) {
      filtered = filtered.filter((t) => new Date(t.date) >= rangeStart)
    }
    if (catStatus === 'uncategorized') {
      filtered = filtered.filter((t) => !t.categoryId)
    } else if (catStatus === 'categorized') {
      filtered = filtered.filter((t) => !!t.categoryId)
    }
    if (source !== 'all') {
      filtered = filtered.filter((t) => t.source === source)
    }
    return filtered
  }, [transactions, dateRange, catStatus, source])

  // Sort uncategorized first
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      // Uncategorized first
      if (!a.categoryId && b.categoryId) return -1
      if (a.categoryId && !b.categoryId) return 1
      return 0
    })
  }, [filteredTransactions])

  // Stats
  const uncategorizedCount = useMemo(
    () => filteredTransactions.filter((t) => !t.categoryId).length,
    [filteredTransactions]
  )
  const categorizedCount = filteredTransactions.length - uncategorizedCount

  // TanStack React Table
  const table = useReactTable({
    data: sortedTransactions,
    columns: transactionColumns,
    state: { sorting, globalFilter: searchQuery },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      handleSortingChange(next)
    },
    onGlobalFilterChange: handleSearchChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex
  const filteredRowCount = table.getFilteredRowModel().rows.length

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Left panel — Transaction table (60-70%) */}
      <div className="flex-[7] min-w-0 flex flex-col gap-4">
        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {filteredTransactions.length} transactions
          </span>
          <span className="text-yellow-400">
            {uncategorizedCount} uncategorized
          </span>
          <span className="text-green-400">
            {categorizedCount} categorized
          </span>
        </div>

        {/* Filter bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          catStatus={catStatus}
          onCatStatusChange={handleCatStatusChange}
          source={source}
          onSourceChange={handleSourceChange}
          activeFilterCount={activeFilterCount}
        />

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.getSize() !== 150 ? header.getSize() : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                      className={cn(
                        !row.original.categoryId && 'bg-yellow-500/5'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={transactionColumns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
            <span>
              Page {currentPage + 1} of {pageCount} ({filteredRowCount} of {sortedTransactions.length} rows)
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

      {/* Right panel — Chart of Accounts (30-40%) */}
      <div className="flex-[3] min-w-[250px] max-w-[400px] border-l border-border pl-6 overflow-auto">
        <ChartOfAccounts
          categories={data.categories}
          transactions={filteredTransactions}
        />
      </div>
    </div>
  )
}
