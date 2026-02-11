'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileSpreadsheet, ArrowLeft } from 'lucide-react'
import type { ParsedGLData } from './types'

interface ImportPreviewProps {
  data: ParsedGLData
  fileName: string
  onImport: () => void
  onBack: () => void
  isImporting: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount))
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const PREVIEW_ROWS = 10

export function ImportPreview({ data, fileName, onImport, onBack, isImporting }: ImportPreviewProps) {
  const preview = data.transactions.slice(0, PREVIEW_ROWS)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <FileSpreadsheet className="h-5 w-5 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{fileName}</span>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Badge variant="secondary">{data.transactions.length} transactions</Badge>
          <Badge variant="secondary">{data.categories.length} accounts</Badge>
          <Badge variant="secondary">{data.vendors.length} vendors</Badge>
        </div>
      </div>

      {/* Preview table */}
      <div className="rounded-lg border max-h-[280px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right w-[100px]">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs text-muted-foreground">{formatDate(t.date)}</TableCell>
                <TableCell className="text-sm truncate max-w-[200px]">{t.description}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{t.categoryName}</TableCell>
                <TableCell className={`text-right text-sm font-mono ${t.amount >= 0 ? 'text-emerald-600' : ''}`}>
                  {t.amount < 0 ? '-' : ''}{formatCurrency(t.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.transactions.length > PREVIEW_ROWS && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {PREVIEW_ROWS} of {data.transactions.length} transactions
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={onImport} disabled={isImporting}>
          {isImporting ? 'Importing...' : `Import ${data.transactions.length} transactions`}
        </Button>
      </div>
    </div>
  )
}
