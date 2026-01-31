import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Receipt } from 'lucide-react'
import { org } from '@/lib/config'
import { getBills, getBatchPayments } from './actions'
import { BillsTable } from './bills-table'
import { PaymentHistory } from './payment-history'
import { getRelationColumns, getRelationLinks } from '../explorer/relation-actions'
import type { RelationLinksMap } from '../explorer/relation-actions'

interface BillsPageProps {
  params: Promise<{ id: string }>
}

export default async function BillsPage({ params }: BillsPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const [bills, batchPayments, relationColumns] = await Promise.all([
    getBills(workspace.id),
    getBatchPayments(workspace.id),
    getRelationColumns(workspace.id, 'bills'),
  ])

  // Batch-fetch relation links for all bill IDs per relation column
  const billIds = bills.map((b) => b.id)
  const relationLinksMap: Record<string, RelationLinksMap> = {}
  if (relationColumns.length > 0 && billIds.length > 0) {
    const linkResults = await Promise.all(
      relationColumns.map((col) => getRelationLinks(col.id, billIds))
    )
    for (let i = 0; i < relationColumns.length; i++) {
      relationLinksMap[relationColumns[i].id] = linkResults[i]
    }
  }

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
            label: 'Bills',
            icon: <Receipt className="h-4 w-4" />,
          },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto space-y-8">
        <BillsTable
          bills={bills}
          workspaceId={workspace.id}
          relationColumns={relationColumns}
          relationLinksMap={relationLinksMap}
        />
        <PaymentHistory batchPayments={batchPayments} />
      </div>
    </div>
  )
}
