'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Activity,
  Plug,
  FileText,
  Table2,
  Tags,
  BookOpen,
  Search,
  Settings,
} from 'lucide-react'
import { EsmeAvatar } from '@/components/esme-avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar'
import { SearchModal } from './search-modal'
import { WorkspaceSwitcher } from './workspace-switcher'
import { NavUser } from './nav-user'

interface Workspace {
  id: string
  name: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

function getWorkspaceNavSections(workspaceId: string): NavSection[] {
  return [
    {
      title: 'Data',
      items: [
        { label: 'Event Feed', href: `/workspace/${workspaceId}/event-feed`, icon: Activity },
        { label: 'Data Connectors', href: `/workspace/${workspaceId}/connectors`, icon: Plug },
        { label: 'Docs', href: `/workspace/${workspaceId}/docs`, icon: FileText },
        { label: 'Data Explorer', href: `/workspace/${workspaceId}/explorer`, icon: Table2 },
      ],
    },
    {
      title: 'Productivity',
      items: [
        { label: 'Esme', href: `/workspace/${workspaceId}/esme`, icon: EsmeAvatar },
        { label: 'Categorize', href: `/workspace/${workspaceId}/categorize`, icon: Tags },
      ],
    },
    {
      title: 'Knowledge',
      items: [
        { label: 'Rules', href: `/workspace/${workspaceId}/rules`, icon: BookOpen },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Settings', href: `/workspace/${workspaceId}/settings`, icon: Settings },
      ],
    },
  ]
}

interface UserInfo {
  name: string | null
  email: string
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  workspaces: Workspace[]
  user: UserInfo
  alertCounts?: Record<string, number>
}

export function AppSidebar({ workspaces, user, alertCounts, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  // Extract workspace ID from URL path
  const currentWorkspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] ?? null
  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId)
  const currentAlertCount = currentWorkspaceId ? (alertCounts?.[currentWorkspaceId] ?? 0) : 0

  const isActive = (href: string) => pathname === href

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
          />
        </SidebarHeader>

        <SidebarContent>
          {/* Top nav: Home + Search */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/')} tooltip="Home">
                  <Link href="/">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Search"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Workspace-specific navigation */}
          {currentWorkspace &&
            getWorkspaceNavSections(currentWorkspace.id).map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const badgeCount = item.label === 'Esme' ? currentAlertCount : 0
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {badgeCount > 0 && (
                          <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        workspaces={workspaces}
      />
    </>
  )
}
