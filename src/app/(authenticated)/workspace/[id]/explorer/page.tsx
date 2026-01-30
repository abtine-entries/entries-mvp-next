import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Building2, Table2 } from 'lucide-react'
import { org } from '@/lib/config'
import { getExplorerData } from './actions'
import { ExplorerTabs } from './explorer-tabs'

interface ExplorerPageProps {
  params: Promise<{ id: string }>
}

export default async function ExplorerPage({ params }: ExplorerPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  const data = await getExplorerData(workspace.id)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          {
            label: org.name,
            href: '/',
            icon: (
              <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">
                {org.initials}
              </span>
            ),
          },
          {
            label: workspace.name,
            href: `/workspace/${workspace.id}/esme`,
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            label: 'Data Explorer',
            icon: <Table2 className="h-4 w-4" />,
          },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <ExplorerTabs data={data} />
      </div>
    </div>
  )
}
