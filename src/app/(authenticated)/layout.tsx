import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Header } from './header'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={session.user.email ?? ''} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
