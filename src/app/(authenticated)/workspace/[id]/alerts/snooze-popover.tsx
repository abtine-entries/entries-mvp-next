'use client'

import { useState, useTransition } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { snoozeAlert } from './actions'

interface SnoozePopoverProps {
  alertId: string
  workspaceId: string
}

function getLaterToday(): string {
  const date = new Date(Date.now() + 4 * 60 * 60 * 1000)
  return date.toISOString()
}

function getTomorrowMorning(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(9, 0, 0, 0)
  return date.toISOString()
}

function getNextWeek(): string {
  const date = new Date()
  const dayOfWeek = date.getDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  date.setDate(date.getDate() + daysUntilMonday)
  date.setHours(9, 0, 0, 0)
  return date.toISOString()
}

const snoozeOptions = [
  { label: 'Later today', description: '4 hours from now', getDate: getLaterToday },
  { label: 'Tomorrow morning', description: 'Tomorrow at 9:00 AM', getDate: getTomorrowMorning },
  { label: 'Next week', description: 'Monday at 9:00 AM', getDate: getNextWeek },
] as const

export function SnoozePopover({ alertId, workspaceId }: SnoozePopoverProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleSnooze(option: (typeof snoozeOptions)[number]) {
    startTransition(async () => {
      const result = await snoozeAlert(alertId, workspaceId, option.getDate())
      if (result.success) {
        toast.success(`Alert snoozed until ${option.label.toLowerCase()}`)
        setOpen(false)
      } else {
        toast.error(result.error ?? 'Failed to snooze alert')
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          title="Snooze alert"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        <div className="flex flex-col">
          {snoozeOptions.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              className="justify-start h-auto py-2 px-3"
              disabled={isPending}
              onClick={() => handleSnooze(option)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
