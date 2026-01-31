'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home,
  Building2,
  ArrowLeftRight,
  BookOpen,
  Activity,
  Loader2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import {
  universalSearch,
  type SearchResults,
  type SearchResult,
} from '@/app/(authenticated)/search-actions'

interface Workspace {
  id: string
  name: string
}

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaces: Workspace[]
}

const typeIcons: Record<SearchResult['type'], React.ComponentType<{ className?: string }>> = {
  workspace: Building2,
  transaction: ArrowLeftRight,
  rule: BookOpen,
  event: Activity,
}

const typeLabels: Record<SearchResult['type'], string> = {
  workspace: 'Workspaces',
  transaction: 'Transactions',
  rule: 'Rules',
  event: 'Events',
}

export function SearchModal({ open, onOpenChange, workspaces }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(null)
      setIsSearching(false)
    }
  }, [open])

  // Debounced search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (!searchQuery.trim()) {
        setResults(null)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await universalSearch(searchQuery)
          setResults(data)
        } catch {
          setResults(null)
        } finally {
          setIsSearching(false)
        }
      }, 300)
    },
    []
  )

  function handleQueryChange(value: string) {
    setQuery(value)
    performSearch(value)
  }

  function navigateTo(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  const hasQuery = query.trim().length > 0
  const hasResults =
    results &&
    (results.workspaces.length > 0 ||
      results.transactions.length > 0 ||
      results.rules.length > 0 ||
      results.events.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 sm:max-w-xl top-[40%]"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden.Root>
        <Command className="rounded-lg" shouldFilter={false}>
          <CommandInput
            placeholder="Search workspaces, transactions, rules, events..."
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList className="max-h-[360px]">
            {/* Loading state */}
            {isSearching && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {/* No results state */}
            {!isSearching && hasQuery && !hasResults && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {/* Default: quick nav when no query */}
            {!hasQuery && !isSearching && (
              <>
                <CommandGroup heading="Quick Navigation">
                  <CommandItem onSelect={() => navigateTo('/')}>
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </CommandItem>
                </CommandGroup>

                {workspaces.length > 0 && (
                  <CommandGroup heading="Workspaces">
                    {workspaces.map((ws) => (
                      <CommandItem
                        key={ws.id}
                        value={ws.name}
                        onSelect={() => navigateTo(`/workspace/${ws.id}/esme`)}
                      >
                        <Building2 className="h-4 w-4" />
                        <span>{ws.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}

            {/* Search results grouped by type */}
            {!isSearching &&
              hasQuery &&
              hasResults &&
              (['workspaces', 'transactions', 'rules', 'events'] as const).map(
                (type) => {
                  const items = results[type]
                  if (items.length === 0) return null
                  const Icon = typeIcons[items[0].type]
                  return (
                    <CommandGroup key={type} heading={typeLabels[items[0].type]}>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.type}-${item.id}`}
                          onSelect={() => navigateTo(item.href)}
                        >
                          <Icon className="h-4 w-4" />
                          <div className="flex flex-1 items-center justify-between min-w-0">
                            <span className="truncate">{item.title}</span>
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                              {item.detail}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                }
              )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
