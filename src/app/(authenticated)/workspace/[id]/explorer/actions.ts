'use server'

import { prisma } from '@/lib/prisma'

export async function getExplorerData(workspaceId: string) {
  const [transactions, vendors, categories, events] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.vendor.findMany({
      where: { workspaceId },
      orderBy: { totalSpend: 'desc' },
    }),
    prisma.category.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.event.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount.toNumber(),
      categoryName: t.category?.name ?? null,
      vendorName: t.vendor?.name ?? null,
      source: t.source,
      status: t.status,
    })),
    vendors: vendors.map((v) => ({
      id: v.id,
      name: v.name,
      totalSpend: v.totalSpend.toNumber(),
      transactionCount: v.transactionCount,
      firstSeen: v.firstSeen.toISOString(),
      lastSeen: v.lastSeen.toISOString(),
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      transactionCount: c._count.transactions,
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      entityType: e.entityType,
      createdAt: e.createdAt.toISOString(),
    })),
  }
}

export type ExplorerData = Awaited<ReturnType<typeof getExplorerData>>
export type ExplorerTransaction = ExplorerData['transactions'][number]
export type ExplorerVendor = ExplorerData['vendors'][number]
export type ExplorerCategory = ExplorerData['categories'][number]
export type ExplorerEvent = ExplorerData['events'][number]
