import { redirect } from 'next/navigation'

interface WorkspaceDashboardProps {
  params: Promise<{ id: string }>
}

export default async function WorkspaceDashboard({
  params,
}: WorkspaceDashboardProps) {
  const { id } = await params

  // Redirect to event feed as the default workspace home page
  redirect(`/workspace/${id}/event-feed`)
}
