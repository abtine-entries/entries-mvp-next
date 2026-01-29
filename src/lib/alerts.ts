import { prisma } from '@/lib/prisma'

type AnomalySeverity = 'high' | 'medium' | 'low'

type AnomalyType =
  | 'duplicate_transaction'
  | 'unusual_amount'
  | 'timing_mismatch'
  | 'uncategorized_recurring'
  | 'vendor_mismatch'

interface AnomalyAlertData {
  type: AnomalyType
  severity: AnomalySeverity
  description: string
  transactionId?: string | null
}

function getAnomalyTitle(type: AnomalyType, description: string): string {
  switch (type) {
    case 'duplicate_transaction':
      return `Duplicate transaction detected: ${description}`
    case 'unusual_amount':
      return `Unusual amount: ${description}`
    case 'timing_mismatch':
      return `Timing mismatch on vendor payment: ${description}`
    case 'uncategorized_recurring':
      return `Uncategorized recurring charge: ${description}`
    case 'vendor_mismatch':
      return `Vendor name mismatch: ${description}`
    default:
      return `Anomaly detected: ${description}`
  }
}

/**
 * Create an alert from a detected anomaly.
 * Returns the created Alert, or null if a duplicate active alert already exists
 * for the same entity.
 */
export async function createAnomalyAlert(
  workspaceId: string,
  data: AnomalyAlertData
) {
  const entityType = data.transactionId ? 'transaction' : 'anomaly'
  const entityId = data.transactionId ?? null

  // Check for existing active alert with same entity to prevent duplicates
  if (entityId) {
    const existing = await prisma.alert.findFirst({
      where: {
        workspaceId,
        entityType,
        entityId,
        status: { not: 'resolved' },
      },
    })
    if (existing) {
      return null
    }
  }

  const priority = data.severity === 'high' ? 'requires_action' : 'fyi'
  const title = getAnomalyTitle(data.type, data.description)

  return prisma.alert.create({
    data: {
      workspaceId,
      type: 'anomaly',
      priority,
      title,
      body: data.description,
      entityType,
      entityId,
    },
  })
}

type AIQuestionResponseType = 'confirm' | 'select' | 'text'

interface AIQuestionAlertData {
  title: string
  body: string
  responseType: AIQuestionResponseType
  responseOptions?: string[]
  entityType?: string | null
  entityId?: string | null
}

/**
 * Create an alert when the AI has a question for the accountant.
 * AI questions always have priority 'requires_action' because the AI is blocked
 * until the accountant responds.
 */
export async function createAIQuestionAlert(
  workspaceId: string,
  data: AIQuestionAlertData
) {
  return prisma.alert.create({
    data: {
      workspaceId,
      type: 'ai_question',
      priority: 'requires_action',
      title: data.title,
      body: data.body,
      responseType: data.responseType,
      responseOptions:
        data.responseType === 'select' && data.responseOptions
          ? JSON.stringify(data.responseOptions)
          : null,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    },
  })
}
