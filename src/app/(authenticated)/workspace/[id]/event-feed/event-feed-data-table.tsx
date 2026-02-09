'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { columns as staticColumns, type EventFeedItem } from './columns'
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
import { Search, CalendarIcon, Clock2Icon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { EventDetailDrawer } from './event-detail-drawer'
import { AddRelationColumnButton } from '@/components/ui/add-relation-column-button'
import { buildRelationColumns } from '@/components/ui/relation-column-utils'
import type { RelationColumnRecord, RelationLinksMap } from '@/app/(authenticated)/workspace/[id]/explorer/relation-actions'

const PAGE_SIZE = 25

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

interface EventFeedDataTableProps {
  data: EventFeedItem[]
  workspaceId: string
  relationColumns: RelationColumnRecord[]
  relationLinksMap: Record<string, RelationLinksMap>
}

function EventFeedDataTableInner({ data, workspaceId, relationColumns, relationLinksMap }: EventFeedDataTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialSearch = searchParams.get('q') ?? ''
  const initialSource = searchParams.get('source') ?? 'all'
  const initialSortId = searchParams.get('sortBy') ?? ''
  const initialSortDesc = searchParams.get('sortDesc') === 'true'

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [search, setSearch] = useState(initialSearch)
  const [sourceFilter, setSourceFilter] = useState<string>(initialSource)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sorting, setSorting] = useState<SortingState>(
    initialSortId ? [{ id: initialSortId, desc: initialSortDesc }] : []
  )

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      updateParams({ q: value })
    },
    [updateParams]
  )

  const handleSourceChange = useCallback(
    (value: string) => {
      setSourceFilter(value)
      updateParams({ source: value })
    },
    [updateParams]
  )

  const handleSortingChange = useCallback(
    (next: SortingState) => {
      setSorting(next)
      if (next.length > 0) {
        updateParams({ sortBy: next[0].id, sortDesc: String(next[0].desc) })
      } else {
        updateParams({ sortBy: '', sortDesc: '' })
      }
    },
    [updateParams]
  )

  const sources = useMemo(() => {
    const unique = new Map<string, string>()
    for (const event of data) {
      if (!unique.has(event.source)) {
        unique.set(event.source, event.sourceLabel)
      }
    }
    return Array.from(unique.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [data])

  function handleDateRangeSelect(range: DateRange | undefined) {
    if (!range) {
      setDateRange(undefined)
      return
    }

    const newFrom = range.from ? new Date(range.from) : undefined
    const newTo = range.to ? new Date(range.to) : undefined

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

  const dynamicRelationColumns = useMemo(
    () => buildRelationColumns<EventFeedItem>(relationColumns, relationLinksMap, workspaceId),
    [relationColumns, relationLinksMap, workspaceId]
  )

  const columns = useMemo(
    () => [...staticColumns, ...dynamicRelationColumns],
    [dynamicRelationColumns]
  )

  // Pre-filter by source and date range before passing to the table
  const preFiltered = useMemo(() => {
    return data.filter((event) => {
      if (sourceFilter !== 'all' && event.source !== sourceFilter) {
        return false
      }

      if (dateRange?.from) {
        const eventDate = new Date(event.occurredAt)
        if (eventDate < dateRange.from) return false
        if (dateRange.to && eventDate > dateRange.to) return false
      }

      return true
    })
  }, [data, sourceFilter, dateRange])

  const table = useReactTable({
    data: preFiltered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      handleSortingChange(next)
    },
    onGlobalFilterChange: handleSearchChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex
  const filteredCount = table.getFilteredRowModel().rows.length

  const hasActiveFilters = search || sourceFilter !== 'all' || dateRange?.from

  function clearFilters() {
    setSearch('')
    setSourceFilter('all')
    setDateRange(undefined)
    updateParams({ q: '', source: 'all' })
  }

  const showTime = hasNonDefaultTime(dateRange)
  const dateFormat = showTime ? 'MMM d, h:mm a' : 'MMM d'

  if (data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
        No events yet. Events will appear here as transactions, matches, and other activities occur.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-8"
          />
        </div>

        {/* Source filter */}
        <Select value={sourceFilter} onValueChange={handleSourceChange}>
          <SelectTrigger size="sm" className="w-[140px]">
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

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width: header.getSize() !== 150 ? header.getSize() : undefined,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
              <TableHead style={{ width: 40 }}>
                <AddRelationColumnButton
                  workspaceId={workspaceId}
                  sourceTable="events"
                />
              </TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50 group/row"
                onClick={() => {
                  setSelectedEventId(row.original.id)
                  setDrawerOpen(true)
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="h-24 text-center text-muted-foreground"
              >
                No events match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage + 1} of {pageCount} ({filteredCount} of {preFiltered.length} rows)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <EventDetailDrawer
        workspaceId={workspaceId}
        eventId={selectedEventId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}

export function EventFeedDataTable(props: EventFeedDataTableProps) {
  return (
    <Suspense fallback={null}>
      <EventFeedDataTableInner {...props} />
    </Suspense>
  )
}
