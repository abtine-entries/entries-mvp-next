'use client'

import { useState, createContext, useContext, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { SearchModal } from './search-modal'
import { TooltipProvider } from '@/components/ui/tooltip'

interface Workspace {
  id: string
  name: string
}

interface AppShellContextValue {
  collapsed: boolean
  toggleCollapse: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within an AppShell')
  }
  return context
}

interface AppShellProps {
  children: React.ReactNode
  workspaces: Workspace[]
}

export function AppShell({
  children,
  workspaces,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return (
    <AppShellContext.Provider value={{ collapsed, toggleCollapse }}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar
            workspaces={workspaces}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onSearchClick={() => setSearchOpen(true)}
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <SearchModal
            open={searchOpen}
            onOpenChange={setSearchOpen}
            workspaces={workspaces}
          />
        </div>
      </TooltipProvider>
    </AppShellContext.Provider>
  )
}
