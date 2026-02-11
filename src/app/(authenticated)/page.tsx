import { Suspense } from 'react'
import { getWorkspaces, getRecentActivity, getGlobalAlertsSummary } from './actions'
import { ClientTable } from './client-table'
import { ClientTableSkeleton } from './workspace-list-skeleton'
import { PageHeader } from '@/components/layout'
import { HomeGreeting } from './home-greeting'
import { RecentActivityFeed } from './recent-activity-feed'
import { AlertsSummary } from './alerts-summary'
import Image from 'next/image'
import Link from 'next/link'
import { Home, Plus, Building2, Activity } from 'lucide-react'
import { org } from '@/lib/config'
import { Button } from '@/components/ui/button'

async function ClientList() {
  const workspaces = await getWorkspaces()

  return <ClientTable workspaces={workspaces} />
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
          { label: org.name, href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" unoptimized /> },
          { label: 'Home', icon: <Home className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="space-y-10">
          {/* Greeting */}
          <HomeGreeting />

          {/* Clients Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Clients
              </p>
              <Button size="sm" className="h-8" asChild>
                <Link href="/onboarding">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Client
                </Link>
              </Button>
            </div>
            <Suspense fallback={<ClientTableSkeleton />}>
              <ClientList />
            </Suspense>
          </section>

          {/* Esme Summary */}
          <section>
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
              <AlertsBriefing />
            </Suspense>
          </section>

          {/* Recent Activity Section */}
          <section>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              Recent activity
            </p>
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading activity...</div>}>
              <RecentActivity />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  )
}
