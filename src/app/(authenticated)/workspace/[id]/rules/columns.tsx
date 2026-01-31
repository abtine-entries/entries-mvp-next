'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { RuleStatusToggle } from './rule-row'

export type RuleData = {
  id: string
  ruleText: string
  matchCount: number
  isActive: boolean
}

// --- Sortable header ---
function SortableHeader({ column, children }: { column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: () => void }; children: React.ReactNode }) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting()}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </Button>
  )
}

export function getRulesColumns(workspaceId: string): ColumnDef<RuleData>[] {
  return [
    {
      accessorKey: 'ruleText',
      header: ({ column }) => <SortableHeader column={column}>Rule</SortableHeader>,
      size: 400,
      cell: ({ row }) => (
        <span className="font-medium line-clamp-2">{row.getValue('ruleText')}</span>
      ),
    },
    {
      accessorKey: 'matchCount',
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column}>Match Count</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.getValue('matchCount')}</div>
      ),
    },
    {
      id: 'status',
      header: () => <div className="text-center">Status</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <RuleStatusToggle rule={row.original} workspaceId={workspaceId} />
      ),
    },
  ]
}
