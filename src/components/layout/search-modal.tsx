'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home,
  Activity,
  Plug,
  FileText,
  Sparkles,
  GitCompare,
  Tags,
  BookOpen,
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

interface Workspace {
  id: string
  name: string
}

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaces: Workspace[]
}

const workspacePages = [
  { label: 'Event Feed', segment: 'event-feed', icon: Activity },
  { label: 'Data Connectors', segment: 'connectors', icon: Plug },
  { label: 'Docs', segment: 'docs', icon: FileText },
  { label: 'Entries AI', segment: 'ai', icon: Sparkles },
  { label: 'Reconcile', segment: 'reconcile', icon: GitCompare },
  { label: 'Categorize', segment: 'categorize', icon: Tags },
  { label: 'Rules', segment: 'rules', icon: BookOpen },
]

export function SearchModal({ open, onOpenChange, workspaces }: SearchModalProps) {
  const router = useRouter()

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

  function navigateTo(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 sm:max-w-xl top-[40%]"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden.Root>
        <Command className="rounded-lg">
          <CommandInput placeholder="Search pages..." />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="General">
              <CommandItem onSelect={() => navigateTo('/')}>
                <Home className="h-4 w-4" />
                <span>Home</span>
              </CommandItem>
            </CommandGroup>

            {workspaces.map((ws) => (
              <CommandGroup key={ws.id} heading={ws.name}>
                {workspacePages.map((page) => (
                  <CommandItem
                    key={`${ws.id}-${page.segment}`}
                    value={`${ws.name} ${page.label}`}
                    onSelect={() => navigateTo(`/workspace/${ws.id}/${page.segment}`)}
                  >
                    <page.icon className="h-4 w-4" />
                    <span>{page.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
