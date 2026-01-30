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
