import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Sparkles } from 'lucide-react'
import { EsmeCanvas } from './esme-canvas'
import { org } from '@/lib/config'
import { generateDailyBriefing } from './actions'
import type {
  CanvasBlock,
  SerializedAlert,
  TextBlock,
  AlertBlock,
  BriefingBlock,
  InsightBlock,
  ActionBlock,
  UserMessageBlock,
} from './types'

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

  // Check if a briefing exists for today and create one if not
  const today = new Date().toISOString().split('T')[0]
  const existingBriefing = await prisma.esmeMessage.findFirst({
    where: {
      workspaceId: id,
      role: 'esme',
      metadata: { contains: `"briefingDate":"${today}"` },
    },
  })

  if (!existingBriefing) {
    const briefingData = await generateDailyBriefing(id)
    await prisma.esmeMessage.create({
      data: {
        workspaceId: id,
        role: 'esme',
        content: briefingData.summary,
        metadata: JSON.stringify({
          blockType: 'briefing',
          briefingDate: today,
          greeting: briefingData.greeting,
          summary: briefingData.summary,
          stats: briefingData.stats,
        }),
      },
    })
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
        createdAt: a.createdAt.toISOString(),
      }
    }
  }

  // Parse messages into typed CanvasBlock[]
  const blocks: CanvasBlock[] = messages.map((m) => {
    const createdAt = m.createdAt.toISOString()
    let parsed: Record<string, unknown> | null = null
    if (m.metadata) {
      try {
        parsed = JSON.parse(m.metadata)
      } catch {
        // ignore invalid JSON
      }
    }

    const blockType = parsed?.blockType as string | undefined

    // User messages
    if (m.role === 'user') {
      return {
        type: 'user_message',
        id: m.id,
        content: m.content,
        createdAt,
      } satisfies UserMessageBlock
    }

    // Esme messages — determine block type from metadata
    switch (blockType) {
      case 'alert': {
        const alertId = parsed?.alertId as string | undefined
        const alert = alertId ? alertsMap[alertId] : undefined
        if (alert) {
          return {
            type: 'alert',
            id: m.id,
            content: m.content,
            alert,
            createdAt,
          } satisfies AlertBlock
        }
        // Fallback to text if alert not found
        return {
          type: 'text',
          id: m.id,
          content: m.content,
          createdAt,
        } satisfies TextBlock
      }

      case 'briefing': {
        return {
          type: 'briefing',
          id: m.id,
          content: m.content,
          greeting: (parsed?.greeting as string) ?? '',
          summary: (parsed?.summary as string) ?? '',
          stats: (parsed?.stats as BriefingBlock['stats']) ?? [],
          createdAt,
        } satisfies BriefingBlock
      }

      case 'insight': {
        return {
          type: 'insight',
          id: m.id,
          content: m.content,
          data: (parsed?.data as InsightBlock['data']) ?? undefined,
          createdAt,
        } satisfies InsightBlock
      }

      case 'action': {
        return {
          type: 'action',
          id: m.id,
          content: m.content,
          actionType: (parsed?.actionType as string) ?? '',
          actionData: (parsed?.actionData as ActionBlock['actionData']) ?? undefined,
          actionStatus: (parsed?.actionStatus as ActionBlock['actionStatus']) ?? 'pending',
          createdAt,
        } satisfies ActionBlock
      }

      default: {
        // No blockType or unknown blockType — default to text
        // Also handles legacy messages with alertId but no blockType
        const alertId = parsed?.alertId as string | undefined
        const alert = alertId ? alertsMap[alertId] : undefined
        if (alert) {
          return {
            type: 'alert',
            id: m.id,
            content: m.content,
            alert,
            createdAt,
          } satisfies AlertBlock
        }
        return {
          type: 'text',
          id: m.id,
          content: m.content,
          createdAt,
        } satisfies TextBlock
      }
    }
  })

  // Fetch ALL active alerts for the alert tray (includes snoozed with expired snoozedUntil)
  const now = new Date()
  const activeAlerts = await prisma.alert.findMany({
    where: {
      workspaceId: id,
      OR: [
        { status: 'active' },
        { status: 'snoozed', snoozedUntil: { lt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const serializedAlerts: SerializedAlert[] = activeAlerts.map((a) => ({
    id: a.id,
    type: a.type,
    priority: a.priority,
    status: a.status,
    title: a.title,
    body: a.body,
    responseType: a.responseType,
    responseOptions: a.responseOptions,
    responseValue: a.responseValue,
    createdAt: a.createdAt.toISOString(),
  }))

  // Sort: requires_action first, then fyi
  serializedAlerts.sort((a, b) => {
    if (a.priority === 'requires_action' && b.priority !== 'requires_action') return -1
    if (a.priority !== 'requires_action' && b.priority === 'requires_action') return 1
    return 0
  })

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: org.name, href: '/', icon: <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">{org.initials}</span> },
          { label: workspace.name, href: `/workspace/${workspace.id}/esme`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Esme', icon: <Sparkles className="h-4 w-4" /> },
        ]}
      />
      <EsmeCanvas workspaceId={workspace.id} workspaceName={workspace.name} initialBlocks={blocks} alerts={serializedAlerts} />
    </div>
  )
}
