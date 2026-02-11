'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

import type { ParsedGLData, ImportResult } from '@/components/gl-import/types'

export async function importGLData(
  workspaceId: string,
  data: ParsedGLData,
  fileName: string,
  platform: 'qbo' | 'xero'
): Promise<ImportResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify workspace ownership
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: session.user.id },
  })

  if (!workspace) {
    return { success: false, error: 'Workspace not found' }
  }

  try {
    // 1. Create categories (skip existing by name match)
    const existingCategories = await prisma.category.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    })
    const existingCatMap = new Map(
      existingCategories.map((c) => [c.name.toLowerCase(), c.id])
    )

    const newCategories = data.categories.filter(
      (c) => !existingCatMap.has(c.name.toLowerCase())
    )

    if (newCategories.length > 0) {
      await prisma.category.createMany({
        data: newCategories.map((c) => ({
          workspaceId,
          name: c.name,
          type: c.type,
        })),
      })
    }

    // Refresh category map with new IDs
    const allCategories = await prisma.category.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    })
    const categoryMap = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id])
    )

    // 2. Create vendors (skip existing by normalized name)
    const existingVendors = await prisma.vendor.findMany({
      where: { workspaceId },
      select: { id: true, normalizedName: true },
    })
    const existingVendorMap = new Map(
      existingVendors.map((v) => [v.normalizedName, v.id])
    )

    const newVendors = data.vendors.filter(
      (v) => !existingVendorMap.has(v.normalizedName)
    )

    const now = new Date()
    if (newVendors.length > 0) {
      await prisma.vendor.createMany({
        data: newVendors.map((v) => ({
          workspaceId,
          name: v.name,
          normalizedName: v.normalizedName,
          firstSeen: now,
          lastSeen: now,
        })),
      })
    }

    // Refresh vendor map with new IDs
    const allVendors = await prisma.vendor.findMany({
      where: { workspaceId },
      select: { id: true, normalizedName: true },
    })
    const vendorMap = new Map(
      allVendors.map((v) => [v.normalizedName, v.id])
    )

    // 3. Create transactions
    const transactionData = data.transactions.map((t) => {
      const catId = categoryMap.get(t.categoryName.toLowerCase()) || null
      const vendNorm = t.vendorName.toLowerCase().replace(/\s+/g, ' ').trim()
      const vendId = vendorMap.get(vendNorm) || null

      return {
        workspaceId,
        source: t.source,
        date: new Date(t.date),
        description: t.description,
        amount: t.amount.toString(),
        categoryId: catId,
        vendorId: vendId,
        status: 'unmatched' as const,
      }
    })

    if (transactionData.length > 0) {
      await prisma.transaction.createMany({ data: transactionData })
    }

    // 4. Update vendor aggregates
    const vendorAggs = new Map<string, { total: number; count: number; first: Date; last: Date }>()
    for (const t of data.transactions) {
      const vendNorm = t.vendorName.toLowerCase().replace(/\s+/g, ' ').trim()
      const vendId = vendorMap.get(vendNorm)
      if (!vendId) continue

      const existing = vendorAggs.get(vendId)
      const txDate = new Date(t.date)
      if (existing) {
        existing.total += Math.abs(t.amount)
        existing.count += 1
        if (txDate < existing.first) existing.first = txDate
        if (txDate > existing.last) existing.last = txDate
      } else {
        vendorAggs.set(vendId, {
          total: Math.abs(t.amount),
          count: 1,
          first: txDate,
          last: txDate,
        })
      }
    }

    for (const [vendorId, agg] of vendorAggs) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          totalSpend: { increment: agg.total.toString() },
          transactionCount: { increment: agg.count },
          firstSeen: agg.first,
          lastSeen: agg.last,
        },
      })
    }

    // 5. Update workspace platform
    if (!workspace.platform) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { platform },
      })
    }

    // 6. Create Import record
    const importRecord = await prisma.import.create({
      data: {
        workspaceId,
        platform,
        fileName,
        rowCount: data.transactions.length,
        status: 'completed',
      },
    })

    revalidatePath(`/workspace/${workspaceId}`)
    revalidatePath(`/workspace/${workspaceId}/connectors`)
    revalidatePath(`/workspace/${workspaceId}/explorer`)
    revalidatePath(`/workspace/${workspaceId}/event-feed`)

    return {
      success: true,
      importId: importRecord.id,
      transactionCount: data.transactions.length,
      categoryCount: newCategories.length,
      vendorCount: newVendors.length,
    }
  } catch (err) {
    console.error('GL Import error:', err)
    return { success: false, error: (err as Error).message }
  }
}
