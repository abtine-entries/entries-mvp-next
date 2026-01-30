'use server'

import { prisma } from '@/lib/prisma'

export async function getBills(workspaceId: string) {
  const bills = await prisma.bill.findMany({
    where: { workspaceId },
    orderBy: { dueDate: 'asc' },
  })

  return bills.map((b) => ({
    id: b.id,
    workspaceId: b.workspaceId,
    vendorName: b.vendorName,
    invoiceNumber: b.invoiceNumber,
    dueDate: b.dueDate.toISOString(),
    amount: b.amount.toNumber(),
    currency: b.currency,
    status: b.status,
    xeroId: b.xeroId,
    description: b.description,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }))
}

export type SerializedBill = Awaited<ReturnType<typeof getBills>>[number]
