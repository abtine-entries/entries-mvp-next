import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  Check,
  AlertCircle,
  Landmark,
  Plug,
  Clock,
} from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import { org } from '@/lib/config'
import { ConnectorTooltipButton } from './connector-tooltip-button'

interface ConnectorsPageProps {
  params: Promise<{ id: string }>
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getConnectionStatus(qboStatus: string): {
  label: string
  variant: 'success' | 'error' | 'info'
  icon: typeof Check
} {
  switch (qboStatus) {
    case 'connected':
      return { label: 'Connected', variant: 'success', icon: Check }
    case 'syncing':
      return { label: 'Syncing', variant: 'info', icon: Clock }
    case 'error':
      return { label: 'Error', variant: 'error', icon: AlertCircle }
    default:
      return { label: 'Connected', variant: 'success', icon: Check }
  }
}

// Connected apps derived from workspace data
interface ConnectedApp {
  id: string
  name: string
  connector: ConnectorType
  status: string
  lastSyncAt: Date | null
  dataTypes: string[]
}

// Available connectors for the marketplace
const availableConnectors: {
  id: string
  name: string
  connector: ConnectorType
  description: string
  comingSoon: boolean
}[] = [
  {
    id: 'xero',
    name: 'Xero',
    connector: 'xero',
    description: 'Cloud accounting for small business',
    comingSoon: true,
  },
  {
    id: 'plaid',
    name: 'Plaid (Banking)',
    connector: 'chase', // Use bank-style icon
    description: 'Connect bank accounts and transactions',
    comingSoon: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    connector: 'slack',
    description: 'Get alerts and updates in Slack channels',
    comingSoon: true,
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    connector: 'google_drive',
    description: 'Sync documents and receipts from Drive',
    comingSoon: true,
  },
]

export default async function ConnectorsPage({ params }: ConnectorsPageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true, qboStatus: true, lastSyncAt: true },
  })

  if (!workspace) {
    notFound()
  }

  // Build connected apps from actual workspace data
  const connectedApps: ConnectedApp[] = [
    {
      id: 'qbo',
      name: 'QuickBooks Online',
      connector: 'quickbooks',
      status: workspace.qboStatus,
      lastSyncAt: workspace.lastSyncAt,
      dataTypes: ['Chart of Accounts', 'Transactions', 'Vendors'],
    },
    {
      id: 'chase',
      name: 'Chase',
      connector: 'chase',
      status: 'connected',
      lastSyncAt: workspace.lastSyncAt, // Use workspace sync time as proxy
      dataTypes: ['Bank Transactions'],
    },
  ]

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
          { label: 'Data Connectors', icon: <Plug className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 px-10 py-6 overflow-auto">
        <div className="space-y-8">
          {/* Connected Section */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Connected</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connector</TableHead>
                  <TableHead style={{ width: 120 }}>Status</TableHead>
                  <TableHead style={{ width: 140 }}>Last Synced</TableHead>
                  <TableHead>Data Types</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectedApps.map((app) => {
                  const connectionStatus = getConnectionStatus(app.status)
                  const StatusIcon = connectionStatus.icon

                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ConnectorLogo connector={app.connector} size="sm" />
                          <span className="font-medium text-sm">{app.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={connectionStatus.variant} className="text-[10px] px-1.5 py-0">
                          <StatusIcon className="h-3 w-3" />
                          {connectionStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.lastSyncAt ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {getRelativeTime(app.lastSyncAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {app.dataTypes.map((dt) => (
                            <Badge key={dt} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                              {dt}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </section>

          {/* Available Connectors Section */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Available</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connector</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead style={{ width: 120 }} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableConnectors.map((connector) => (
                  <TableRow key={connector.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {connector.id === 'plaid' ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-500 shrink-0">
                            <Landmark className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <ConnectorLogo connector={connector.connector} size="sm" />
                        )}
                        <span className="font-medium text-sm">{connector.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{connector.description}</span>
                    </TableCell>
                    <TableCell>
                      <ConnectorTooltipButton comingSoon={connector.comingSoon} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      </div>
    </div>
  )
}
