'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const VALID_TABLES = [
  'transactions',
  'documents',
  'bills',
  'vendors',
  'categories',
  'events',
  'rules',
] as const

type ValidTable = (typeof VALID_TABLES)[number]

function isValidTable(table: string): table is ValidTable {
  return VALID_TABLES.includes(table as ValidTable)
}

// --- RelationColumn CRUD ---

export async function createRelationColumn(
  workspaceId: string,
  name: string,
  sourceTable: string,
  targetTable: string
) {
  if (!isValidTable(sourceTable)) {
    throw new Error(`Invalid source table: ${sourceTable}`)
  }
  if (!isValidTable(targetTable)) {
    throw new Error(`Invalid target table: ${targetTable}`)
  }

  const column = await prisma.relationColumn.create({
    data: {
      workspaceId,
      name,
      sourceTable,
      targetTable,
    },
  })

  revalidatePath(`/workspace/${workspaceId}/explorer`)
  return column
}

export async function getRelationColumns(
  workspaceId: string,
  sourceTable?: string
) {
  const where: { workspaceId: string; sourceTable?: string } = { workspaceId }
  if (sourceTable) {
    where.sourceTable = sourceTable
  }

  const columns = await prisma.relationColumn.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })

  return columns
}

export async function updateRelationColumn(
  id: string,
  workspaceId: string,
  name: string
) {
  const column = await prisma.relationColumn.update({
    where: { id, workspaceId },
    data: { name },
  })

  revalidatePath(`/workspace/${workspaceId}/explorer`)
  return column
}

export async function deleteRelationColumn(id: string, workspaceId: string) {
  await prisma.relationColumn.delete({
    where: { id, workspaceId },
  })

  revalidatePath(`/workspace/${workspaceId}/explorer`)
}

// --- Types ---

export type RelationColumnRecord = Awaited<
  ReturnType<typeof getRelationColumns>
>[number]
