'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/client'

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

export interface CreateBatchPaymentResult {
  success: boolean
  error?: string
  batchPaymentId?: string
}

interface BillInput {
  id: string
  amount: number
  currency: string
  vendorName: string
}

export async function createBatchPayment(
  workspaceId: string,
  bills: BillInput[]
): Promise<CreateBatchPaymentResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    if (bills.length === 0) {
      return { success: false, error: 'No bills selected' }
    }

    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)

    const batchPayment = await prisma.batchPayment.create({
      data: {
        workspaceId,
        status: 'submitted',
        totalAmount: new Decimal(totalAmount),
        currency: 'USD',
        wiseTransferId: `WISE-${Date.now()}`,
        items: {
          create: bills.map((b) => ({
            billId: b.id,
            amount: new Decimal(b.amount),
            currency: b.currency,
            recipientName: b.vendorName,
          })),
        },
      },
    })

    // Update bill statuses to 'paid'
    await prisma.bill.updateMany({
      where: {
        id: { in: bills.map((b) => b.id) },
        workspaceId,
      },
      data: { status: 'paid' },
    })

    // Log batch payment event
    const formattedTotal = totalAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
    await prisma.event.create({
      data: {
        workspaceId,
        entityType: 'batch_payment',
        entityId: batchPayment.id,
        title: `Batch payment submitted — ${bills.length} bills, ${formattedTotal}`,
      },
    })

    // Log individual bill payment events
    await prisma.event.createMany({
      data: bills.map((b) => ({
        workspaceId,
        entityType: 'bill',
        entityId: b.id,
        title: `Bill paid — ${b.vendorName} (${b.amount.toLocaleString('en-US', { style: 'currency', currency: b.currency })})`,
      })),
    })

    revalidatePath(`/workspace/${workspaceId}/bills`)
    revalidatePath(`/workspace/${workspaceId}/event-feed`)

    return { success: true, batchPaymentId: batchPayment.id }
  } catch (error) {
    console.error('Failed to create batch payment:', error)
    return { success: false, error: 'Failed to create batch payment' }
  }
}

export async function createBatchPaymentDraft(
  workspaceId: string,
  bills: BillInput[],
  filename: string
): Promise<CreateBatchPaymentResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    if (bills.length === 0) {
      return { success: false, error: 'No bills selected' }
    }

    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)

    const batchPayment = await prisma.batchPayment.create({
      data: {
        workspaceId,
        status: 'draft',
        totalAmount: new Decimal(totalAmount),
        currency: 'USD',
        fileExportPath: filename,
        items: {
          create: bills.map((b) => ({
            billId: b.id,
            amount: new Decimal(b.amount),
            currency: b.currency,
            recipientName: b.vendorName,
          })),
        },
      },
    })

    // Log batch payment export event
    const formattedTotal = totalAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
    await prisma.event.create({
      data: {
        workspaceId,
        entityType: 'batch_payment',
        entityId: batchPayment.id,
        title: `Batch payment exported as CSV — ${bills.length} bills, ${formattedTotal}`,
      },
    })

    revalidatePath(`/workspace/${workspaceId}/bills`)
    revalidatePath(`/workspace/${workspaceId}/event-feed`)

    return { success: true, batchPaymentId: batchPayment.id }
  } catch (error) {
    console.error('Failed to create batch payment draft:', error)
    return { success: false, error: 'Failed to create batch payment draft' }
  }
}

export async function getBatchPayments(workspaceId: string) {
  const batchPayments = await prisma.batchPayment.findMany({
    where: { workspaceId },
    include: {
      items: {
        include: {
          bill: {
            select: { vendorName: true, invoiceNumber: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return batchPayments.map((bp) => ({
    id: bp.id,
    status: bp.status,
    totalAmount: bp.totalAmount.toNumber(),
    currency: bp.currency,
    wiseTransferId: bp.wiseTransferId,
    fileExportPath: bp.fileExportPath,
    createdAt: bp.createdAt.toISOString(),
    items: bp.items.map((item) => ({
      id: item.id,
      amount: item.amount.toNumber(),
      currency: item.currency,
      recipientName: item.recipientName,
      vendorName: item.bill.vendorName,
      invoiceNumber: item.bill.invoiceNumber,
    })),
  }))
}

export type SerializedBatchPayment = Awaited<ReturnType<typeof getBatchPayments>>[number]
