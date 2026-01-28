import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { ReconciliationPanels } from '../reconciliation/reconciliation-panels'

interface ReconcilePageProps {
  params: Promise<{ id: string }>
}

export default async function ReconcilePage({ params }: ReconcilePageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  // Fetch bank and QBO transactions in parallel (only unmatched/pending for reconciliation)
  const [bankTransactions, qboTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId: id, source: 'bank', status: { not: 'matched' } },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { workspaceId: id, source: 'qbo', status: { not: 'matched' } },
      orderBy: { date: 'desc' },
    }),
  ])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/' },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed` },
          { label: 'Reconcile' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <ReconciliationPanels
          workspaceId={id}
          bankTransactions={bankTransactions}
          qboTransactions={qboTransactions}
        />
      </div>
    </div>
  )
}
