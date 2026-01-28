import { Suspense } from 'react'
import { getWorkspaces } from './actions'
import { WorkspaceCard } from './workspace-card'
import { WorkspaceListSkeleton } from './workspace-list-skeleton'
import { CreateWorkspaceModal } from './create-workspace-modal'

async function WorkspaceList() {
  const workspaces = await getWorkspaces()

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No workspaces yet. Create your first client workspace to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Workspaces</h2>
        <CreateWorkspaceModal />
      </div>
      <Suspense fallback={<WorkspaceListSkeleton />}>
        <WorkspaceList />
      </Suspense>
    </div>
  )
}
