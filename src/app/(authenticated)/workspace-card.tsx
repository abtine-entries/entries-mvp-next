import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import type { WorkspaceWithCounts } from './actions'

function formatLastSync(date: Date | null): string {
  if (!date) {
    return 'Never synced'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return 'Just now'
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function WorkspaceCard({
  workspace,
}: {
  workspace: WorkspaceWithCounts
}) {
  return (
    <Link href={`/workspace/${workspace.id}/esme`} className="block">
      <Card className="transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer">
        <CardHeader>
          <CardTitle>{workspace.name}</CardTitle>
          <CardDescription>
            Last sync: {formatLastSync(workspace.lastSyncAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span
              className={
                workspace.pendingCount > 0
                  ? 'text-yellow-600 font-medium'
                  : 'text-muted-foreground'
              }
            >
              {workspace.pendingCount} pending
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
