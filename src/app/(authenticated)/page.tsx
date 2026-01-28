import { Suspense } from 'react'
import { getWorkspaces, getRecentActivity } from './actions'
import { ClientRow } from './client-row'
import { WorkspaceListSkeleton } from './workspace-list-skeleton'
import { CreateWorkspaceModal } from './create-workspace-modal'
import { PageHeader } from '@/components/layout'
import { HomeGreeting } from './home-greeting'
import { RecentActivityFeed } from './recent-activity-feed'
import { Home, Plus } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

async function ClientList() {
  const workspaces = await getWorkspaces()

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No clients yet. Create your first client workspace to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      {workspaces.map((workspace) => (
        <ClientRow key={workspace.id} workspace={workspace} />
      ))}
    </div>
  )
}

async function RecentActivity() {
  const events = await getRecentActivity()
  return <RecentActivityFeed events={events} />
}

export default function HomePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Writeoff', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: 'Home', icon: <Home className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-10">
          {/* Greeting */}
          <HomeGreeting />

          {/* Clients Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Clients
              </h3>
              <CreateWorkspaceModal
                trigger={
                  <Button size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Client
                  </Button>
                }
              />
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Suspense fallback={<WorkspaceListSkeleton />}>
                <ClientList />
              </Suspense>
            </div>
          </section>

          {/* Recent Activity Section */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Recent activity
            </h3>
            <Suspense fallback={<div className="bg-card border border-border rounded-lg p-4 text-muted-foreground text-sm">Loading activity...</div>}>
              <RecentActivity />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  )
}
