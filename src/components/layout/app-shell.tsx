'use client'

import { useState, createContext, useContext, useCallback } from 'react'
import { Sidebar } from './sidebar'

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

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return (
    <AppShellContext.Provider value={{ collapsed, toggleCollapse }}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          workspaces={workspaces}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AppShellContext.Provider>
  )
}
