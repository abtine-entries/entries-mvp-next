'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  Activity,
  Plug,
  FileText,
  Sparkles,
  GitCompare,
  Tags,
  BookOpen,
  Search,
} from 'lucide-react'
import { org } from '@/lib/config'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar'
import { SearchModal } from './search-modal'

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
      ],
    },
    {
      title: 'Productivity',
      items: [
        { label: 'Entries AI', href: `/workspace/${workspaceId}/ai`, icon: Sparkles },
        { label: 'Reconcile', href: `/workspace/${workspaceId}/reconcile`, icon: GitCompare },
        { label: 'Categorize', href: `/workspace/${workspaceId}/categorize`, icon: Tags },
      ],
    },
    {
      title: 'Knowledge',
      items: [
        { label: 'Rules', href: `/workspace/${workspaceId}/rules`, icon: BookOpen },
      ],
    },
  ]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  workspaces: Workspace[]
}

export function AppSidebar({ workspaces, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  // Extract workspace ID from URL path
  const currentWorkspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] ?? null
  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId)

  const isActive = (href: string) => pathname === href

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Image
                      src="/entries-icon.png"
                      alt={org.name}
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{org.name}</span>
                    {currentWorkspace && (
                      <span className="truncate text-xs text-sidebar-foreground/70">
                        {currentWorkspace.name}
                      </span>
                    )}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
                  {section.items.map((item) => (
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
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
        </SidebarContent>

        <SidebarFooter />
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
