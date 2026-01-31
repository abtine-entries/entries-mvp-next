import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, FileText } from 'lucide-react'
import { getDocuments } from './actions'
import { DocsDataTable } from './docs-data-table'
import { DocumentUpload } from './document-upload'
import { getRelationColumns, getRelationLinks } from '../explorer/relation-actions'
import type { RelationLinksMap } from '../explorer/relation-actions'

interface DocsPageProps {
  params: Promise<{ id: string }>
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const [documents, relationColumns] = await Promise.all([
    getDocuments(workspace.id),
    getRelationColumns(workspace.id, 'documents'),
  ])

  // Batch-fetch relation links for all document IDs per relation column
  const documentIds = documents.map((d) => d.id)
  const relationLinksMap: Record<string, RelationLinksMap> = {}
  if (relationColumns.length > 0 && documentIds.length > 0) {
    const linkResults = await Promise.all(
      relationColumns.map((col) => getRelationLinks(col.id, documentIds))
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
          { label: 'Docs', icon: <FileText className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="space-y-6">
          {/* Upload area with drag-and-drop */}
          <DocumentUpload workspaceId={workspace.id} />

          {/* Documents table */}
          <DocsDataTable
            data={documents}
            workspaceId={workspace.id}
            relationColumns={relationColumns}
            relationLinksMap={relationLinksMap}
          />
        </div>
      </div>
    </div>
  )
}
