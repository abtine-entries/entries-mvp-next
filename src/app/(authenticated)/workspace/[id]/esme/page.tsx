import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Sparkles } from 'lucide-react'
import { EsmeChat } from './esme-chat'
import type { SerializedAlert } from './esme-chat'
import { org } from '@/lib/config'

interface EsmePageProps {
  params: Promise<{ id: string }>
}

export default async function EsmePage({ params }: EsmePageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const messages = await prisma.esmeMessage.findMany({
    where: { workspaceId: id },
    orderBy: { createdAt: 'asc' },
  })

  // Extract alertIds from message metadata
  const alertIds: string[] = []
  for (const m of messages) {
    if (m.metadata) {
      try {
        const parsed = JSON.parse(m.metadata)
        if (parsed.alertId) alertIds.push(parsed.alertId)
      } catch {
        // ignore invalid JSON
      }
    }
  }

  // Batch-fetch alerts referenced by messages
  const alertsMap: Record<string, SerializedAlert> = {}
  if (alertIds.length > 0) {
    const alerts = await prisma.alert.findMany({
      where: { id: { in: alertIds } },
    })
    for (const a of alerts) {
      alertsMap[a.id] = {
        id: a.id,
        type: a.type,
        priority: a.priority,
        status: a.status,
        title: a.title,
        body: a.body,
        responseType: a.responseType,
        responseOptions: a.responseOptions,
        responseValue: a.responseValue,
      }
    }
  }

  const serializedMessages = messages.map((m) => ({
    id: m.id,
    role: m.role as 'esme' | 'user',
    content: m.content,
    metadata: m.metadata,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: org.name, href: '/', icon: <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">{org.initials}</span> },
          { label: workspace.name, href: `/workspace/${workspace.id}/esme`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Esme', icon: <Sparkles className="h-4 w-4" /> },
        ]}
      />
      <EsmeChat workspaceId={workspace.id} workspaceName={workspace.name} initialMessages={serializedMessages} alertsMap={alertsMap} />
    </div>
  )
}
