'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import { DataTable } from '@/components/ui/data-table'
import type { WorkspaceWithCounts } from './actions'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import { CheckCircle2, Loader2, AlertTriangle, Minus } from 'lucide-react'

function SyncStatusBadge({ status, lastSyncAt }: { status: string; lastSyncAt: Date | null }) {
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Attention
      </span>
    )
  }

  if (status === 'syncing') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Syncing
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-green-400">
      <CheckCircle2 className="h-3 w-3" />
      Synced
    </span>
  )
}

function AlertsBadge({ requiresAction, fyi }: { requiresAction: number; fyi: number }) {
  if (requiresAction === 0 && fyi === 0) {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }

  return (
    <div className="flex items-center gap-1.5">
      {requiresAction > 0 && (
        <Badge variant="destructive" className="text-[11px] h-5 min-w-[20px] px-1.5 rounded-full">
          {requiresAction}
        </Badge>
      )}
      {fyi > 0 && (
        <Badge variant="warning" className="text-[11px] h-5 min-w-[20px] px-1.5 rounded-full">
          {fyi}
        </Badge>
      )}
    </div>
  )
}

const columns: ColumnDef<WorkspaceWithCounts>[] = [
  {
    accessorKey: 'name',
    header: 'Client Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.connectors.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {row.original.connectors.map((connector: ConnectorType) => (
              <div key={connector} className="ring-2 ring-card rounded-full">
                <ConnectorLogo connector={connector} size="xs" />
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'alerts',
    header: 'Alerts',
    size: 100,
    cell: ({ row }) => (
      <AlertsBadge
        requiresAction={row.original.requiresActionCount}
        fyi={row.original.fyiCount}
      />
    ),
  },
  {
    id: 'newEvents',
    header: 'New Events',
    size: 100,
    cell: ({ row }) => {
      const count = row.original.newEventCount
      if (count === 0) {
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
      }
      return (
        <Badge className="rounded-full min-w-[20px] h-5 px-1.5 text-[11px]">
          {count}
        </Badge>
      )
    },
  },
  {
    id: 'syncStatus',
    header: 'Sync Status',
    size: 120,
    cell: ({ row }) => (
      <SyncStatusBadge
        status={row.original.qboStatus}
        lastSyncAt={row.original.lastSyncAt}
      />
    ),
  },
]

export function ClientTable({ workspaces }: { workspaces: WorkspaceWithCounts[] }) {
  return (
    <DataTable
      columns={columns}
      data={workspaces}
      getRowHref={(row) => `/workspace/${row.original.id}/alerts`}
      emptyMessage="No clients yet. Create your first client workspace to get started."
    />
  )
}
