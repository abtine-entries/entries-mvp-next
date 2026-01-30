'use server'

import { prisma } from '@/lib/prisma'

export async function getCategorizeData(workspaceId: string) {
  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId },
      include: {
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.category.findMany({
      where: { workspaceId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, type: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount.toNumber(),
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? null,
      categoryType: t.category?.type ?? null,
      source: t.source,
      status: t.status,
      aiReasoning: t.aiReasoning,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parentId: c.parentId,
      parentName: c.parent?.name ?? null,
      childrenIds: c.children.map((ch) => ch.id),
      transactionCount: c._count.transactions,
    })),
  }
}

export type CategorizeData = Awaited<ReturnType<typeof getCategorizeData>>
export type CategorizeTransaction = CategorizeData['transactions'][number]
export type CategorizeCategory = CategorizeData['categories'][number]
