import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, AlertTriangle, TrendingDown } from 'lucide-react'
import { QuickActions } from './quick-actions'
import { PeriodSelector } from './period-selector'

interface WorkspaceDashboardProps {
  params: Promise<{ id: string }>
}

async function getDashboardStats(workspaceId: string) {
  // Count matched transactions (transactions with status 'matched')
  const matchedCount = await prisma.transaction.count({
    where: {
      workspaceId,
      status: 'matched',
    },
  })

  // Count pending review transactions (status 'pending' or 'unmatched')
  const pendingCount = await prisma.transaction.count({
    where: {
      workspaceId,
      status: { in: ['pending', 'unmatched'] },
    },
  })

  // Count open anomalies
  const anomalyCount = await prisma.anomaly.count({
    where: {
      workspaceId,
      status: 'open',
    },
  })

  // Calculate variance (sum of unmatched bank transactions vs sum of unmatched QBO transactions)
  const bankUnmatched = await prisma.transaction.aggregate({
    where: {
      workspaceId,
      source: 'bank',
      status: { not: 'matched' },
    },
    _sum: { amount: true },
  })

  const qboUnmatched = await prisma.transaction.aggregate({
    where: {
      workspaceId,
      source: 'qbo',
      status: { not: 'matched' },
    },
    _sum: { amount: true },
  })

  const bankTotal = Number(bankUnmatched._sum.amount ?? 0)
  const qboTotal = Number(qboUnmatched._sum.amount ?? 0)
  const variance = Math.abs(bankTotal - qboTotal)

  return {
    matchedCount,
    pendingCount,
    anomalyCount,
    variance,
  }
}

export default async function WorkspaceDashboard({
  params,
}: WorkspaceDashboardProps) {
  const { id } = await params
  const stats = await getDashboardStats(id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Suspense fallback={<div className="h-9 w-[180px] bg-muted rounded animate-pulse" />}>
          <PeriodSelector />
        </Suspense>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Matched Card - Green */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Matched
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {stats.matchedCount}
            </div>
            <p className="text-xs text-green-600">
              Transactions reconciled
            </p>
          </CardContent>
        </Card>

        {/* Pending Review Card - Yellow */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {stats.pendingCount}
            </div>
            <p className="text-xs text-yellow-600">
              Transactions need attention
            </p>
          </CardContent>
        </Card>

        {/* Anomalies Card - Red */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Anomalies
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {stats.anomalyCount}
            </div>
            <p className="text-xs text-red-600">
              Issues detected
            </p>
          </CardContent>
        </Card>

        {/* Variance Card - Blue/Gray */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Variance
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(stats.variance)}
            </div>
            <p className="text-xs text-blue-600">
              Unmatched difference
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <QuickActions workspaceId={id} />
      </div>
    </div>
  )
}
