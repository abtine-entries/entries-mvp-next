'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown } from 'lucide-react'
import type { SerializedBill } from './actions'

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  authorized: 'success',
  pending: 'warning',
  overdue: 'error',
  paid: 'secondary',
}

const columns: ColumnDef<SerializedBill>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 40,
    enableSorting: false,
  },
  {
    accessorKey: 'vendorName',
    header: 'Vendor',
    enableSorting: true,
  },
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    enableSorting: false,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    enableSorting: true,
    cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.dueDate).getTime() - new Date(rowB.original.dueDate).getTime()
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    enableSorting: true,
    cell: ({ row }) =>
      row.original.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: row.original.currency,
      }),
  },
  {
    accessorKey: 'currency',
    header: 'Currency',
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={statusVariant[status] ?? 'secondary'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
]

const STATUS_OPTIONS = ['all', 'authorized', 'pending', 'paid', 'overdue'] as const

interface BillsTableProps {
  bills: SerializedBill[]
  workspaceId: string
}

function BillsTableInner({ bills, workspaceId }: BillsTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialStatus = searchParams.get('status') ?? 'authorized'
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const initialSortId = searchParams.get('sortBy') ?? 'dueDate'
  const initialSortDesc = searchParams.get('sortDesc') === 'true'
  const [sorting, setSorting] = useState<SortingState>(
    initialSortId ? [{ id: initialSortId, desc: initialSortDesc }] : [{ id: 'dueDate', desc: false }]
  )

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (
          value === '' ||
          (key === 'status' && value === 'authorized') ||
          (key === 'sortBy' && value === 'dueDate') ||
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

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value)
      setRowSelection({})
      updateParams({ status: value })
    },
    [updateParams]
  )

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      if (newSorting.length > 0) {
        updateParams({
          sortBy: newSorting[0].id,
          sortDesc: String(newSorting[0].desc),
        })
      } else {
        updateParams({ sortBy: '', sortDesc: '' })
      }
    },
    [sorting, updateParams]
  )

  const filteredBills = useMemo(() => {
    if (statusFilter === 'all') return bills
    return bills.filter((b) => b.status === statusFilter)
  }, [bills, statusFilter])

  const table = useReactTable({
    data: filteredBills,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className={canSort ? 'cursor-pointer select-none' : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
                      {sorted === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
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
                No bills found. Bills from connected accounting software will appear here.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function BillsTable(props: BillsTableProps) {
  return (
    <Suspense fallback={null}>
      <BillsTableInner {...props} />
    </Suspense>
  )
}
