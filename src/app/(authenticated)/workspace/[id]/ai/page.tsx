import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
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
          { label: 'Entries', href: '/' },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed` },
          { label: 'Entries AI' },
        ]}
      />
      <EntriesAIChat workspaceName={workspace.name} />
    </div>
  )
}
