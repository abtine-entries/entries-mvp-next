'use client'

import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export type EntityType = 'source' | 'vendor' | 'category' | 'document'

const entityTypeLabels: Record<EntityType, string> = {
  source: 'Source Details',
  vendor: 'Vendor Details',
  category: 'Category Details',
  document: 'Document Details',
}

export interface EntityDetailSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityType
  entityId: string
  workspaceId: string
  loading?: boolean
  error?: string | null
  children?: ReactNode
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

function ErrorState({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <AlertCircle className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

export function EntityDetailSidebar({
  open,
  onOpenChange,
  entityType,
  loading,
  error,
  children,
}: EntityDetailSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetDescription>{entityTypeLabels[entityType]}</SheetDescription>
          <SheetTitle className="text-lg leading-snug pr-6">
            {entityTypeLabels[entityType]}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState
            message={error}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="px-4 pb-6">{children}</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
