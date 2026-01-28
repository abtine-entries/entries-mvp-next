import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Check,
  Plug,
  Plus,
  ExternalLink,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectorsPageProps {
  params: Promise<{ id: string }>
}

// Mock connected apps
const connectedApps = [
  {
    id: 'qbo',
    name: 'QuickBooks Online',
    description: 'Accounting software',
    logo: '🟢',
    status: 'connected',
    lastSync: new Date('2024-01-20T10:00:00'),
    accountName: 'Acme Corporation',
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Bank connections',
    logo: '⬛',
    status: 'connected',
    lastSync: new Date('2024-01-20T09:30:00'),
    accountName: 'Chase Business ****4521',
  },
]

// Mock available connectors
const availableConnectors = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    logo: '💳',
    category: 'Payments',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Accounting software',
    logo: '🔵',
    category: 'Accounting',
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Point of sale',
    logo: '⬜',
    category: 'Payments',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform',
    logo: '🛍️',
    category: 'E-commerce',
  },
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Payroll & HR',
    logo: '🧑‍💼',
    category: 'Payroll',
  },
  {
    id: 'bill',
    name: 'Bill.com',
    description: 'Accounts payable',
    logo: '📄',
    category: 'Payments',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM & Sales',
    logo: '🟠',
    category: 'CRM',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM platform',
    logo: '☁️',
    category: 'CRM',
  },
]

function formatLastSync(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 60) {
    return `${diffMins} min ago`
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`
  } else {
    return date.toLocaleDateString()
  }
}

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
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Data Connectors', icon: <Plug className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-8">
          {/* Connected Apps Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Connected Apps</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {connectedApps.map((app) => (
                <Card key={app.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{app.logo}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{app.name}</h3>
                          <Badge
                            variant="outline"
                            className="bg-green-500/20 text-green-400 border-green-500/30"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {app.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Last synced {formatLastSync(app.lastSync)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Available Connectors Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Available Connectors</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableConnectors.map((connector) => (
                <Card
                  key={connector.id}
                  className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{connector.logo}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{connector.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {connector.description}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-2 text-xs bg-muted/50"
                        >
                          {connector.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Request a Connector */}
          <section>
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-6 text-center">
                <h3 className="font-medium mb-2">Don&apos;t see what you need?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Request a new connector and we&apos;ll prioritize it based on demand.
                </p>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Request Connector
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
