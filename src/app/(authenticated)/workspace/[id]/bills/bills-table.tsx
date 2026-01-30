'use client'

import type { SerializedBill } from './actions'

interface BillsTableProps {
  bills: SerializedBill[]
  workspaceId: string
}

export function BillsTable({ bills, workspaceId }: BillsTableProps) {
  return (
    <div>
      <p className="text-muted-foreground">Bills table placeholder — {bills.length} bills for workspace {workspaceId}</p>
    </div>
  )
}
