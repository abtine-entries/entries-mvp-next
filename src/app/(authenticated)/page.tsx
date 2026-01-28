import { Suspense } from 'react'
import { getWorkspaces } from './actions'
import { WorkspaceCard } from './workspace-card'
import { WorkspaceListSkeleton } from './workspace-list-skeleton'
import { CreateWorkspaceModal } from './create-workspace-modal'
import { PageHeader } from '@/components/layout'

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
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/' },
          { label: 'Clients' },
        ]}
        actions={<CreateWorkspaceModal />}
      />
      <div className="flex-1 p-6">
        <Suspense fallback={<WorkspaceListSkeleton />}>
          <WorkspaceList />
        </Suspense>
      </div>
    </div>
  )
}
