'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ClipboardList, AlertTriangle, RefreshCw, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface QuickActionsProps {
  workspaceId: string
}

export function QuickActions({ workspaceId }: QuickActionsProps) {
  const handleSyncNow = () => {
    toast.success('Sync initiated', {
      description: 'Your data is being synchronized with QuickBooks.',
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href={`/workspace/${workspaceId}/reconciliation`}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Review Pending
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/workspace/${workspaceId}/anomalies`}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          View Anomalies
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/workspace/${workspaceId}/rules`}>
          <BookOpen className="mr-2 h-4 w-4" />
          Manage Rules
        </Link>
      </Button>
      <Button variant="outline" onClick={handleSyncNow}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Sync Now
      </Button>
    </div>
  )
}
