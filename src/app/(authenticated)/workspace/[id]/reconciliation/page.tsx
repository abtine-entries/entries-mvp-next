import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileSpreadsheet } from 'lucide-react'

interface ReconciliationPageProps {
  params: Promise<{ id: string }>
}

export default async function ReconciliationPage({
  params,
}: ReconciliationPageProps) {
  const { id } = await params

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Transaction Reconciliation</h2>

      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-250px)]">
        {/* Bank Transactions Panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0 border-b">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Bank Transactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="text-sm text-muted-foreground">
              Bank transactions will appear here.
            </div>
          </CardContent>
        </Card>

        {/* QBO Transactions Panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0 border-b">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">QuickBooks Transactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="text-sm text-muted-foreground">
              QuickBooks transactions will appear here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
