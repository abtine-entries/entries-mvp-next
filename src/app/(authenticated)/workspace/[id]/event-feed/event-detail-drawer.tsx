'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SourceIcon } from '@/components/ui/source-icon'
import { PropertiesSection } from '../event/[eventId]/properties-section'
import { NotesSection } from '../event/[eventId]/notes-section'
import { AuditTrailSection } from '../event/[eventId]/audit-trail-section'
import { getEventDetail, type EventDetailData, type SerializedEntityDetail } from '../event/[eventId]/actions'

interface EventDetailDrawerProps {
  workspaceId: string
  eventId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetailField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0', className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

function renderDetailValue(detail: SerializedEntityDetail) {
  const inner = detail.badge ? (
    <Badge variant={detail.badge.variant}>{detail.value}</Badge>
  ) : (
    <span className="font-medium">{detail.value}</span>
  )

  if (detail.sourceKey) {
    return (
      <span className="flex items-center gap-1.5">
        <SourceIcon sourceKey={detail.sourceKey} />
        {inner}
      </span>
    )
  }

  return inner
}

export function EventDetailDrawer({ workspaceId, eventId, open, onOpenChange }: EventDetailDrawerProps) {
  const [data, setData] = useState<EventDetailData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!eventId || !open) return

    setLoading(true)
    setData(null)

    getEventDetail(workspaceId, eventId).then((result) => {
      if (result.success && result.data) {
        setData(result.data)
      }
      setLoading(false)
    })
  }, [eventId, open, workspaceId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        )}

        {!loading && data && (
          <>
            <SheetHeader>
              <SheetDescription>Event Details</SheetDescription>
              <SheetTitle className="text-lg leading-snug pr-6">{data.event.title}</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-6">
              {/* Entity details as flat DetailField rows */}
              <div className="space-y-1">
                <DetailField
                  label="Type"
                  value={<Badge variant="outline">{data.event.entityType}</Badge>}
                />
                {data.entityDetails
                  .filter((d) => d.value != null)
                  .map((detail) => (
                    <DetailField
                      key={detail.label}
                      label={detail.label}
                      value={renderDetailValue(detail)}
                    />
                  ))}
              </div>

              <PropertiesSection
                workspaceId={workspaceId}
                eventId={data.event.id}
                definitions={data.propertyDefinitions}
                properties={data.properties}
                flat
              />

              <NotesSection
                workspaceId={workspaceId}
                eventId={data.event.id}
                initialNotes={data.notes}
                flat
              />

              <AuditTrailSection
                entries={data.auditEntries}
                originPayload={data.originPayload}
                originTimestamp={data.event.createdAt}
                originSourceKey={data.entitySourceKey ?? undefined}
                originSourceLabel={data.entitySourceLabel ?? undefined}
                flat
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
