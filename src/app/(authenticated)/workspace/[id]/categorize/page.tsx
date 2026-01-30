import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Tags } from 'lucide-react'
import { getCategorizeData } from './actions'
import { CategorizeSplitView } from './categorize-split-view'

interface CategorizePageProps {
  params: Promise<{ id: string }>
}

export default async function CategorizePage({ params }: CategorizePageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const data = await getCategorizeData(workspace.id)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/esme`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Categorize', icon: <Tags className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-hidden">
        <CategorizeSplitView data={data} workspaceId={workspace.id} />
      </div>
    </div>
  )
}
