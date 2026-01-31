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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { getDocColumns } from './columns'
import { EntityDetailSidebar } from '@/components/ui/entity-detail-sidebar'
import { DocumentDetailView } from './document-detail-view'
import type { SerializedDocument } from './actions'

const PAGE_SIZE = 25

interface DocsDataTableProps {
  data: SerializedDocument[]
  workspaceId: string
}

function DocsDataTableInner({ data, workspaceId }: DocsDataTableProps) {
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
  const [documentSidebarId, setDocumentSidebarId] = useState<string | null>(null)
  const [documentSidebarOpen, setDocumentSidebarOpen] = useState(false)

  const handleDocumentClick = useCallback((documentId: string) => {
    setDocumentSidebarId(documentId)
    setDocumentSidebarOpen(true)
  }, [])

  const columns = useMemo(
    () => getDocColumns(handleDocumentClick),
    [handleDocumentClick]
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
    data,
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
          placeholder="Search documents..."
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
              <TableRow key={row.id}>
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
                No documents uploaded yet. Drag and drop files above or click Browse.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
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
    </div>
  )
}

export function DocsDataTable(props: DocsDataTableProps) {
  return (
    <Suspense fallback={null}>
      <DocsDataTableInner {...props} />
    </Suspense>
  )
}
