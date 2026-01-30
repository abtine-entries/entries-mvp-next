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

function pickEsmeReply(): string {
  return ESME_REPLIES[Math.floor(Math.random() * ESME_REPLIES.length)]
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

    // Auto-generate Esme acknowledgment reply
    await prisma.esmeMessage.create({
      data: {
        workspaceId,
        role: 'esme',
        content: pickEsmeReply(),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/esme`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send Esme message:', error)
    return { success: false, error: 'Failed to send message' }
  }
}
