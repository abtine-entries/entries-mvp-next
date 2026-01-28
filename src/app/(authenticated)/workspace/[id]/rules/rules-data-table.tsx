'use client'

import { DataTable } from '@/components/ui/data-table'
import { getRulesColumns, type RuleData } from './columns'

interface RulesDataTableProps {
  rules: RuleData[]
  workspaceId: string
}

export function RulesDataTable({ rules, workspaceId }: RulesDataTableProps) {
  const columns = getRulesColumns(workspaceId)

  return (
    <DataTable
      columns={columns}
      data={rules}
      emptyMessage="No rules found."
    />
  )
}
