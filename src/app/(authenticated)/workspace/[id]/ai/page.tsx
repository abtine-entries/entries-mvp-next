import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Sparkles } from 'lucide-react'
import { EntriesAIChat } from './entries-ai-chat'

interface AIPageProps {
  params: Promise<{ id: string }>
}

export default async function AIPage({ params }: AIPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Entries AI', icon: <Sparkles className="h-4 w-4" /> },
        ]}
      />
      <EntriesAIChat workspaceName={workspace.name} />
    </div>
  )
}
