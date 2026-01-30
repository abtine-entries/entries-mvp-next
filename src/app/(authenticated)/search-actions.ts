'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export type SearchResult = {
  id: string
  type: 'workspace' | 'transaction' | 'rule' | 'event'
  title: string
  detail: string
  href: string
}

export type SearchResults = {
  workspaces: SearchResult[]
  transactions: SearchResult[]
  rules: SearchResult[]
  events: SearchResult[]
}

export async function universalSearch(query: string): Promise<SearchResults> {
  const session = await auth()

  if (!session?.user?.id || !query.trim()) {
    return { workspaces: [], transactions: [], rules: [], events: [] }
  }

  const userId = session.user.id
  const searchTerm = query.trim()

  // Get user's workspaces first to scope all queries
  const userWorkspaces = await prisma.workspace.findMany({
    where: { userId },
    select: { id: true, name: true },
  })

  const workspaceIds = userWorkspaces.map((w) => w.id)
  const workspaceMap = new Map(userWorkspaces.map((w) => [w.id, w.name]))

  if (workspaceIds.length === 0) {
    return { workspaces: [], transactions: [], rules: [], events: [] }
  }

  // Run all searches in parallel
  const [matchedWorkspaces, transactions, rules, events] = await Promise.all([
    // Search workspaces by name
    prisma.workspace.findMany({
      where: {
        userId,
        name: { contains: searchTerm },
      },
      select: { id: true, name: true },
      take: 5,
    }),

    // Search transactions by description
    prisma.transaction.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        description: { contains: searchTerm },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        workspaceId: true,
        date: true,
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),

    // Search rules by ruleText
    prisma.rule.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        ruleText: { contains: searchTerm },
      },
      select: {
        id: true,
        ruleText: true,
        workspaceId: true,
      },
      take: 10,
    }),

    // Search events by title
    prisma.event.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        title: { contains: searchTerm },
      },
      select: {
        id: true,
        title: true,
        entityType: true,
        workspaceId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount))

  return {
    workspaces: matchedWorkspaces.map((ws) => ({
      id: ws.id,
      type: 'workspace' as const,
      title: ws.name,
      detail: 'Workspace',
      href: `/workspace/${ws.id}/alerts`,
    })),

    transactions: transactions.map((txn) => ({
      id: txn.id,
      type: 'transaction' as const,
      title: txn.description,
      detail: `${formatCurrency(txn.amount.toNumber())} · ${workspaceMap.get(txn.workspaceId) || 'Unknown'}`,
      href: `/workspace/${txn.workspaceId}/explorer`,
    })),

    rules: rules.map((rule) => ({
      id: rule.id,
      type: 'rule' as const,
      title: rule.ruleText,
      detail: workspaceMap.get(rule.workspaceId) || 'Unknown',
      href: `/workspace/${rule.workspaceId}/rules`,
    })),

    events: events.map((event) => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      detail: `${event.entityType} · ${workspaceMap.get(event.workspaceId) || 'Unknown'}`,
      href: `/workspace/${event.workspaceId}/event/${event.id}`,
    })),
  }
}
