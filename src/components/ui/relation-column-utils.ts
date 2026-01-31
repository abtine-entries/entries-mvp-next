import { type ColumnDef } from '@tanstack/react-table'
import { RelationColumnHeader } from './relation-column-header'
import { RelationCell } from './relation-cell'
import { createElement } from 'react'
import type { RelationColumnRecord, RelationLinksMap } from '@/app/(authenticated)/workspace/[id]/explorer/relation-actions'

/**
 * Builds TanStack ColumnDef[] from RelationColumn records.
 * Each column uses RelationColumnHeader for the header and RelationCell for cells.
 * The row type must have an `id` field (string) used as the source record ID.
 */
export function buildRelationColumns<TData extends { id: string }>(
  relationColumns: RelationColumnRecord[],
  relationLinksMap: Record<string, RelationLinksMap>,
  workspaceId: string,
  onEntityClick?: (targetTable: string, entityId: string) => void
): ColumnDef<TData, unknown>[] {
  return relationColumns.map((col) => ({
    id: `relation_${col.id}`,
    header: () =>
      createElement(RelationColumnHeader, {
        columnId: col.id,
        columnName: col.name,
        workspaceId,
      }),
    size: 200,
    cell: ({ row }: { row: { original: TData } }) => {
      const sourceRecordId = row.original.id
      const linksForColumn = relationLinksMap[col.id] ?? {}
      const linkedRecords = linksForColumn[sourceRecordId] ?? []

      return createElement(RelationCell, {
        relationColumnId: col.id,
        sourceRecordId,
        linkedRecords,
        workspaceId,
        targetTable: col.targetTable,
        onEntityClick: onEntityClick
          ? (entityId: string) => onEntityClick(col.targetTable, entityId)
          : undefined,
      })
    },
  }))
}
