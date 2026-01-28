'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { RuleStatusToggle } from './rule-row'

export type RuleData = {
  id: string
  ruleText: string
  matchCount: number
  isActive: boolean
  category: {
    name: string
  }
}

export function getRulesColumns(workspaceId: string): ColumnDef<RuleData>[] {
  return [
    {
      accessorKey: 'ruleText',
      header: 'Rule',
      size: 400,
      cell: ({ row }) => (
        <span className="font-medium line-clamp-2">{row.getValue('ruleText')}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {row.original.category.name}
        </Badge>
      ),
    },
    {
      accessorKey: 'matchCount',
      header: () => <div className="text-right">Match Count</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.getValue('matchCount')}</div>
      ),
    },
    {
      id: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <RuleStatusToggle rule={row.original} workspaceId={workspaceId} />
      ),
    },
  ]
}
