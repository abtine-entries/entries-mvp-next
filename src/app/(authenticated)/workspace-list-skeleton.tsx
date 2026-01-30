import { Skeleton } from '@/components/ui/skeleton'

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
      <Skeleton className="h-4 w-36" />
      <div className="flex-1" />
      <Skeleton className="h-5 w-12 rounded-full" />
      <Skeleton className="h-5 w-12 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function ClientTableSkeleton() {
  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border">
        <Skeleton className="h-3 w-20" />
        <div className="flex-1" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      <TableRowSkeleton />
      <TableRowSkeleton />
      <TableRowSkeleton />
    </div>
  )
}
