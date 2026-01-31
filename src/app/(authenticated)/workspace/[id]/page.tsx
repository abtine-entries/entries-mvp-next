import { redirect } from 'next/navigation'

interface WorkspaceDashboardProps {
  params: Promise<{ id: string }>
}

export default async function WorkspaceDashboard({
  params,
}: WorkspaceDashboardProps) {
  const { id } = await params

  // Redirect to Esme as the default workspace home page
  redirect(`/workspace/${id}/esme`)
}
