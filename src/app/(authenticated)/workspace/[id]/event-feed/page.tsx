import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Sparkles,
  Plus,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventFeedPageProps {
  params: Promise<{ id: string }>
}

// Mock event data based on the screenshot
const mockEvents = [
  {
    id: '1',
    occurredAt: new Date('2024-01-20T10:00:00'),
    source: 'entries',
    sourceIcon: Sparkles,
    description: 'Matched bank deposit to Invoice #1042',
    type: 'match',
  },
  {
    id: '2',
    occurredAt: new Date('2024-01-20T09:32:00'),
    source: 'qbo',
    sourceLabel: 'QBO',
    description: '$2,500.00 received from Client ABC Inc',
    type: 'income',
  },
  {
    id: '3',
    occurredAt: new Date('2024-01-20T06:15:00'),
    source: 'qbo',
    sourceLabel: 'QBO',
    description: '$450.00 bill created for Office Depot',
    type: 'expense',
  },
  {
    id: '4',
    occurredAt: new Date('2024-01-20T04:00:00'),
    source: 'qbo',
    sourceLabel: 'QBO',
    description: 'Invoice #1043 created for $8,750.00',
    type: 'invoice',
  },
  {
    id: '5',
    occurredAt: new Date('2024-01-20T03:45:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$1,234.56 spent at Amazon Web Services',
    type: 'expense',
  },
  {
    id: '6',
    occurredAt: new Date('2024-01-20T02:30:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$156.32 spent at Staples',
    type: 'expense',
  },
  {
    id: '7',
    occurredAt: new Date('2024-01-19T11:45:00'),
    source: 'entries',
    sourceIcon: Sparkles,
    description: 'Categorized Staples purchase as Office Supplies',
    type: 'categorization',
  },
  {
    id: '8',
    occurredAt: new Date('2024-01-19T11:20:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$99.00 spent at Slack Technologies',
    type: 'expense',
  },
  {
    id: '9',
    occurredAt: new Date('2024-01-19T09:00:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$2,500.00 deposit from Client ABC Inc',
    type: 'income',
  },
  {
    id: '10',
    occurredAt: new Date('2024-01-19T06:30:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$45.00 spent at Zoom Video Communications',
    type: 'expense',
  },
  {
    id: '11',
    occurredAt: new Date('2024-01-18T10:45:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$299.00 spent at Adobe Inc',
    type: 'expense',
  },
  {
    id: '12',
    occurredAt: new Date('2024-01-18T05:00:00'),
    source: 'plaid',
    sourceLabel: 'Plaid',
    description: '$3,500.00 rent payment to WeWork',
    type: 'expense',
  },
]

// Mock data sources
const dataSources = [
  { id: 'qbo', name: 'QuickBooks Online', icon: '🟢', connected: true },
  { id: 'plaid', name: 'Plaid', icon: '⬛', connected: true },
  { id: 'entries', name: 'Entries AI', icon: '⚡', connected: true },
]

function formatEventTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function SourceBadge({ source, label, icon: Icon }: { source: string; label?: string; icon?: React.ComponentType<{ className?: string }> }) {
  if (source === 'entries' && Icon) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-primary">
        <Icon className="h-4 w-4" />
        <span>Entries</span>
      </div>
    )
  }

  const colors: Record<string, string> = {
    qbo: 'bg-green-500/20 text-green-400 border-green-500/30',
    plaid: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <Badge variant="outline" className={cn('text-xs font-normal', colors[source])}>
      {label}
    </Badge>
  )
}

export default async function EventFeedPage({ params }: EventFeedPageProps) {
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
          { label: 'Entries', href: '/' },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed` },
          { label: 'Event Feed' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex gap-6 max-w-6xl">
          {/* Left sidebar with filters */}
          <div className="w-64 shrink-0 space-y-6">
            {/* Data Sources */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Data Sources
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <span className="text-sm">{source.icon}</span>
                      <span className="text-sm">{source.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filter by Source */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Filter by Source
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-border bg-background"
                    />
                    <span className="text-sm">All Sources</span>
                  </label>
                  {dataSources.map((source) => (
                    <label
                      key={source.id}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-border bg-background"
                      />
                      <span className="text-sm text-muted-foreground">
                        {source.name}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Date Range
                </h3>
                <Button variant="outline" className="w-full justify-start text-sm">
                  📅 All time
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Event list */}
          <div className="flex-1">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {/* Table header */}
                <div className="grid grid-cols-[180px_100px_1fr] gap-4 px-4 py-3 border-b border-border text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Occurred
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Source
                  </div>
                  <div>Description</div>
                </div>

                {/* Event rows */}
                <div className="divide-y divide-border">
                  {mockEvents.map((event) => (
                    <div
                      key={event.id}
                      className="grid grid-cols-[180px_100px_1fr] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="text-sm text-muted-foreground">
                        {formatEventTime(event.occurredAt)}
                      </div>
                      <div>
                        <SourceBadge
                          source={event.source}
                          label={event.sourceLabel}
                          icon={event.sourceIcon}
                        />
                      </div>
                      <div className="text-sm">{event.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
