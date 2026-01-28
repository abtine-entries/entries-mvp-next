'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { recentActivityColumns } from './recent-activity-columns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Search, CalendarIcon, Clock2Icon, X } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import type { RecentActivityEvent } from './actions'

function formatTimeValue(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function hasNonDefaultTime(range: DateRange | undefined): boolean {
  if (!range?.from) return false
  if (range.from.getHours() !== 0 || range.from.getMinutes() !== 0) return true
  if (range.to && (range.to.getHours() !== 23 || range.to.getMinutes() !== 59)) return true
  return false
}

export function RecentActivityFeed({ events }: { events: RecentActivityEvent[] }) {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const sources = useMemo(() => {
    const unique = new Map<string, string>()
    for (const event of events) {
      if (!unique.has(event.source)) {
        unique.set(event.source, event.sourceLabel)
      }
    }
    return Array.from(unique.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [events])

  function handleDateRangeSelect(range: DateRange | undefined) {
    if (!range) {
      setDateRange(undefined)
      return
    }

    const newFrom = range.from ? new Date(range.from) : undefined
    const newTo = range.to ? new Date(range.to) : undefined

    // Preserve existing times when the calendar changes the date
    if (newFrom) {
      if (dateRange?.from) {
        newFrom.setHours(dateRange.from.getHours(), dateRange.from.getMinutes(), 0, 0)
      } else {
        newFrom.setHours(0, 0, 0, 0)
      }
    }
    if (newTo) {
      if (dateRange?.to) {
        newTo.setHours(dateRange.to.getHours(), dateRange.to.getMinutes(), 59, 999)
      } else {
        newTo.setHours(23, 59, 59, 999)
      }
    }

    setDateRange({ from: newFrom, to: newTo })
  }

  function handleTimeChange(edge: 'from' | 'to', timeStr: string) {
    if (!dateRange?.from) return
    const [h, m] = timeStr.split(':').map(Number)

    if (edge === 'from') {
      const next = new Date(dateRange.from)
      next.setHours(h, m, 0, 0)
      setDateRange({ ...dateRange, from: next })
    } else if (dateRange.to) {
      const next = new Date(dateRange.to)
      next.setHours(h, m, 59, 999)
      setDateRange({ ...dateRange, to: next })
    }
  }

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (search) {
        const q = search.toLowerCase()
        const matches =
          event.description.toLowerCase().includes(q) ||
          event.workspaceName.toLowerCase().includes(q) ||
          event.type.toLowerCase().includes(q) ||
          event.sourceLabel.toLowerCase().includes(q)
        if (!matches) return false
      }

      if (sourceFilter !== 'all' && event.source !== sourceFilter) {
        return false
      }

      if (dateRange?.from) {
        const eventDate = new Date(event.occurredAt)
        if (eventDate < dateRange.from) return false

        if (dateRange.to) {
          if (eventDate > dateRange.to) return false
        }
      }

      return true
    })
  }, [events, search, sourceFilter, dateRange])

  const hasActiveFilters = search || sourceFilter !== 'all' || dateRange?.from

  function clearFilters() {
    setSearch('')
    setSourceFilter('all')
    setDateRange(undefined)
  }

  const showTime = hasNonDefaultTime(dateRange)
  const dateFormat = showTime ? 'MMM d, h:mm a' : 'MMM d'

  if (events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center text-muted-foreground text-sm">
        No recent activity. Connect your first data source to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter bar — outside the table card */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs w-64"
          />
        </div>

        {/* Source filter */}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger size="sm" className="h-8 text-xs w-auto min-w-[120px]">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-normal">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, dateFormat)} – {format(dateRange.to, dateFormat)}
                  </>
                ) : (
                  format(dateRange.from, showTime ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy')
                )
              ) : (
                'Date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              defaultMonth={dateRange?.from}
            />
            {dateRange?.from && (
              <div className="border-t border-border px-3 py-3">
                <FieldGroup className="flex-row gap-4">
                  <Field>
                    <FieldLabel htmlFor="time-from">Start Time</FieldLabel>
                    <InputGroup className="h-8">
                      <InputGroupInput
                        id="time-from"
                        type="time"
                        value={formatTimeValue(dateRange.from)}
                        onChange={(e) => handleTimeChange('from', e.target.value)}
                        className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                      <InputGroupAddon align="inline-end">
                        <Clock2Icon className="text-muted-foreground" />
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                  {dateRange.to && (
                    <Field>
                      <FieldLabel htmlFor="time-to">End Time</FieldLabel>
                      <InputGroup className="h-8">
                        <InputGroupInput
                          id="time-to"
                          type="time"
                          value={formatTimeValue(dateRange.to)}
                          onChange={(e) => handleTimeChange('to', e.target.value)}
                          className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        />
                        <InputGroupAddon align="inline-end">
                          <Clock2Icon className="text-muted-foreground" />
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  )}
                </FieldGroup>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No activity matches your filters.
          </div>
        ) : (
          <DataTable
            columns={recentActivityColumns}
            data={filtered}
            showHeader={false}
            getRowHref={(row) => `/workspace/${row.original.workspaceId}/event-feed`}
            className="[&_tr]:border-0"
          />
        )}
      </div>
    </div>
  )
}
