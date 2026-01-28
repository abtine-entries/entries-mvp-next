'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { FileText, Link2, Check, Clock, AlertTriangle } from 'lucide-react'
import { DocRowActions } from './doc-row-actions'

export type DocItem = {
  id: string
  name: string
  type: string
  uploadedAt: Date
  size: string
  status: string
  matchedEvent: string | null
}

function getDocTypeLabel(type: string) {
  switch (type) {
    case 'bank_statement':
      return 'Bank Statement'
    case 'receipt':
      return 'Receipt'
    case 'invoice':
      return 'Invoice'
    default:
      return 'Document'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'matched':
      return (
        <Badge
          variant="outline"
          className="bg-green-500/20 text-green-400 border-green-500/30"
        >
          <Check className="h-3 w-3 mr-1" />
          Matched
        </Badge>
      )
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending Match
        </Badge>
      )
    case 'unprocessed':
      return (
        <Badge
          variant="outline"
          className="bg-gray-500/20 text-gray-400 border-gray-500/30"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Unprocessed
        </Badge>
      )
    default:
      return null
  }
}

function formatDate(date: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const columns: ColumnDef<DocItem>[] = [
  {
    accessorKey: 'name',
    header: 'Document',
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{row.original.name}</p>
          {row.original.matchedEvent && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {row.original.matchedEvent}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 120,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {getDocTypeLabel(row.getValue('type'))}
      </Badge>
    ),
  },
  {
    accessorKey: 'uploadedAt',
    header: 'Uploaded',
    size: 120,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.getValue('uploadedAt'))}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DocRowActions docId={row.original.id} />
      </div>
    ),
  },
]
