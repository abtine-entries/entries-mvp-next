'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ConnectorType } from '@/components/ui/connector-logo-config'

export type WorkspaceWithCounts = {
  id: string
  name: string
  lastSyncAt: Date | null
  pendingCount: number
  connectors: ConnectorType[]
}

export type RecentActivityEvent = {
  id: string
  occurredAt: Date
  source: string
  sourceLabel: string
  type: string
  description: string
  workspaceId: string
  workspaceName: string
}

export async function getWorkspaces(): Promise<WorkspaceWithCounts[]> {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  const workspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      transactions: {
        where: { status: 'pending' },
        select: { id: true },
      },
    },
  })

  return workspaces.map((workspace) => {
    // Parse connectors from the workspace connectors field (stored as JSON string)
    // For now, use mock data based on workspace name until we add the schema field
    const connectors = getWorkspaceConnectors(workspace.name)

    return {
      id: workspace.id,
      name: workspace.name,
      lastSyncAt: workspace.lastSyncAt,
      pendingCount: workspace.transactions.length,
      connectors,
    }
  })
}

// Mock function to return connectors based on workspace name
// TODO: Replace with actual database field when schema is updated
function getWorkspaceConnectors(workspaceName: string): ConnectorType[] {
  const connectorSets: Record<string, ConnectorType[]> = {
    'Acme Corporation': ['quickbooks', 'plaid', 'stripe'],
    'Tech Startup Inc': ['xero', 'stripe'],
    'TechStart Inc.': ['xero', 'stripe'],
    'Green Valley Landscaping': ['quickbooks', 'gusto'],
    'Downtown Dental': ['quickbooks'],
    'Metro Consulting Group': ['quickbooks', 'ramp', 'gusto'],
  }
  return connectorSets[workspaceName] || ['quickbooks']
}

export async function getRecentActivity(): Promise<RecentActivityEvent[]> {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  // Get user's workspaces
  const workspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  })

  const workspaceMap = new Map(workspaces.map((w) => [w.id, w.name]))
  const workspaceIds = workspaces.map((w) => w.id)

  // Get recent audit logs across all workspaces
  const auditLogs = await prisma.auditLog.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Get recent transactions
  const transactions = await prisma.transaction.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      category: true,
    },
  })

  // Get recent matches
  const matches = await prisma.match.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Combine and format events
  const events: RecentActivityEvent[] = []

  // Add transaction events
  for (const txn of transactions) {
    const isIncome = txn.amount.toNumber() > 0
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(txn.amount.toNumber()))

    const source = txn.source === 'qbo' ? 'Xero' : 'Plaid'
    const sourceKey = txn.source === 'qbo' ? 'xero' : 'plaid'

    events.push({
      id: `txn-${txn.id}`,
      occurredAt: txn.createdAt,
      source: sourceKey,
      sourceLabel: source,
      type: isIncome ? 'Transaction' : 'Transaction',
      description: txn.category
        ? `${formattedAmount} ${isIncome ? 'deposit from' : 'payment to'} ${txn.description}`
        : `${formattedAmount} ${isIncome ? 'deposit' : 'spent at'} ${txn.description}`,
      workspaceId: txn.workspaceId,
      workspaceName: workspaceMap.get(txn.workspaceId) || 'Unknown',
    })
  }

  // Add categorization events from audit logs
  for (const log of auditLogs) {
    if (log.action === 'categorize') {
      events.push({
        id: `audit-${log.id}`,
        occurredAt: log.createdAt,
        source: 'entries',
        sourceLabel: 'AI',
        type: 'Category',
        description: `Categorized ${log.entityType} as ${log.newValue || 'category'}`,
        workspaceId: log.workspaceId,
        workspaceName: workspaceMap.get(log.workspaceId) || 'Unknown',
      })
    }
  }

  // Add match events
  for (const match of matches) {
    events.push({
      id: `match-${match.id}`,
      occurredAt: match.createdAt,
      source: 'entries',
      sourceLabel: 'AI',
      type: 'Match',
      description: `Matched bank transaction to ${match.matchType === 'exact' ? 'exact' : 'similar'} QBO record`,
      workspaceId: match.workspaceId,
      workspaceName: workspaceMap.get(match.workspaceId) || 'Unknown',
    })
  }

  // Sort by date and limit
  return events
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 15)
}

export type CreateWorkspaceResult = {
  success: boolean
  error?: string
  workspaceId?: string
}

export async function createWorkspace(name: string): Promise<CreateWorkspaceResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { success: false, error: 'Workspace name is required' }
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: trimmedName,
        userId: session.user.id,
        qboStatus: 'connected',
      },
    })

    revalidatePath('/')
    return { success: true, workspaceId: workspace.id }
  } catch {
    return { success: false, error: 'Failed to create workspace' }
  }
}
