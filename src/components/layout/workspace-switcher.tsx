'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { org } from '@/lib/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

interface Workspace {
  id: string
  name: string
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace | undefined
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  return (
    <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src="/entries-icon.png"
                    alt={org.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                    unoptimized
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{org.name}</span>
                  {currentWorkspace && (
                    <span className="truncate text-xs">
                      {currentWorkspace.name}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => router.push(`/workspace/${workspace.id}`)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <span className="text-xs font-medium">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => router.push('/onboarding')}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Create Workspace
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
    </SidebarMenu>
  )
}
