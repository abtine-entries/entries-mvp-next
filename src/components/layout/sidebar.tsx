'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
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
  ChevronUp,
  Plus,
  Check,
  Building2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
    { label: 'Search', href: '/search', icon: Search },
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
        'flex h-screen flex-col border-r border-border bg-[hsl(220,7%,15%)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/entries-icon.png"
              alt="Entries"
              width={24}
              height={24}
              className="h-6 w-6 rounded-[3px] flex-shrink-0"
            />
            <span className="font-heading text-sm font-semibold text-sidebar-accent-foreground">Entries</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <Image
              src="/entries-icon.png"
              alt="Entries"
              width={24}
              height={24}
              className="h-6 w-6 rounded-[3px]"
            />
          </Link>
        )}
      </div>

      {/* Top nav items */}
      <nav className="p-2">
        {topNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive(item.href)
                ? 'bg-[hsl(220,7%,18%)] text-foreground'
                : 'text-muted-foreground hover:bg-[hsl(220,7%,18%)] hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Workspace Switcher */}
      <div className="px-2 py-2">
        <Popover open={workspaceSwitcherOpen} onOpenChange={setWorkspaceSwitcherOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between font-medium',
                collapsed ? 'px-2' : 'px-3'
              )}
            >
              {collapsed ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <>
                  <span className="truncate">{currentWorkspace?.name || 'Select Client'}</span>
                  {workspaceSwitcherOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 opacity-50" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  )}
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start" side="right">
            <div className="p-2">
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="max-h-64 overflow-auto">
              {filteredWorkspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}/event-feed`}
                  onClick={() => {
                    setWorkspaceSwitcherOpen(false)
                    setSearchQuery('')
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted',
                    currentWorkspace?.id === ws.id && 'bg-[hsl(214,50%,25%)]'
                  )}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{ws.name}</span>
                  {currentWorkspace?.id === ws.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </Link>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Link
                href="/?create=true"
                onClick={() => setWorkspaceSwitcherOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Workspace-specific navigation */}
      {currentWorkspace && (
        <nav className="flex-1 overflow-auto px-2 py-2">
          {getWorkspaceNavSections(currentWorkspace.id).map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive(item.href)
                      ? 'bg-[hsl(220,7%,18%)] text-foreground'
                      : 'text-muted-foreground hover:bg-[hsl(220,7%,18%)] hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}

      {/* Collapse button */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-foreground',
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
