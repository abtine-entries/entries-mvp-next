'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { EsmeAlertProvider } from '@/components/esme/esme-alert-provider'
import type { SerializedAlert } from '@/app/(authenticated)/workspace/[id]/esme/types'

interface Workspace {
  id: string
  name: string
}

interface UserInfo {
  name: string | null
  email: string
}

interface AppShellProps {
  children: React.ReactNode
  workspaces: Workspace[]
  user: UserInfo
  alertCounts?: Record<string, number>
  alertsByWorkspace?: Record<string, SerializedAlert[]>
}

export function AppShell({
  children,
  workspaces,
  user,
  alertCounts,
  alertsByWorkspace,
}: AppShellProps) {
  return (
    <EsmeAlertProvider initialAlerts={alertsByWorkspace ?? {}}>
      <SidebarProvider>
        <AppSidebar workspaces={workspaces} user={user} alertCounts={alertCounts} />
        <SidebarInset className="min-w-0">{children}</SidebarInset>
      </SidebarProvider>
    </EsmeAlertProvider>
  )
}
