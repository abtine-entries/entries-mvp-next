import { prisma } from '@/lib/prisma'
import { ReconciliationPanels } from './reconciliation-panels'

interface ReconciliationPageProps {
  params: Promise<{ id: string }>
}

export default async function ReconciliationPage({
  params,
}: ReconciliationPageProps) {
  const { id } = await params

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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Transaction Reconciliation</h2>

      <ReconciliationPanels
        workspaceId={id}
        bankTransactions={bankTransactions}
        qboTransactions={qboTransactions}
      />
    </div>
  )
}
