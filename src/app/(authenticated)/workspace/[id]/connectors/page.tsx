import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building2,
  Check,
  CircleHelp,
  Landmark,
  Plug,
  Plus,
  Settings,
} from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import { org } from '@/lib/config'

interface ConnectorsPageProps {
  params: Promise<{ id: string }>
}

// Mock connected apps
const connectedApps: {
  id: string
  name: string
  connector: ConnectorType
  accountName: string
}[] = [
  {
    id: 'qbo',
    name: 'QuickBooks Online',
    connector: 'quickbooks',
    accountName: 'Acme Corporation',
  },
  {
    id: 'chase',
    name: 'Chase',
    connector: 'chase',
    accountName: 'Chase Business ****4521',
  },
  {
    id: 'wise',
    name: 'Wise',
    connector: 'wise',
    accountName: 'Wise Business ****7832',
  },
]

// Mock available connectors (ConnectorType items)
const availableConnectors: {
  id: string
  name: string
  connector: ConnectorType
  beta?: boolean
}[] = [
  { id: 'stripe', name: 'Stripe', connector: 'stripe' },
  { id: 'xero', name: 'Xero', connector: 'xero' },
  { id: 'square', name: 'Square', connector: 'square', beta: true },
  { id: 'shopify', name: 'Shopify', connector: 'shopify' },
  { id: 'gusto', name: 'Gusto', connector: 'gusto', beta: true },
  { id: 'bill', name: 'Bill.com', connector: 'bill' },
  { id: 'hubspot', name: 'HubSpot', connector: 'hubspot', beta: true },
  { id: 'salesforce', name: 'Salesforce', connector: 'salesforce' },
  { id: 'slack', name: 'Slack', connector: 'slack' },
  { id: 'whatsapp', name: 'WhatsApp', connector: 'whatsapp', beta: true },
  { id: 'gmail', name: 'Gmail', connector: 'gmail' },
  { id: 'google_drive', name: 'Google Drive', connector: 'google_drive' },
]

export default async function ConnectorsPage({ params }: ConnectorsPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: org.name, href: '/', icon: <span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-[9px] font-semibold">{org.initials}</span> },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Data Connectors', icon: <Plug className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Connected Section */}
          <section>
            <h2 className="text-sm font-semibold mb-4">Connected</h2>
            <div className="divide-y divide-border">
              {connectedApps.map((app) => (
                <div key={app.id} className="flex items-center gap-3 py-3">
                  <ConnectorLogo connector={app.connector} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium">{app.name}</h3>
                    <p className="text-sm text-muted-foreground">{app.accountName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4" />
                      Connected
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Available Connectors Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                Workspace Data Connectors
                <CircleHelp className="h-4 w-4 text-muted-foreground" />
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Workspace owners can connect all your team&apos;s financial data sources.
              </p>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {/* Connect Bank Feed — special entry */}
              <Card className="flex-row items-center gap-3 py-3 px-4 hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center gap-3 p-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white shrink-0">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium flex-1">Connect Bank Feed</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              {availableConnectors.map((connector) => (
                <Card
                  key={connector.id}
                  className="flex-row items-center gap-3 py-3 px-4 hover:border-primary/50 transition-colors"
                >
                  <CardContent className="flex items-center gap-3 p-0 flex-1">
                    <ConnectorLogo connector={connector.connector} size="md" />
                    <span className="text-sm font-medium flex-1">{connector.name}</span>
                    {connector.beta && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-blue-400 border-blue-400/40">
                        Beta
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
