import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function WorkspaceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  )
}

export function WorkspaceListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <WorkspaceCardSkeleton />
      <WorkspaceCardSkeleton />
      <WorkspaceCardSkeleton />
    </div>
  )
}
