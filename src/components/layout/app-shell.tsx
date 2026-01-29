'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

interface Workspace {
  id: string
  name: string
}

interface AppShellProps {
  children: React.ReactNode
  workspaces: Workspace[]
}

export function AppShell({ children, workspaces }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar workspaces={workspaces} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
