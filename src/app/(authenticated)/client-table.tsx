'use client'

import { useState, useCallback, Suspense } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { WorkspaceWithCounts } from './actions'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Minus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react'

const PAGE_SIZE = 25

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

function SyncStatusBadge({ status }: { status: string }) {
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Attention
      </span>
    )
  }

  if (status === 'syncing') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Syncing
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-green-400">
      <CheckCircle2 className="h-3 w-3" />
      Synced
    </span>
  )
}

function AlertsBadge({ requiresAction, fyi }: { requiresAction: number; fyi: number }) {
  if (requiresAction === 0 && fyi === 0) {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }

  return (
    <div className="flex items-center gap-1.5">
      {requiresAction > 0 && (
        <Badge variant="destructive" className="text-[11px] h-5 min-w-[20px] px-1.5 rounded-full">
          {requiresAction}
        </Badge>
      )}
      {fyi > 0 && (
        <Badge variant="warning" className="text-[11px] h-5 min-w-[20px] px-1.5 rounded-full">
          {fyi}
        </Badge>
      )}
    </div>
  )
}

const columns: ColumnDef<WorkspaceWithCounts>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column}>Client Name</SortableHeader>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.connectors.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {row.original.connectors.map((connector: ConnectorType) => (
              <div key={connector} className="ring-2 ring-card rounded-full">
                <ConnectorLogo connector={connector} size="xs" />
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'alerts',
    header: 'Alerts',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => (
      <AlertsBadge
        requiresAction={row.original.requiresActionCount}
        fyi={row.original.fyiCount}
      />
    ),
  },
  {
    id: 'newEvents',
    header: 'New Events',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const count = row.original.newEventCount
      if (count === 0) {
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
      }
      return (
        <Badge className="rounded-full min-w-[20px] h-5 px-1.5 text-[11px]">
          {count}
        </Badge>
      )
    },
  },
  {
    id: 'syncStatus',
    header: 'Sync Status',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => (
      <SyncStatusBadge status={row.original.qboStatus} />
    ),
  },
]

function ClientTableInner({ workspaces }: { workspaces: WorkspaceWithCounts[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialSearch = searchParams.get('q') ?? ''
  const initialSortId = searchParams.get('sortBy') ?? ''
  const initialSortDesc = searchParams.get('sortDesc') === 'true'

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sorting, setSorting] = useState<SortingState>(
    initialSortId ? [{ id: initialSortId, desc: initialSortDesc }] : []
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
      updateParams({ q: value })
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

  const table = useReactTable({
    data: workspaces,
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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
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
                onClick={() => router.push(`/workspace/${row.original.id}/event-feed`)}
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
                No clients yet. Create your first client workspace to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage + 1} of {pageCount} ({filteredCount} of {workspaces.length} rows)
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

export function ClientTable(props: { workspaces: WorkspaceWithCounts[] }) {
  return (
    <Suspense fallback={null}>
      <ClientTableInner {...props} />
    </Suspense>
  )
}
