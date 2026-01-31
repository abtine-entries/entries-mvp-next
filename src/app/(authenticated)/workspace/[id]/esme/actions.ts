'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface SendMessageResult {
  success: boolean
  error?: string
}

const ESME_REPLIES = [
  "I received your message. Let me look into that.",
  "Got it — I'll check on that for you.",
  "Thanks for letting me know. I'm on it.",
  "Understood. Let me pull up the details.",
  "I'll review that and get back to you shortly.",
]

const BILL_KEYWORDS = ['bills', 'invoices', 'payable', 'pay', 'payment', 'wise', 'batch']

function pickEsmeReply(): string {
  return ESME_REPLIES[Math.floor(Math.random() * ESME_REPLIES.length)]
}

function hasBillKeyword(message: string): boolean {
  const lower = message.toLowerCase()
  return BILL_KEYWORDS.some((kw) => lower.includes(kw))
}

async function getBillSummaryReply(workspaceId: string): Promise<string> {
  const authorizedBills = await prisma.bill.findMany({
    where: { workspaceId, status: 'authorized' },
  })

  if (authorizedBills.length === 0) {
    return 'No authorized bills found at the moment. Check back after your next Xero sync.'
  }

  const total = authorizedBills.reduce(
    (sum, b) => sum + b.amount.toNumber(),
    0
  )
  const formattedTotal = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const vendorNames = new Set(authorizedBills.map((b) => b.vendorName))

  return `You have ${authorizedBills.length} authorized bills totaling ${formattedTotal} from ${vendorNames.size} vendors. [View Bills](/workspace/${workspaceId}/bills)`
}

export interface DailyBriefingData {
  greeting: string
  summary: string
  stats: { label: string; value: string; icon: string }[]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export async function generateDailyBriefing(
  workspaceId: string
): Promise<DailyBriefingData> {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Query active alerts (status='active' OR snoozed with expired snoozedUntil)
  const [requiresActionCount, fyiCount] = await Promise.all([
    prisma.alert.count({
      where: {
        workspaceId,
        priority: 'requires_action',
        OR: [
          { status: 'active' },
          { status: 'snoozed', snoozedUntil: { lt: now } },
        ],
      },
    }),
    prisma.alert.count({
      where: {
        workspaceId,
        priority: 'fyi',
        OR: [
          { status: 'active' },
          { status: 'snoozed', snoozedUntil: { lt: now } },
        ],
      },
    }),
  ])

  const totalAlerts = requiresActionCount + fyiCount

  // Query overdue bills
  const overdueBills = await prisma.bill.findMany({
    where: { workspaceId, status: 'overdue' },
    select: { amount: true },
  })
  const overdueCount = overdueBills.length
  const overdueTotal = overdueBills.reduce(
    (sum, b) => sum + b.amount.toNumber(),
    0
  )

  // Query uncategorized transactions
  const uncategorizedCount = await prisma.transaction.count({
    where: { workspaceId, categoryId: null },
  })

  // Query recent events (last 24h)
  const recentEventCount = await prisma.event.count({
    where: { workspaceId, createdAt: { gte: twentyFourHoursAgo } },
  })

  // Build stats (skip metrics with 0 value)
  const stats: { label: string; value: string; icon: string }[] = []

  if (totalAlerts > 0) {
    stats.push({
      label: 'Active alerts',
      value: `${totalAlerts} (${requiresActionCount} action, ${fyiCount} FYI)`,
      icon: 'Bell',
    })
  }

  if (overdueCount > 0) {
    const formattedAmount = overdueTotal.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
    stats.push({
      label: 'Overdue bills',
      value: `${overdueCount} (${formattedAmount})`,
      icon: 'DollarSign',
    })
  }

  if (uncategorizedCount > 0) {
    stats.push({
      label: 'Uncategorized',
      value: `${uncategorizedCount} transactions`,
      icon: 'Tag',
    })
  }

  if (recentEventCount > 0) {
    stats.push({
      label: 'Recent activity',
      value: `${recentEventCount} events (24h)`,
      icon: 'Activity',
    })
  }

  // Build summary
  const greeting = getGreeting()
  const parts: string[] = []

  if (totalAlerts > 0) {
    parts.push(
      `${requiresActionCount > 0 ? `${requiresActionCount} alert${requiresActionCount !== 1 ? 's' : ''} requiring action` : ''}${requiresActionCount > 0 && fyiCount > 0 ? ' and ' : ''}${fyiCount > 0 ? `${fyiCount} FYI notification${fyiCount !== 1 ? 's' : ''}` : ''}`
    )
  }

  if (overdueCount > 0) {
    const formattedAmount = overdueTotal.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
    parts.push(
      `${overdueCount} overdue bill${overdueCount !== 1 ? 's' : ''} totaling ${formattedAmount}`
    )
  }

  if (uncategorizedCount > 0) {
    parts.push(
      `${uncategorizedCount} transaction${uncategorizedCount !== 1 ? 's' : ''} waiting to be categorized`
    )
  }

  let summary: string
  if (parts.length === 0) {
    summary = "Everything looks good — no items needing attention right now. You're all caught up!"
  } else {
    summary = `You have ${parts.join(', ')}. ${recentEventCount > 0 ? `There were also ${recentEventCount} event${recentEventCount !== 1 ? 's' : ''} in the last 24 hours.` : ''}`
  }

  return { greeting, summary, stats }
}

export async function sendEsmeMessage(
  workspaceId: string,
  content: string
): Promise<SendMessageResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const trimmed = content.trim()
    if (!trimmed) {
      return { success: false, error: 'Message cannot be empty' }
    }

    // Save user message
    await prisma.esmeMessage.create({
      data: {
        workspaceId,
        role: 'user',
        content: trimmed,
        metadata: JSON.stringify({ blockType: 'user_message' }),
      },
    })

    // Determine reply based on keywords
    const isBillRelated = hasBillKeyword(trimmed)
    const reply = isBillRelated
      ? await getBillSummaryReply(workspaceId)
      : pickEsmeReply()

    const replyMetadata = isBillRelated
      ? { blockType: 'action' as const, actionType: 'view_bills', actionStatus: 'pending' as const }
      : { blockType: 'text' as const }

    await prisma.esmeMessage.create({
      data: {
        workspaceId,
        role: 'esme',
        content: reply,
        metadata: JSON.stringify(replyMetadata),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send Esme message:', error)
    return { success: false, error: 'Failed to send message' }
  }
}

const DROP_RESPONSES = [
  "Let me look into this alert for you...",
  "I'll review this and get back to you shortly.",
  "Got it — pulling up the details on this one.",
  "Looking into this now. I'll have more info soon.",
  "On it — let me check what's going on here.",
]

function pickDropResponse(): string {
  return DROP_RESPONSES[Math.floor(Math.random() * DROP_RESPONSES.length)]
}

export async function dropAlertToCanvas(
  workspaceId: string,
  alertId: string
): Promise<SendMessageResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check for duplicate — alert already on canvas
    const existing = await prisma.esmeMessage.findFirst({
      where: {
        workspaceId,
        metadata: { contains: `"alertId":"${alertId}"` },
      },
    })

    if (existing) {
      return { success: false, error: 'This alert is already on the canvas' }
    }

    // Verify alert exists
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { id: true, title: true },
    })

    if (!alert) {
      return { success: false, error: 'Alert not found' }
    }

    // Create alert block message
    await prisma.esmeMessage.create({
      data: {
        workspaceId,
        role: 'esme',
        content: `Alert: ${alert.title}`,
        metadata: JSON.stringify({
          blockType: 'alert' as const,
          alertId,
        }),
      },
    })

    // Create canned text response acknowledging the alert
    await prisma.esmeMessage.create({
      data: {
        workspaceId,
        role: 'esme',
        content: pickDropResponse(),
        metadata: JSON.stringify({ blockType: 'text' as const }),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to drop alert to canvas:', error)
    return { success: false, error: 'Failed to add alert to canvas' }
  }
}
