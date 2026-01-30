'use client'

import { useState, useMemo, useCallback, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, X } from 'lucide-react'
import type { SerializedBill } from './actions'
import { createBatchPayment } from './actions'

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
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  // Selected bills for the batch sheet
  const selectedBills = useMemo(() => {
    return table
      .getSelectedRowModel()
      .rows.map((r) => r.original)
      .filter((b) => b.status === 'authorized')
  }, [table, rowSelection]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAuthorizedCount = selectedBills.length
  const totalAmount = useMemo(
    () => selectedBills.reduce((sum, b) => sum + b.amount, 0),
    [selectedBills]
  )

  const removeBillFromBatch = useCallback(
    (billId: string) => {
      setRowSelection((prev) => {
        const next = { ...prev }
        delete next[billId]
        return next
      })
    },
    []
  )

  // Close sheet if all bills are removed
  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open)
    },
    []
  )

  // When selected bills change and sheet is open, close if none left
  useEffect(() => {
    if (sheetOpen && selectedAuthorizedCount === 0) {
      setSheetOpen(false)
    }
  }, [sheetOpen, selectedAuthorizedCount])

  const handleWiseSend = useCallback(async () => {
    setIsSending(true)
    const billInputs = selectedBills.map((b) => ({
      id: b.id,
      amount: b.amount,
      currency: b.currency,
      vendorName: b.vendorName,
    }))

    startTransition(async () => {
      const result = await createBatchPayment(workspaceId, billInputs)
      if (result.success) {
        // Simulate 2-second Wise API processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const formattedAmount = totalAmount.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })
        toast.success(
          `Batch payment of ${formattedAmount} sent to ${selectedAuthorizedCount} recipients`
        )
        setConfirmDialogOpen(false)
        setSheetOpen(false)
        setRowSelection({})
      } else {
        toast.error(result.error ?? 'Failed to create batch payment')
      }
      setIsSending(false)
    })
  }, [selectedBills, workspaceId, totalAmount, selectedAuthorizedCount, startTransition])

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

        {selectedAuthorizedCount > 0 && (
          <Button className="ml-auto" onClick={() => setSheetOpen(true)}>
            Create Batch ({selectedAuthorizedCount})
          </Button>
        )}
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

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Batch Payment Review</SheetTitle>
            <SheetDescription>
              Review selected bills before creating a batch payment.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto py-4 space-y-4">
            {/* Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bills</span>
                <span className="font-medium">{selectedAuthorizedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">USD</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Total Amount</span>
                <span>
                  {totalAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </span>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              {selectedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{bill.vendorName}</p>
                    <p className="text-muted-foreground text-xs">{bill.invoiceNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-medium">
                      {bill.amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: bill.currency,
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeBillFromBatch(bill.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={() => setConfirmDialogOpen(true)}>
              Send via Wise
            </Button>
            <Button variant="outline" className="w-full">
              Export CSV
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Payment</DialogTitle>
            <DialogDescription>
              This will initiate transfers to {selectedAuthorizedCount} recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-medium">
                {totalAmount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipients</span>
              <span className="font-medium">{selectedAuthorizedCount}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button onClick={handleWiseSend} disabled={isSending || isPending}>
              {isSending ? 'Processing…' : 'Confirm & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
