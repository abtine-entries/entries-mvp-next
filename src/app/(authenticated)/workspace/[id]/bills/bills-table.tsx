'use client'

import { useState } from 'react'
import { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { createSelectColumn } from '@/components/ui/data-table-columns'
import { Badge } from '@/components/ui/badge'
import type { SerializedBill } from './actions'

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  authorized: 'success',
  pending: 'warning',
  overdue: 'error',
  paid: 'secondary',
}

const columns: ColumnDef<SerializedBill>[] = [
  createSelectColumn<SerializedBill>(),
  {
    accessorKey: 'vendorName',
    header: 'Vendor',
  },
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) =>
      row.original.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: row.original.currency,
      }),
  },
  {
    accessorKey: 'currency',
    header: 'Currency',
  },
  {
    accessorKey: 'status',
    header: 'Status',
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

interface BillsTableProps {
  bills: SerializedBill[]
  workspaceId: string
}

export function BillsTable({ bills, workspaceId }: BillsTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  return (
    <DataTable
      columns={columns}
      data={bills}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      getRowId={(row) => row.id}
      emptyMessage="No bills found. Bills from connected accounting software will appear here."
    />
  )
}
