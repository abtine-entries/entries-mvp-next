'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AlertFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const priority = searchParams.get('priority') ?? 'all'
  const type = searchParams.get('type') ?? 'all'
  const q = searchParams.get('q') ?? ''

  const hasFilters = priority !== 'all' || type !== 'all' || q !== ''

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === 'all' || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search alerts..."
          value={q}
          onChange={(e) => updateParams({ q: e.target.value })}
          className="pl-9 w-[220px] h-9"
        />
      </div>
      <Select
        value={priority}
        onValueChange={(value) => updateParams({ priority: value })}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="requires_action">Requires Action</SelectItem>
          <SelectItem value="fyi">FYI</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={type}
        onValueChange={(value) => updateParams({ type: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="anomaly">Anomaly</SelectItem>
          <SelectItem value="ai_question">AI Question</SelectItem>
          <SelectItem value="system">System</SelectItem>
          <SelectItem value="insight">Insight</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2.5">
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
