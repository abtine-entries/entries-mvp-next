'use client'

import { DataTable } from '@/components/ui/data-table'
import { columns, type DocItem } from './columns'

interface DocsDataTableProps {
  data: DocItem[]
}

export function DocsDataTable({ data }: DocsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No documents uploaded yet."
    />
  )
}
