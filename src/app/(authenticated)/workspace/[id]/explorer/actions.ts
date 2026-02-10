'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getExplorerData(workspaceId: string) {
  const [transactions, vendors, categories, events] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId },
      include: {
        category: { select: { id: true, name: true, workspaceId: true } },
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
    transactions: transactions.map((t) => {
      // Only use category data if it belongs to the same workspace
      const categoryInSameWorkspace = t.category && t.category.workspaceId === workspaceId
      return {
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        amount: t.amount.toNumber(),
        categoryName: categoryInSameWorkspace ? t.category.name : null,
        categoryId: categoryInSameWorkspace ? t.categoryId : null,
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
      }
    }),
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

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string | null,
  workspaceId: string
) {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { categoryId },
  })
  revalidatePath(`/workspace/${workspaceId}/explorer`)
  return { success: true }
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

export async function getVendorDetail(workspaceId: string, vendorId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, workspaceId },
  })

  if (!vendor) return null

  const recentTransactions = await prisma.transaction.findMany({
    where: { vendorId, workspaceId },
    orderBy: { date: 'desc' },
    take: 10,
    include: {
      category: { select: { name: true } },
    },
  })

  // Monthly spend for last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      vendorId,
      workspaceId,
      date: { gte: sixMonthsAgo },
    },
    select: { date: true, amount: true },
    orderBy: { date: 'asc' },
  })

  const monthlySpendMap = new Map<string, number>()
  for (const t of monthlyTransactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    const current = monthlySpendMap.get(key) ?? 0
    monthlySpendMap.set(key, current + Math.abs(t.amount.toNumber()))
  }

  const monthlySpend = Array.from(monthlySpendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))

  return {
    id: vendor.id,
    name: vendor.name,
    normalizedName: vendor.normalizedName,
    totalSpend: vendor.totalSpend.toNumber(),
    transactionCount: vendor.transactionCount,
    firstSeen: vendor.firstSeen.toISOString(),
    lastSeen: vendor.lastSeen.toISOString(),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount.toNumber(),
      categoryName: t.category?.name ?? null,
    })),
    monthlySpend,
  }
}

export type VendorDetail = NonNullable<Awaited<ReturnType<typeof getVendorDetail>>>
export type VendorDetailTransaction = VendorDetail['recentTransactions'][number]
export type VendorMonthlySpend = VendorDetail['monthlySpend'][number]

export async function getCategoryDetail(workspaceId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, workspaceId },
    include: {
      parent: { select: { id: true, name: true } },
    },
  })

  if (!category) return null

  const transactionCount = await prisma.transaction.count({
    where: { categoryId, workspaceId },
  })

  const transactions = await prisma.transaction.findMany({
    where: { categoryId, workspaceId },
    orderBy: { date: 'desc' },
    take: 10,
    include: {
      vendor: { select: { name: true } },
    },
  })

  const totalAmount = transactions.length > 0
    ? (await prisma.transaction.findMany({
        where: { categoryId, workspaceId },
        select: { amount: true },
      })).reduce((sum, t) => sum + Math.abs(t.amount.toNumber()), 0)
    : 0

  return {
    id: category.id,
    name: category.name,
    type: category.type,
    parentName: category.parent?.name ?? null,
    parentId: category.parent?.id ?? null,
    transactionCount,
    totalAmount,
    recentTransactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount.toNumber(),
      vendorName: t.vendor?.name ?? null,
    })),
  }
}

export type CategoryDetail = NonNullable<Awaited<ReturnType<typeof getCategoryDetail>>>
export type CategoryDetailTransaction = CategoryDetail['recentTransactions'][number]
