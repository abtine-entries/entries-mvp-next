'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, ImageIcon, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDocumentDetail, type DocumentDetail } from './actions'

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return amount < 0 ? `-${formatted}` : formatted
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

function getStatusBadge(status: string) {
  switch (status) {
    case 'parsed':
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
          Parsed
        </Badge>
      )
    case 'parsing':
      return (
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          Parsing
        </Badge>
      )
    case 'uploaded':
      return (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          Uploaded
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
          Error
        </Badge>
      )
    default:
      return null
  }
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

interface DocumentDetailViewProps {
  documentId: string
  workspaceId: string
}

export function DocumentDetailView({ documentId, workspaceId }: DocumentDetailViewProps) {
  const [data, setData] = useState<DocumentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDocumentDetail(workspaceId, documentId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [workspaceId, documentId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Document not found.</p>
  }

  return (
    <div className="space-y-4">
      {/* Document header with icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
          {getFileIcon(data.fileType)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium truncate">{data.fileName}</h3>
          {data.folder && (
            <p className="text-xs text-muted-foreground">{data.folder}</p>
          )}
        </div>
      </div>

      {/* Download button */}
      <span title="Coming soon">
        <Button variant="outline" size="sm" className="w-full" disabled>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </span>

      {/* Stats */}
      <div className="space-y-1">
        <DetailField
          label="Type"
          value={
            <Badge variant="outline" className="text-xs">
              {data.fileType.toUpperCase()}
            </Badge>
          }
        />
        <DetailField label="Size" value={formatFileSize(data.fileSize)} />
        <DetailField label="Status" value={getStatusBadge(data.status)} />
        <DetailField label="Uploaded By" value={data.uploadedByName ?? 'Unknown'} />
        <DetailField label="Uploaded" value={formatDate(data.createdAt)} />
      </div>

      {/* Linked transactions */}
      <div className="pt-3 mt-1 border-t border-border">
        <h4 className="text-sm font-medium mb-3">
          Linked Transactions ({data.linkedTransactions.length})
        </h4>
        {data.linkedTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions linked to this document.</p>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.linkedTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">
                      {t.description}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-xs text-right font-mono',
                        t.amount < 0 ? 'text-red-400' : 'text-green-400'
                      )}
                    >
                      {formatAmount(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
