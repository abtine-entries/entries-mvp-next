'use client'

import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import type { SerializedDocument } from './actions'

interface DocsDataTableProps {
  data: SerializedDocument[]
}

export function DocsDataTable({ data }: DocsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No documents uploaded yet. Drag and drop files here or click Upload."
    />
  )
}
