'use client'

import { DataTable } from '@/components/ui/data-table'
import { columns, type EventFeedItem } from './columns'

interface EventFeedDataTableProps {
  data: EventFeedItem[]
  workspaceId: string
}

export function EventFeedDataTable({ data, workspaceId }: EventFeedDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowHref={(row) => `/workspace/${workspaceId}/event/${row.original.id}`}
      emptyMessage="No events yet. Events will appear here as transactions, matches, and other activities occur."
    />
  )
}
