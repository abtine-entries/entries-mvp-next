'use client'

import { useState, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Activity,
  Plug,
  FileText,
  Sparkles,
  GitCompare,
  Tags,
  BookOpen,
  ChevronDown,
  Plus,
  Check,
  Building2,
  User,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { org } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Workspace {
  id: string
  name: string
}

interface SidebarProps {
  workspaces: Workspace[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onSearchClick?: () => void
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

export function Sidebar({
  workspaces,
  collapsed = false,
  onToggleCollapse,
  onSearchClick,
}: SidebarProps) {
  const pathname = usePathname()
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Extract workspace ID from URL path
  const currentWorkspaceId = useMemo(() => {
    const match = pathname.match(/\/workspace\/([^/]+)/)
    return match ? match[1] : null
  }, [pathname])

  // Find current workspace from the list
  const currentWorkspace = useMemo(() => {
    return workspaces.find((ws) => ws.id === currentWorkspaceId)
  }, [workspaces, currentWorkspaceId])

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Navigation sections based on the screenshot
  const topNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
  ]

  const getWorkspaceNavSections = (workspaceId: string): NavSection[] => [
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

  const isActive = (href: string) => pathname === href

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Top group: Logo + Home/Search + Workspace Switcher */}
      <div className={cn('flex flex-col gap-1 pt-3 pb-6 px-3')}>
        {/* Org logo */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 py-1.5 mb-4 rounded-md min-h-[36px]',
            collapsed ? 'justify-center px-2' : 'px-3'
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
            {org.initials}
          </span>
          {!collapsed && (
            <span className="font-heading text-sm font-semibold text-sidebar-accent-foreground truncate">
              {org.name}
            </span>
          )}
        </Link>

        {/* Home */}
        {topNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm min-h-[36px] transition-colors duration-150',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Search */}
        <button
          onClick={onSearchClick}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm min-h-[36px] transition-colors duration-150 w-full text-left',
            'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Search</span>}
        </button>

        {/* Workspace Switcher */}
        <Popover open={workspaceSwitcherOpen} onOpenChange={setWorkspaceSwitcherOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center rounded-md text-sm transition-colors min-h-[44px] w-full',
                'bg-sidebar-accent text-sidebar-accent-foreground font-semibold hover:bg-sidebar-accent/80',
                collapsed ? 'justify-center py-2' : 'justify-between py-2 px-3'
              )}
            >
              {collapsed ? (
                <User className="h-4 w-4" />
              ) : (
                <>
                  <span className="truncate">{currentWorkspace?.name || 'Select Client'}</span>
                  <ChevronDown className={cn(
                    'h-4 w-4 flex-shrink-0 ml-2 transition-transform',
                    workspaceSwitcherOpen && 'rotate-180'
                  )} />
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0"
            align="start"
            side={collapsed ? 'right' : undefined}
            sideOffset={collapsed ? 8 : 4}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            {/* Workspace List */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}/event-feed`}
                    onClick={() => {
                      setWorkspaceSwitcherOpen(false)
                      setSearchQuery('')
                    }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors min-h-[36px]',
                      currentWorkspace?.id === ws.id
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-left">{ws.name}</span>
                    {currentWorkspace?.id === ws.id && (
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </Link>
                ))
              ) : searchQuery ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No clients match "{searchQuery}"
                </div>
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No clients found
                </div>
              )}
            </div>

            {/* Add Client Button */}
            <div className="border-t border-border p-2">
              <Link
                href="/?create=true"
                onClick={() => setWorkspaceSwitcherOpen(false)}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors min-h-[36px]',
                  'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Workspace-specific navigation */}
      {currentWorkspace ? (
        <nav className="flex-1 overflow-auto px-3 pt-4 pb-2">
          {getWorkspaceNavSections(currentWorkspace.id).map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <div className="mb-1 px-3 text-xs tracking-wider text-sidebar-foreground/70">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm min-h-[36px] transition-colors duration-150',
                    isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      {/* Collapse button — always pinned to bottom */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors duration-150',
            collapsed && 'justify-center px-0'
          )}
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
