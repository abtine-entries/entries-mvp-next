'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

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
}

export function AppShell({ children, workspaces, user, alertCounts }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar workspaces={workspaces} user={user} alertCounts={alertCounts} />
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  )
}
