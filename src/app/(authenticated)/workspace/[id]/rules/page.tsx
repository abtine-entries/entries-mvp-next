import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BookOpen, Building2 } from 'lucide-react'
import { CreateRuleModal } from './create-rule-modal'
import { RulesDataTable } from './rules-data-table'

interface RulesPageProps {
  params: Promise<{ id: string }>
}

export default async function RulesPage({ params }: RulesPageProps) {
  const { id: workspaceId } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const rules = await prisma.rule.findMany({
    where: { workspaceId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Rules', icon: <BookOpen className="h-4 w-4" /> },
        ]}
        actions={<CreateRuleModal workspaceId={workspaceId} />}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Rules ({rules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No rules yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Create categorization rules to automatically categorize
                    transactions based on patterns like vendor names or descriptions.
                  </p>
                </div>
              ) : (
                <RulesDataTable rules={rules} workspaceId={workspaceId} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
