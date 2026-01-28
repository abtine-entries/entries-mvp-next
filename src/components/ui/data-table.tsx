"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
  OnChangeFn,
  Row,
  TableOptions,
  TableMeta,
  RowData,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface DataTableProps<TData extends RowData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Row selection state (controlled) */
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  /** Click handler for rows */
  onRowClick?: (row: Row<TData>) => void
  /** Return an href to make rows navigable (uses router.push) */
  getRowHref?: (row: Row<TData>) => string
  /** Custom className per row */
  getRowClassName?: (row: Row<TData>) => string
  /** Show column headers (default: true) */
  showHeader?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Wrapper className for the table container */
  className?: string
  /** Arbitrary metadata accessible in column cell/header renderers via table.options.meta */
  meta?: TableMeta<TData>
  /** Custom row ID resolver (defaults to row index) */
  getRowId?: (originalRow: TData, index: number) => string
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  getRowHref,
  getRowClassName,
  showHeader = true,
  emptyMessage = "No results.",
  className,
  meta,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()

  const tableOptions: TableOptions<TData> = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
    getRowId,
  }

  if (rowSelection !== undefined && onRowSelectionChange) {
    tableOptions.state = { ...tableOptions.state, rowSelection }
    tableOptions.onRowSelectionChange = onRowSelectionChange
    tableOptions.enableRowSelection = true
  }

  const table = useReactTable(tableOptions)

  const isRowInteractive = !!(onRowClick || getRowHref)

  function handleRowClick(row: Row<TData>) {
    if (onRowClick) {
      onRowClick(row)
    } else if (getRowHref) {
      router.push(getRowHref(row))
    }
  }

  function handleRowKeyDown(e: React.KeyboardEvent, row: Row<TData>) {
    if (e.key === "Enter" && isRowInteractive) {
      handleRowClick(row)
    }
  }

  return (
    <div className={className}>
      <Table>
        {showHeader && (
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={cn(
                  "group",
                  isRowInteractive && "cursor-pointer",
                  getRowClassName?.(row),
                )}
                onClick={isRowInteractive ? () => handleRowClick(row) : undefined}
                onKeyDown={isRowInteractive ? (e) => handleRowKeyDown(e, row) : undefined}
                tabIndex={isRowInteractive ? 0 : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
