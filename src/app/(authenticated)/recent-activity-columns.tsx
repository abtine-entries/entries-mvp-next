'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  Sparkles,
  ArrowLeftRight,
  Tags,
  Plug,
  Building2,
  Layers,
  FileText,
  Clock,
  Code2,
} from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'
import type { RecentActivityEvent } from './actions'

const tzAbbr = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
  .formatToParts(new Date())
  .find((p) => p.type === 'timeZoneName')?.value ?? ''

function formatEventTime(date: Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const base = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${base} ${tzAbbr}`
}

function SourceIcon({ source }: { source: string }) {
  if (source === 'entries') {
    return <Sparkles className="h-4 w-4 text-primary" />
  }

  const connectorTypes: ConnectorType[] = [
    'quickbooks', 'xero', 'stripe', 'plaid', 'chase',
    'bankofamerica', 'wells_fargo', 'mercury', 'brex',
    'ramp', 'gusto', 'adp'
  ]

  if (connectorTypes.includes(source as ConnectorType)) {
    return <ConnectorLogo connector={source as ConnectorType} size="sm" />
  }

  return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">?</div>
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Category':
      return <Tags className="h-4 w-4 text-muted-foreground" />
    case 'Match':
      return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
    default:
      return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
  }
}

function eventToPayload(event: RecentActivityEvent) {
  return {
    id: event.id,
    event_id: event.eventId,
    entity_type: event.entityType,
    entity_id: event.entityId,
    type: event.type,
    source: event.source,
    source_label: event.sourceLabel,
    workspace: {
      id: event.workspaceId,
      name: event.workspaceName,
    },
    description: event.description,
    occurred_at: event.occurredAt instanceof Date
      ? event.occurredAt.toISOString()
      : event.occurredAt,
    timezone: tzAbbr,
  }
}

function SyntaxJson({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data, null, 2)

  // Tokenize JSON for syntax highlighting
  const highlighted = json.replace(
    /("(?:\\.|[^"\\])*")\s*:/g, // keys
    '<span class="text-zinc-400">$1</span>:'
  ).replace(
    /:\s*("(?:\\.|[^"\\])*")/g, // string values
    ': <span class="text-blue-400">$1</span>'
  ).replace(
    /:\s*(\d+(?:\.\d+)?)/g, // numbers
    ': <span class="text-amber-400">$1</span>'
  ).replace(
    /:\s*(true|false|null)/g, // booleans & null
    ': <span class="text-purple-400">$1</span>'
  )

  return (
    <pre
      className="text-[11px] leading-relaxed font-mono text-zinc-300 whitespace-pre-wrap break-all"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

function JsonPayloadHover({ event }: { event: RecentActivityEvent }) {
  const payload = eventToPayload(event)

  return (
    <div className="relative flex items-center justify-end">
      <Code2 className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
      <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover:block">
        <div className="bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 shadow-2xl p-3 w-[360px] max-h-[280px] overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Event Payload</span>
            <span className="text-[10px] font-mono text-zinc-600">JSON</span>
          </div>
          <SyntaxJson data={payload} />
        </div>
      </div>
    </div>
  )
}

export const recentActivityColumns: ColumnDef<RecentActivityEvent>[] = [
  {
    id: 'source',
    size: 40,
    header: () => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Plug className="h-3.5 w-3.5" />
        <span>Source</span>
      </div>
    ),
    cell: ({ row }) => <SourceIcon source={row.original.source} />,
  },
  {
    accessorKey: 'workspaceName',
    size: 120,
    header: () => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        <span>Client</span>
      </div>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-normal text-muted-foreground truncate">
        {row.getValue('workspaceName')}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    size: 100,
    header: () => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Layers className="h-3.5 w-3.5" />
        <span>Type</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <TypeIcon type={row.getValue('type')} />
        <span>{row.getValue('type')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: () => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>Description</span>
      </div>
    ),
    cell: ({ row }) => (
      <span className="truncate">{row.getValue('description')}</span>
    ),
  },
  {
    accessorKey: 'occurredAt',
    size: 140,
    header: () => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Date</span>
      </div>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {formatEventTime(row.getValue('occurredAt'))}
      </span>
    ),
  },
  {
    id: 'payload',
    size: 32,
    header: () => null,
    cell: ({ row }) => <JsonPayloadHover event={row.original} />,
  },
]
