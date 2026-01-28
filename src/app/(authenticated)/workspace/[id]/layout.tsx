import { notFound } from 'next/navigation'
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

  return <>{children}</>
}
