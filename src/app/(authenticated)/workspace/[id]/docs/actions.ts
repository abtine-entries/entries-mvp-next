'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface UploadDocumentResult {
  success: boolean
  error?: string
}

export interface SerializedDocument {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  folder: string | null
  status: string
  uploadedByName: string | null
  createdAt: string
}

export async function getDocuments(workspaceId: string): Promise<SerializedDocument[]> {
  const documents = await prisma.document.findMany({
    where: { workspaceId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    storagePath: doc.storagePath,
    folder: doc.folder,
    status: doc.status,
    uploadedByName: doc.uploadedBy.name,
    createdAt: doc.createdAt.toISOString(),
  }))
}

export async function getDocumentDetail(workspaceId: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId },
    include: {
      uploadedBy: { select: { name: true } },
    },
  })

  if (!document) return null

  const linkedTransactions = await prisma.transaction.findMany({
    where: { documentId, workspaceId },
    orderBy: { date: 'desc' },
    include: {
      vendor: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  return {
    id: document.id,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    storagePath: document.storagePath,
    folder: document.folder,
    status: document.status,
    uploadedByName: document.uploadedBy.name,
    createdAt: document.createdAt.toISOString(),
    linkedTransactions: linkedTransactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount.toNumber(),
      vendorName: t.vendor?.name ?? null,
      categoryName: t.category?.name ?? null,
    })),
  }
}

export type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocumentDetail>>>
export type DocumentDetailTransaction = DocumentDetail['linkedTransactions'][number]

export async function uploadDocument(
  workspaceId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<UploadDocumentResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!fileName.trim()) {
      return { success: false, error: 'File name is required' }
    }

    // Determine file type category from extension
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    let fileTypeCategory = fileType
    if (!fileTypeCategory) {
      if (ext === 'pdf') fileTypeCategory = 'pdf'
      else if (ext === 'csv') fileTypeCategory = 'csv'
      else if (['png', 'jpg', 'jpeg'].includes(ext)) fileTypeCategory = 'image'
      else fileTypeCategory = 'other'
    }

    // Placeholder storage path (no actual file storage for MVP)
    const storagePath = `/uploads/${fileName.replace(/\s+/g, '-').toLowerCase()}`

    await prisma.document.create({
      data: {
        workspaceId,
        fileName: fileName.trim(),
        fileType: fileTypeCategory,
        fileSize,
        storagePath,
        status: 'uploaded',
        uploadedById: session.user.id,
      },
    })

    revalidatePath(`/workspace/${workspaceId}/docs`)
    return { success: true }
  } catch (error) {
    console.error('Failed to upload document:', error)
    return { success: false, error: 'Failed to upload document' }
  }
}
