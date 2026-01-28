import Link from 'next/link'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { WorkspaceWithCounts } from './actions'

export function ClientRow({
  workspace,
}: {
  workspace: WorkspaceWithCounts
}) {
  const hasNotifications = workspace.pendingCount > 0

  return (
    <Link
      href={`/workspace/${workspace.id}/event-feed`}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{workspace.name}</span>
        {hasNotifications && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            {workspace.pendingCount}
          </span>
        )}
      </div>

      {/* Connected app logos */}
      {workspace.connectors && workspace.connectors.length > 0 && (
        <div className="flex items-center gap-1">
          {workspace.connectors.map((connector) => (
            <ConnectorLogo
              key={connector}
              connector={connector}
              size="sm"
            />
          ))}
        </div>
      )}
    </Link>
  )
}
