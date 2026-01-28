import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { History } from 'lucide-react'

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
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
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

export function AuditTrailSection({ entries }: AuditTrailSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        )}

        {entries.length > 0 && (
          <div className="relative ml-3">
            <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />
            <div className="space-y-4">
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
