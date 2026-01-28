import { prisma } from '@/lib/prisma'

/**
 * Find an existing Event record for a given entity, or create one if it doesn't exist.
 * This ensures every entity (transaction, match, anomaly, etc.) has a corresponding Event.
 */
export async function findOrCreateEvent({
  workspaceId,
  entityType,
  entityId,
  title,
}: {
  workspaceId: string
  entityType: string
  entityId: string
  title: string
}) {
  const existing = await prisma.event.findFirst({
    where: { workspaceId, entityType, entityId },
  })

  if (existing) {
    return existing
  }

  return prisma.event.create({
    data: { workspaceId, entityType, entityId, title },
  })
}
