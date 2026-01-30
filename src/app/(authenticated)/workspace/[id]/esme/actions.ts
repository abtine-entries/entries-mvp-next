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
      },
    })

    // Determine reply based on keywords
    const reply = hasBillKeyword(trimmed)
      ? await getBillSummaryReply(workspaceId)
      : pickEsmeReply()

    await prisma.esmeMessage.create({
      data: {
        workspaceId,
        role: 'esme',
        content: reply,
      },
    })

    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send Esme message:', error)
    return { success: false, error: 'Failed to send message' }
  }
}
