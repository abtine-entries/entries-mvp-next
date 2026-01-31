import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Table2 } from 'lucide-react'
import { org } from '@/lib/config'
import { getExplorerData } from './actions'
import { getBills, getBatchPayments } from '../bills/actions'
import { getRelationColumns, getRelationLinks } from './relation-actions'
import type { RelationLinksMap } from './relation-actions'
import { ExplorerTabs } from './explorer-tabs'

interface ExplorerPageProps {
  params: Promise<{ id: string }>
}

export default async function ExplorerPage({ params }: ExplorerPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const [data, bills, batchPayments] = await Promise.all([
    getExplorerData(workspace.id),
    getBills(workspace.id),
    getBatchPayments(workspace.id),
  ])

  // Fetch relation columns for all explorer source tables in parallel
  const sourceTables = ['transactions', 'vendors', 'categories', 'events'] as const
  const allRelationColumns = await Promise.all(
    sourceTables.map((t) => getRelationColumns(workspace.id, t))
  )

  const relationColumnsByTable: Record<string, Awaited<ReturnType<typeof getRelationColumns>>> = {}
  for (let i = 0; i < sourceTables.length; i++) {
    relationColumnsByTable[sourceTables[i]] = allRelationColumns[i]
  }

  // Build entity ID maps for each table
  const entityIdsByTable: Record<string, string[]> = {
    transactions: data.transactions.map((t) => t.id),
    vendors: data.vendors.map((v) => v.id),
    categories: data.categories.map((c) => c.id),
    events: data.events.map((e) => e.id),
  }

  // Batch-fetch relation links per table
  const relationLinksMapByTable: Record<string, Record<string, RelationLinksMap>> = {}
  await Promise.all(
    sourceTables.map(async (table) => {
      const cols = relationColumnsByTable[table]
      const entityIds = entityIdsByTable[table]
      if (cols.length > 0 && entityIds.length > 0) {
        const linkResults = await Promise.all(
          cols.map((col) => getRelationLinks(col.id, entityIds))
        )
        const linksMap: Record<string, RelationLinksMap> = {}
        for (let i = 0; i < cols.length; i++) {
          linksMap[cols[i].id] = linkResults[i]
        }
        relationLinksMapByTable[table] = linksMap
      } else {
        relationLinksMapByTable[table] = {}
      }
    })
  )

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          {
            label: org.name,
            href: '/',
            icon: (
              <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">
                {org.initials}
              </span>
            ),
          },
          {
            label: workspace.name,
            href: `/workspace/${workspace.id}/esme`,
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            label: 'Data Explorer',
            icon: <Table2 className="h-4 w-4" />,
          },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto space-y-8">
        <ExplorerTabs
          data={data}
          bills={bills}
          batchPayments={batchPayments}
          workspaceId={workspace.id}
          relationColumnsByTable={relationColumnsByTable}
          relationLinksMapByTable={relationLinksMapByTable}
        />
      </div>
    </div>
  )
}
