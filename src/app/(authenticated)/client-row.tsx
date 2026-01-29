import Link from 'next/link'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import { Badge } from '@/components/ui/badge'
import type { WorkspaceWithCounts } from './actions'

export function ClientRow({
  workspace,
}: {
  workspace: WorkspaceWithCounts
}) {
  const hasNewEvents = workspace.newEventCount > 0

  return (
    <Link
      href={`/workspace/${workspace.id}/event-feed`}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{workspace.name}</span>
        {hasNewEvents && (
          <Badge className="rounded-full min-w-[20px] h-5 px-1.5 text-[11px]">
            {workspace.newEventCount}
          </Badge>
        )}
      </div>

      {/* Connected app logos */}
      {workspace.connectors && workspace.connectors.length > 0 && (
        <div className="flex items-center -space-x-2">
          {workspace.connectors.map((connector) => (
            <div key={connector} className="ring-2 ring-card rounded-full">
              <ConnectorLogo
                connector={connector}
                size="md"
              />
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}
