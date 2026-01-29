'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, Code2, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { SyntaxJson } from '@/components/ui/syntax-json'
import { SourceIcon } from '@/components/ui/source-icon'

interface AuditEntry {
  id: string
  action: string
  userId: string
  userName: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

interface AuditTrailSectionProps {
  entries: AuditEntry[]
  /** The original event payload shown as the first timeline entry */
  originPayload?: Record<string, unknown>
  /** When the event was created (ISO string) — used for the origin entry timestamp */
  originTimestamp?: string
  /** Raw source key for logo rendering, e.g. "chase", "quickbooks", "entries" */
  originSourceKey?: string
  /** Human-readable source label, e.g. "Chase", "QuickBooks", "Entries AI" */
  originSourceLabel?: string
}

function formatAction(action: string): string {
  switch (action) {
    case 'property_updated':
      return 'Property updated'
    case 'note_added':
      return 'Note added'
    case 'categorize':
      return 'Categorized'
    case 'match_created':
      return 'Match created'
    case 'anomaly_detected':
      return 'Anomaly detected'
    case 'rule_applied':
      return 'Rule applied'
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  const base = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value ?? ''

  return `${base}, ${time} ${tz}`
}

function parseJsonSafe(value: string | null): Record<string, unknown> | null {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function renderEntryDetail(entry: AuditEntry) {
  if (entry.action === 'property_updated') {
    const oldParsed = parseJsonSafe(entry.oldValue)
    const newParsed = parseJsonSafe(entry.newValue)
    const propertyName =
      (newParsed?.propertyName as string) ??
      (oldParsed?.propertyName as string) ??
      'Unknown property'
    const oldVal = oldParsed?.oldValue as string | undefined
    const newVal = newParsed?.newValue as string | undefined

    return (
      <div className="text-xs text-muted-foreground mt-1">
        <span className="font-medium">{propertyName}</span>
        {oldVal != null && (
          <>
            : <span className="line-through">{oldVal}</span>
          </>
        )}
        {oldVal != null && newVal != null && ' → '}
        {oldVal == null && newVal != null && ': '}
        {newVal != null && <span>{newVal}</span>}
      </div>
    )
  }

  if (entry.action === 'note_added') {
    const newParsed = parseJsonSafe(entry.newValue)
    const content = newParsed?.content as string | undefined
    if (content) {
      const preview = content.length > 80 ? content.slice(0, 80) + '…' : content
      return (
        <div className="text-xs text-muted-foreground mt-1 italic">
          &ldquo;{preview}&rdquo;
        </div>
      )
    }
  }

  return null
}

function OriginPayloadDetail({ payload }: { payload: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Code2 className="h-3 w-3" />
        <span>View payload</span>
      </button>

      {expanded && (
        <div className="mt-2 bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Event Payload
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 gap-1 px-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="p-3 max-h-[400px] overflow-auto">
            <SyntaxJson data={payload} />
          </div>
        </div>
      )}
    </div>
  )
}

export function AuditTrailSection({ entries, originPayload, originTimestamp, originSourceKey, originSourceLabel }: AuditTrailSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 && !originPayload && (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        )}

        {(entries.length > 0 || originPayload) && (
          <div className="relative ml-3">
            <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />
            <div className="space-y-4">
              {/* Audit log entries (newest first) */}
              {entries.map((entry) => (
                <div key={entry.id} className="relative pl-5">
                  <div className="absolute left-[-3px] top-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatAction(entry.action)}
                    </span>
                    <span>&middot;</span>
                    <span>{entry.userName ?? 'System'}</span>
                    <span>&middot;</span>
                    <span>{formatTimestamp(entry.createdAt)}</span>
                  </div>
                  {renderEntryDetail(entry)}
                </div>
              ))}

              {/* Origin entry — always last (oldest) */}
              {originPayload && originTimestamp && (
                <div className="relative pl-5">
                  <div className="absolute left-[-3px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Event created
                    </span>
                    {originSourceKey && originSourceLabel && (
                      <>
                        <span>&middot;</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex items-center justify-center h-3.5 w-3.5 shrink-0 [&>*]:!h-3.5 [&>*]:!w-3.5 [&_img]:!h-3.5 [&_img]:!w-3.5">
                            <SourceIcon sourceKey={originSourceKey} size="sm" />
                          </span>
                          {originSourceLabel}
                        </span>
                      </>
                    )}
                    <span>&middot;</span>
                    <span>{formatTimestamp(originTimestamp)}</span>
                  </div>
                  <OriginPayloadDetail payload={originPayload} />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
