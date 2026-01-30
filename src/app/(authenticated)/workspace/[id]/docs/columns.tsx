'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  FileSpreadsheet,
  ImageIcon,
  Check,
  Clock,
  Upload,
  AlertTriangle,
} from 'lucide-react'
import { DocRowActions } from './doc-row-actions'
import type { SerializedDocument } from './actions'

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'csv':
      return <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
    case 'image':
      return <ImageIcon className="h-5 w-5 text-muted-foreground" />
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />
  }
}

function getFileTypeLabel(fileType: string) {
  switch (fileType) {
    case 'pdf':
      return 'PDF'
    case 'csv':
      return 'CSV'
    case 'image':
      return 'Image'
    default:
      return 'File'
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'parsed':
      return (
        <Badge
          variant="outline"
          className="bg-green-500/20 text-green-400 border-green-500/30"
        >
          <Check className="h-3 w-3 mr-1" />
          Parsed
        </Badge>
      )
    case 'parsing':
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/20 text-blue-400 border-blue-500/30"
        >
          <Clock className="h-3 w-3 mr-1" />
          Parsing
        </Badge>
      )
    case 'uploaded':
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        >
          <Upload className="h-3 w-3 mr-1" />
          Uploaded
        </Badge>
      )
    case 'error':
      return (
        <Badge
          variant="outline"
          className="bg-red-500/20 text-red-400 border-red-500/30"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )
    default:
      return null
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const columns: ColumnDef<SerializedDocument>[] = [
  {
    accessorKey: 'fileName',
    header: 'File Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center">
          {getFileIcon(row.original.fileType)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{row.original.fileName}</p>
          {row.original.folder && (
            <p className="text-xs text-muted-foreground">{row.original.folder}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'fileType',
    header: 'Type',
    size: 80,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {getFileTypeLabel(row.original.fileType)}
      </Badge>
    ),
  },
  {
    accessorKey: 'fileSize',
    header: 'Size',
    size: 80,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatFileSize(row.original.fileSize)}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: 'uploadedByName',
    header: 'Uploaded By',
    size: 120,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.uploadedByName ?? 'Unknown'}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    size: 120,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </div>
    ),
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
