'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  transactionColumns,
  vendorColumns,
  categoryColumns,
  eventColumns,
} from './columns'
import type { ExplorerData } from './actions'

const PAGE_SIZE = 25

interface PaginatedTableProps<TData extends RowData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage: string
}

function PaginatedTable<TData extends RowData>({
  columns,
  data,
  emptyMessage,
}: PaginatedTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
    },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                <TableRow key={row.id}>
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
      </div>

      {/* Pagination controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage + 1} of {pageCount} ({data.length} total)
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

interface ExplorerTabsProps {
  data: ExplorerData
}

export function ExplorerTabs({ data }: ExplorerTabsProps) {
  const tabs = useMemo(
    () => [
      {
        value: 'transactions',
        label: `Transactions (${data.transactions.length})`,
      },
      { value: 'vendors', label: `Vendors (${data.vendors.length})` },
      {
        value: 'categories',
        label: `Categories (${data.categories.length})`,
      },
      { value: 'events', label: `Events (${data.events.length})` },
    ],
    [data]
  )

  return (
    <Tabs defaultValue="transactions" className="space-y-4">
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="transactions">
        <PaginatedTable
          columns={transactionColumns}
          data={data.transactions}
          emptyMessage="No transactions found."
        />
      </TabsContent>

      <TabsContent value="vendors">
        <PaginatedTable
          columns={vendorColumns}
          data={data.vendors}
          emptyMessage="No vendors found."
        />
      </TabsContent>

      <TabsContent value="categories">
        <PaginatedTable
          columns={categoryColumns}
          data={data.categories}
          emptyMessage="No categories found."
        />
      </TabsContent>

      <TabsContent value="events">
        <PaginatedTable
          columns={eventColumns}
          data={data.events}
          emptyMessage="No events found."
        />
      </TabsContent>
    </Tabs>
  )
}
