'use client'

import { useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
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
  AlertTriangle,
  MessageCircleQuestion,
  RefreshCw,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react'
import { EsmeAvatar } from '@/components/esme-avatar'
import type { AlertSummaryWorkspace } from './actions'

const PAGE_SIZE = 25

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

function getEsmeGreeting(totalAlerts: number, workspaceCount: number): string {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (totalAlerts === 0) {
    return `${timeGreeting}! All clear — no alerts across your clients.`
  }

  const clientWord = workspaceCount === 1 ? 'client needs' : 'clients need'
  return `${timeGreeting}! ${workspaceCount} ${clientWord} attention today.`
}

type FlatAlert = {
  id: string
  title: string
  type: string
  priority: string
  workspaceId: string
  workspaceName: string
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

function TypeIcon({ type }: { type: string }) {
  const Icon = typeIcons[type] ?? AlertTriangle
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />
}

const columns: ColumnDef<FlatAlert>[] = [
  {
    id: 'type',
    size: 40,
    enableSorting: false,
    header: () => <span className="text-muted-foreground">Type</span>,
    cell: ({ row }) => <TypeIcon type={row.original.type} />,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <SortableHeader column={column}>Alert</SortableHeader>,
    cell: ({ row }) => {
      const isRequiresAction = row.original.priority === 'requires_action'
      return (
        <span className={`font-medium truncate ${isRequiresAction ? 'text-foreground' : 'text-muted-foreground'}`}>
          {row.getValue('title')}
        </span>
      )
    },
  },
  {
    accessorKey: 'workspaceName',
    size: 140,
    header: ({ column }) => <SortableHeader column={column}>Client</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate">
        {row.getValue('workspaceName')}
      </span>
    ),
  },
  {
    accessorKey: 'priority',
    size: 120,
    header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
    sortingFn: (rowA, rowB) => {
      const order: Record<string, number> = { requires_action: 0, fyi: 1 }
      return (order[rowA.original.priority] ?? 2) - (order[rowB.original.priority] ?? 2)
    },
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      if (priority === 'requires_action') {
        return (
          <Badge variant="destructive" className="text-xs">
            Action needed
          </Badge>
        )
      }
      return (
        <Badge variant="secondary" className="text-xs">
          FYI
        </Badge>
      )
    },
  },
]

function AlertsSummaryInner({
  workspaces,
}: {
  workspaces: AlertSummaryWorkspace[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const totalAlerts = workspaces.reduce(
    (sum, ws) => sum + ws.requiresActionCount + ws.fyiCount,
    0
  )

  // Flatten alerts with workspace context
  const flatAlerts: FlatAlert[] = useMemo(
    () =>
      workspaces.flatMap((ws) =>
        ws.alerts.map((alert) => ({
          ...alert,
          workspaceId: ws.workspaceId,
          workspaceName: ws.workspaceName,
        }))
      ),
    [workspaces]
  )

  const initialSearch = searchParams.get('eq') ?? ''
  const initialSortId = searchParams.get('esortBy') ?? 'priority'
  const initialSortDesc = searchParams.get('esortDesc') === 'true'

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sorting, setSorting] = useState<SortingState>(
    initialSortId ? [{ id: initialSortId, desc: initialSortDesc }] : [{ id: 'priority', desc: false }]
  )

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === '') {
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

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      updateParams({ eq: value })
    },
    [updateParams]
  )

  const handleSortingChange = useCallback(
    (next: SortingState) => {
      setSorting(next)
      if (next.length > 0) {
        updateParams({ esortBy: next[0].id, esortDesc: String(next[0].desc) })
      } else {
        updateParams({ esortBy: '', esortDesc: '' })
      }
    },
    [updateParams]
  )

  const table = useReactTable({
    data: flatAlerts,
    columns,
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
  const filteredCount = table.getFilteredRowModel().rows.length

  if (flatAlerts.length === 0) {
    return (
      <div className="space-y-4">
        {/* Esme greeting */}
        <div className="flex items-start gap-3">
          <EsmeAvatar className="h-8 w-8 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">Esme</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getEsmeGreeting(0, 0)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Esme greeting */}
      <div className="flex items-start gap-3">
        <EsmeAvatar className="h-8 w-8 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">Esme</span>
            {totalAlerts > 0 && (
              <Badge variant="warning" className="text-xs">
                {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {getEsmeGreeting(totalAlerts, workspaces.length)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search alerts..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-8"
        />
      </div>

      {/* Table */}
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
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  router.push(`/workspace/${row.original.workspaceId}/esme`)
                }}
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
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No alerts match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage + 1} of {pageCount} ({filteredCount} of {flatAlerts.length} rows)
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

export function AlertsSummary(props: { workspaces: AlertSummaryWorkspace[] }) {
  return (
    <Suspense fallback={null}>
      <AlertsSummaryInner {...props} />
    </Suspense>
  )
}
