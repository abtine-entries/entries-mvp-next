'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getExplorerData(workspaceId: string) {
  const [transactions, vendors, categories, events] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        document: { select: { id: true, fileName: true } },
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
      categoryId: t.categoryId,
      vendorName: t.vendor?.name ?? null,
      vendorId: t.vendorId,
      documentId: t.documentId,
      documentFileName: t.document?.fileName ?? null,
      source: t.source,
      status: t.status,
      externalId: t.externalId,
      confidence: t.confidence,
      aiReasoning: t.aiReasoning,
      createdAt: t.createdAt.toISOString(),
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

export interface WorkspaceDocument {
  id: string
  fileName: string
  fileType: string
}

export async function getWorkspaceDocuments(workspaceId: string): Promise<WorkspaceDocument[]> {
  const documents = await prisma.document.findMany({
    where: { workspaceId },
    select: { id: true, fileName: true, fileType: true },
    orderBy: { fileName: 'asc' },
  })
  return documents
}

export async function linkTransactionDocument(
  transactionId: string,
  documentId: string,
  workspaceId: string
) {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { documentId },
  })
  revalidatePath(`/workspace/${workspaceId}/explorer`)
}

export async function unlinkTransactionDocument(
  transactionId: string,
  workspaceId: string
) {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { documentId: null },
  })
  revalidatePath(`/workspace/${workspaceId}/explorer`)
}

export async function getVendorRecentTransactions(vendorId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { vendorId },
    orderBy: { date: 'desc' },
    take: 5,
    include: {
      category: { select: { name: true } },
    },
  })

  return transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    amount: t.amount.toNumber(),
    categoryName: t.category?.name ?? null,
    source: t.source,
    status: t.status,
  }))
}

export type VendorRecentTransaction = Awaited<ReturnType<typeof getVendorRecentTransactions>>[number]

export async function getSourceDetail(workspaceId: string, sourceKey: string) {
  const transactions = await prisma.transaction.findMany({
    where: { workspaceId, source: sourceKey },
    orderBy: { date: 'desc' },
    include: {
      category: { select: { name: true } },
    },
  })

  const totalCount = transactions.length
  const totalVolume = transactions.reduce(
    (sum, t) => sum + Math.abs(t.amount.toNumber()),
    0
  )

  const dates = transactions.map((t) => t.date.getTime())
  const firstDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null
  const lastDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null

  const recentTransactions = transactions.slice(0, 20).map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    amount: t.amount.toNumber(),
    categoryName: t.category?.name ?? null,
  }))

  return {
    sourceKey,
    sourceName: sourceKey === 'qbo' ? 'QuickBooks Online' : sourceKey === 'bank' ? 'Bank' : sourceKey,
    totalCount,
    totalVolume,
    firstDate,
    lastDate,
    recentTransactions,
  }
}

export type SourceDetail = Awaited<ReturnType<typeof getSourceDetail>>
export type SourceRecentTransaction = SourceDetail['recentTransactions'][number]
