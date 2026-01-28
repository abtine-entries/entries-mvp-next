import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileSpreadsheet } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TransactionRow } from './transaction-row'

interface ReconciliationPageProps {
  params: Promise<{ id: string }>
}

export default async function ReconciliationPage({
  params,
}: ReconciliationPageProps) {
  const { id } = await params

  // Fetch bank and QBO transactions in parallel
  const [bankTransactions, qboTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId: id, source: 'bank' },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { workspaceId: id, source: 'qbo' },
      orderBy: { date: 'desc' },
    }),
  ])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Transaction Reconciliation</h2>

      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-250px)]">
        {/* Bank Transactions Panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0 border-b py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Bank Transactions</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">
                {bankTransactions.length} transactions
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {bankTransactions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No bank transactions found.
              </div>
            ) : (
              <div className="divide-y">
                {bankTransactions.map((txn) => (
                  <TransactionRow key={txn.id} transaction={txn} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QBO Transactions Panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0 border-b py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">QuickBooks Transactions</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">
                {qboTransactions.length} transactions
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {qboTransactions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No QuickBooks transactions found.
              </div>
            ) : (
              <div className="divide-y">
                {qboTransactions.map((txn) => (
                  <TransactionRow key={txn.id} transaction={txn} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
