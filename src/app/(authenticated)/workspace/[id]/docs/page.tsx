import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, FileText } from 'lucide-react'
import { getDocuments } from './actions'
import { DocsDataTable } from './docs-data-table'
import { DocumentUpload } from './document-upload'

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

  const documents = await getDocuments(workspace.id)

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
          <DocsDataTable data={documents} />
        </div>
      </div>
    </div>
  )
}
