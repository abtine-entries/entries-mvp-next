import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { FileText, BookOpen, Building2 } from 'lucide-react'
import { CreateRuleSheet } from './create-rule-sheet'
import { RulesDataTable } from './rules-data-table'
import { getRelationColumns, getRelationLinks } from '../explorer/relation-actions'
import type { RelationLinksMap } from '../explorer/relation-actions'

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

  const [rules, relationColumns] = await Promise.all([
    prisma.rule.findMany({
      where: { workspaceId },
      select: { id: true, ruleText: true, matchCount: true, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    getRelationColumns(workspaceId, 'rules'),
  ])

  // Batch-fetch relation links for all rule IDs per relation column
  const ruleIds = rules.map((r) => r.id)
  const relationLinksMap: Record<string, RelationLinksMap> = {}
  if (relationColumns.length > 0 && ruleIds.length > 0) {
    const linkResults = await Promise.all(
      relationColumns.map((col) => getRelationLinks(col.id, ruleIds))
    )
    for (let i = 0; i < relationColumns.length; i++) {
      relationLinksMap[relationColumns[i].id] = linkResults[i]
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/esme`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Rules', icon: <BookOpen className="h-4 w-4" /> },
        ]}
        actions={<CreateRuleSheet workspaceId={workspaceId} />}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Rules ({rules.length})
          </p>
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
            <RulesDataTable
              rules={rules}
              workspaceId={workspaceId}
              relationColumns={relationColumns}
              relationLinksMap={relationLinksMap}
            />
          )}
        </div>
      </div>
    </div>
  )
}
