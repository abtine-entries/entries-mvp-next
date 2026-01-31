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

// --- RelationLink CRUD ---

export async function addRelationLink(
  relationColumnId: string,
  sourceRecordId: string,
  targetRecordId: string
) {
  const link = await prisma.relationLink.upsert({
    where: {
      relationColumnId_sourceRecordId_targetRecordId: {
        relationColumnId,
        sourceRecordId,
        targetRecordId,
      },
    },
    update: {},
    create: {
      relationColumnId,
      sourceRecordId,
      targetRecordId,
    },
  })

  const column = await prisma.relationColumn.findUnique({
    where: { id: relationColumnId },
    select: { workspaceId: true },
  })
  if (column) {
    revalidatePath(`/workspace/${column.workspaceId}/explorer`)
  }

  return link
}

export async function removeRelationLink(
  relationColumnId: string,
  sourceRecordId: string,
  targetRecordId: string
) {
  await prisma.relationLink.deleteMany({
    where: {
      relationColumnId,
      sourceRecordId,
      targetRecordId,
    },
  })

  const column = await prisma.relationColumn.findUnique({
    where: { id: relationColumnId },
    select: { workspaceId: true },
  })
  if (column) {
    revalidatePath(`/workspace/${column.workspaceId}/explorer`)
  }
}

export async function getRelationLinks(
  relationColumnId: string,
  sourceRecordIds: string[]
): Promise<Record<string, { id: string; label: string }[]>> {
  if (sourceRecordIds.length === 0) {
    return {}
  }

  const links = await prisma.relationLink.findMany({
    where: {
      relationColumnId,
      sourceRecordId: { in: sourceRecordIds },
    },
    include: {
      relationColumn: {
        select: { targetTable: true, workspaceId: true },
      },
    },
  })

  if (links.length === 0) {
    return {}
  }

  const targetTable = links[0].relationColumn.targetTable
  const workspaceId = links[0].relationColumn.workspaceId
  const targetRecordIds = [...new Set(links.map((l) => l.targetRecordId))]

  const labelMap = await getRecordLabels(
    workspaceId,
    targetTable,
    targetRecordIds
  )

  const result: Record<string, { id: string; label: string }[]> = {}
  for (const link of links) {
    const existing = result[link.sourceRecordId] ?? []
    existing.push({
      id: link.targetRecordId,
      label: labelMap.get(link.targetRecordId) ?? link.targetRecordId,
    })
    result[link.sourceRecordId] = existing
  }

  return result
}

async function getRecordLabels(
  workspaceId: string,
  targetTable: string,
  recordIds: string[]
): Promise<Map<string, string>> {
  const labelMap = new Map<string, string>()
  if (recordIds.length === 0) return labelMap

  switch (targetTable) {
    case 'transactions': {
      const records = await prisma.transaction.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, description: true },
      })
      for (const r of records) labelMap.set(r.id, r.description)
      break
    }
    case 'documents': {
      const records = await prisma.document.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, fileName: true },
      })
      for (const r of records) labelMap.set(r.id, r.fileName)
      break
    }
    case 'bills': {
      const records = await prisma.bill.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, vendorName: true, invoiceNumber: true },
      })
      for (const r of records)
        labelMap.set(r.id, `${r.vendorName} #${r.invoiceNumber}`)
      break
    }
    case 'vendors': {
      const records = await prisma.vendor.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, name: true },
      })
      for (const r of records) labelMap.set(r.id, r.name)
      break
    }
    case 'categories': {
      const records = await prisma.category.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, name: true },
      })
      for (const r of records) labelMap.set(r.id, r.name)
      break
    }
    case 'events': {
      const records = await prisma.event.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, title: true },
      })
      for (const r of records) labelMap.set(r.id, r.title)
      break
    }
    case 'rules': {
      const records = await prisma.rule.findMany({
        where: { id: { in: recordIds }, workspaceId },
        select: { id: true, ruleText: true },
      })
      for (const r of records) labelMap.set(r.id, r.ruleText)
      break
    }
  }

  return labelMap
}

export async function getTargetRecordOptions(
  workspaceId: string,
  targetTable: string,
  search?: string
) {
  if (!isValidTable(targetTable)) {
    throw new Error(`Invalid target table: ${targetTable}`)
  }

  const limit = 50

  switch (targetTable) {
    case 'transactions': {
      const records = await prisma.transaction.findMany({
        where: {
          workspaceId,
          ...(search
            ? { description: { contains: search } }
            : {}),
        },
        select: { id: true, description: true },
        take: limit,
        orderBy: { date: 'desc' },
      })
      return records.map((r) => ({ id: r.id, label: r.description }))
    }
    case 'documents': {
      const records = await prisma.document.findMany({
        where: {
          workspaceId,
          ...(search
            ? { fileName: { contains: search } }
            : {}),
        },
        select: { id: true, fileName: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      return records.map((r) => ({ id: r.id, label: r.fileName }))
    }
    case 'bills': {
      const records = await prisma.bill.findMany({
        where: {
          workspaceId,
          ...(search
            ? {
                OR: [
                  { vendorName: { contains: search } },
                  { invoiceNumber: { contains: search } },
                ],
              }
            : {}),
        },
        select: { id: true, vendorName: true, invoiceNumber: true },
        take: limit,
        orderBy: { dueDate: 'desc' },
      })
      return records.map((r) => ({
        id: r.id,
        label: `${r.vendorName} #${r.invoiceNumber}`,
      }))
    }
    case 'vendors': {
      const records = await prisma.vendor.findMany({
        where: {
          workspaceId,
          ...(search ? { name: { contains: search } } : {}),
        },
        select: { id: true, name: true },
        take: limit,
        orderBy: { name: 'asc' },
      })
      return records.map((r) => ({ id: r.id, label: r.name }))
    }
    case 'categories': {
      const records = await prisma.category.findMany({
        where: {
          workspaceId,
          ...(search ? { name: { contains: search } } : {}),
        },
        select: { id: true, name: true },
        take: limit,
        orderBy: { name: 'asc' },
      })
      return records.map((r) => ({ id: r.id, label: r.name }))
    }
    case 'events': {
      const records = await prisma.event.findMany({
        where: {
          workspaceId,
          ...(search
            ? { title: { contains: search } }
            : {}),
        },
        select: { id: true, title: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      return records.map((r) => ({ id: r.id, label: r.title }))
    }
    case 'rules': {
      const records = await prisma.rule.findMany({
        where: {
          workspaceId,
          ...(search
            ? { ruleText: { contains: search } }
            : {}),
        },
        select: { id: true, ruleText: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      return records.map((r) => ({ id: r.id, label: r.ruleText }))
    }
    default: {
      return []
    }
  }
}

// --- Migration: Statement → RelationCell ---

/**
 * Idempotent migration: creates a default 'Statement' RelationColumn per workspace
 * and converts existing Transaction.documentId values into RelationLink records.
 * Safe to run multiple times — uses findFirst + createMany with skipDuplicates.
 */
export async function migrateStatementToRelation() {
  const workspaces = await prisma.workspace.findMany({
    select: { id: true },
  })

  for (const ws of workspaces) {
    // Find or create the Statement relation column
    let statementCol = await prisma.relationColumn.findFirst({
      where: {
        workspaceId: ws.id,
        name: 'Statement',
        sourceTable: 'transactions',
        targetTable: 'documents',
      },
    })

    if (!statementCol) {
      statementCol = await prisma.relationColumn.create({
        data: {
          workspaceId: ws.id,
          name: 'Statement',
          sourceTable: 'transactions',
          targetTable: 'documents',
        },
      })
    }

    // Find all transactions with a documentId in this workspace
    const linkedTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId: ws.id,
        documentId: { not: null },
      },
      select: { id: true, documentId: true },
    })

    // Create RelationLink records (upsert for idempotency)
    for (const t of linkedTransactions) {
      await prisma.relationLink.upsert({
        where: {
          relationColumnId_sourceRecordId_targetRecordId: {
            relationColumnId: statementCol.id,
            sourceRecordId: t.id,
            targetRecordId: t.documentId!,
          },
        },
        update: {},
        create: {
          relationColumnId: statementCol.id,
          sourceRecordId: t.id,
          targetRecordId: t.documentId!,
        },
      })
    }
  }
}

// --- Types ---

export type RelationColumnRecord = Awaited<
  ReturnType<typeof getRelationColumns>
>[number]

export type RelationLinkRecord = Awaited<ReturnType<typeof addRelationLink>>

export type TargetRecordOption = Awaited<
  ReturnType<typeof getTargetRecordOptions>
>[number]

export type RelationLinksMap = Record<string, { id: string; label: string }[]>
