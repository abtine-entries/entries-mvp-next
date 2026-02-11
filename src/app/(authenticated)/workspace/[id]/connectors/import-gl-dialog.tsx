'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GLImportFlow } from '@/components/gl-import/gl-import-flow'
import { FileSpreadsheet } from 'lucide-react'

interface ImportGLDialogProps {
  workspaceId: string
}

export function ImportGLDialog({ workspaceId }: ImportGLDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-auto p-4 w-full justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Import General Ledger</div>
              <div className="text-xs text-muted-foreground">Upload a CSV export from QuickBooks or Xero</div>
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import General Ledger</DialogTitle>
          <DialogDescription>
            Import transactions, accounts, and vendors from a GL CSV export.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <GLImportFlow
            workspaceId={workspaceId}
            onComplete={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
