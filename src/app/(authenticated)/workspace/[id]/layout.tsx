import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true, qboStatus: true },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to workspaces</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        </div>
        <Badge variant="default" className="bg-green-600 hover:bg-green-600">
          {workspace.qboStatus === 'connected' ? 'QBO Connected' : 'QBO Disconnected'}
        </Badge>
      </div>
      {children}
    </div>
  )
}
