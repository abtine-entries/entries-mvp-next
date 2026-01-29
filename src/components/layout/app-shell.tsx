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
}

export function AppShell({ children, workspaces, user }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar workspaces={workspaces} user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
