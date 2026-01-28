'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronsUpDown, Check, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getWorkspaceCategories,
  getMatchingTransactionsCount,
  createRule,
  type CategoryInfo,
} from './actions'

interface CreateRuleModalProps {
  workspaceId: string
}

export function CreateRuleModal({ workspaceId }: CreateRuleModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [ruleText, setRuleText] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [matchingCount, setMatchingCount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCount, setIsLoadingCount] = useState(false)
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)

  // Load categories when modal opens
  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  // Debounced matching count update
  useEffect(() => {
    if (!ruleText.trim()) {
      setMatchingCount(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingCount(true)
      const result = await getMatchingTransactionsCount(workspaceId, ruleText)
      if (result.count !== undefined) {
        setMatchingCount(result.count)
      }
      setIsLoadingCount(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [ruleText, workspaceId])

  const loadCategories = async () => {
    const result = await getWorkspaceCategories(workspaceId)
    if (result.categories) {
      setCategories(result.categories)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedRuleText = ruleText.trim()
    if (!trimmedRuleText) {
      setError('Rule text is required')
      return
    }

    if (!selectedCategoryId) {
      setError('Please select a category')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createRule(workspaceId, trimmedRuleText, selectedCategoryId)
      if (result.success) {
        toast.success('Rule created successfully')
        handleOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to create rule')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form state when closing
      setRuleText('')
      setSelectedCategoryId(null)
      setMatchingCount(null)
      setError('')
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Categorization Rule</DialogTitle>
            <DialogDescription>
              Create a rule to automatically categorize transactions based on
              patterns in their description.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Rule Text Input */}
            <div className="space-y-2">
              <Label htmlFor="ruleText">Rule</Label>
              <Input
                id="ruleText"
                value={ruleText}
                onChange={(e) => setRuleText(e.target.value)}
                placeholder='e.g., "Transactions from Gusto are Payroll"'
                autoFocus
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Examples: &quot;Transactions from Gusto are Payroll&quot;, &quot;AWS transactions
                are Cloud Services&quot;
              </p>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryPopoverOpen}
                    className="w-full justify-between"
                    disabled={isSubmitting}
                  >
                    {selectedCategory ? (
                      <span className="flex items-center gap-2">
                        {selectedCategory.name}
                        <Badge variant="outline" className="font-normal text-xs">
                          {selectedCategory.type}
                        </Badge>
                      </span>
                    ) : (
                      'Select category...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={`${category.name} ${category.type}`}
                            onSelect={() => {
                              setSelectedCategoryId(category.id)
                              setCategoryPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedCategoryId === category.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <span className="flex items-center gap-2">
                              {category.name}
                              <Badge variant="outline" className="font-normal text-xs">
                                {category.type}
                              </Badge>
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Matching Transactions Preview */}
            {ruleText.trim() && (
              <div className="rounded-md border p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoadingCount ? (
                    'Counting matching transactions...'
                  ) : matchingCount !== null ? (
                    <>
                      This rule would match{' '}
                      <span className="font-semibold text-foreground">
                        {matchingCount}
                      </span>{' '}
                      {matchingCount === 1 ? 'transaction' : 'transactions'}
                    </>
                  ) : (
                    'Enter a valid rule to see matching transactions'
                  )}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
