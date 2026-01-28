'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  userEmail: string
}

export function Header({ userEmail }: HeaderProps) {
  async function handleLogout() {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold">Entries</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
