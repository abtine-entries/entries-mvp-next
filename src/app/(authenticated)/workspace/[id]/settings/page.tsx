import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Building2, Settings } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { getSettingsData } from './actions'
import { SettingsForm } from './settings-form'

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id: workspaceId } = await params

  const { workspace, confidences } = await getSettingsData(workspaceId)

  if (!workspace) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          {
            label: 'Entries',
            href: '/',
            icon: (
              <Image
                src="/entries-icon.png"
                alt="Entries"
                width={16}
                height={16}
                className="h-4 w-4 rounded-[3px]"
              />
            ),
          },
          {
            label: workspace.name,
            href: `/workspace/${workspace.id}/esme`,
            icon: <Building2 className="h-4 w-4" />,
          },
          { label: 'Settings', icon: <Settings className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="max-w-2xl">
          <SettingsForm
            workspaceId={workspaceId}
            autonomyLevel={workspace.autonomyLevel}
            confidences={confidences}
          />
        </div>
      </div>
    </div>
  )
}
