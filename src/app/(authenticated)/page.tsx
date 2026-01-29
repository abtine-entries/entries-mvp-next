import { Suspense } from 'react'
import { getWorkspaces, getRecentActivity, getGlobalAlertsSummary } from './actions'
import { ClientRow } from './client-row'
import { WorkspaceListSkeleton } from './workspace-list-skeleton'
import { CreateWorkspaceModal } from './create-workspace-modal'
import { PageHeader } from '@/components/layout'
import { HomeGreeting } from './home-greeting'
import { RecentActivityFeed } from './recent-activity-feed'
import { AlertsSummary } from './alerts-summary'
import { Home, Plus, Building2, Activity, Bell } from 'lucide-react'
import { org } from '@/lib/config'
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

async function AlertsBriefing() {
  const workspaces = await getGlobalAlertsSummary()
  return <AlertsSummary workspaces={workspaces} />
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
          { label: org.name, href: '/', icon: <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">{org.initials}</span> },
          { label: 'Home', icon: <Home className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="space-y-10">
          {/* Greeting */}
          <HomeGreeting />

          {/* Alerts Briefing */}
          <section>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Bell className="h-4 w-4" />
              Alerts
            </p>
            <Suspense fallback={<div className="bg-card border border-border rounded-lg p-4 text-muted-foreground text-sm">Loading alerts...</div>}>
              <AlertsBriefing />
            </Suspense>
          </section>

          {/* Clients Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Clients
              </p>
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
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              Recent activity
            </p>
            <Suspense fallback={<div className="bg-card border border-border rounded-lg p-4 text-muted-foreground text-sm">Loading activity...</div>}>
              <RecentActivity />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  )
}
