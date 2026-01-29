'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { resolveAlert } from './actions'

interface SelectResponseProps {
  alertId: string
  workspaceId: string
  responseOptions: string // JSON string array
}

export function SelectResponse({ alertId, workspaceId, responseOptions }: SelectResponseProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  let options: string[] = []
  try {
    options = JSON.parse(responseOptions)
  } catch {
    return null
  }

  if (options.length === 0) return null

  function handleSubmit() {
    if (!selected) return
    startTransition(async () => {
      const result = await resolveAlert(alertId, workspaceId, selected)
      if (result.success) {
        toast.success('Response submitted')
      } else {
        toast.error(result.error ?? 'Failed to submit response')
      }
    })
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setSelected(option)}
            className={
              selected === option
                ? 'ring-2 ring-primary border-primary'
                : ''
            }
          >
            {option}
          </Button>
        ))}
      </div>
      <Button
        size="sm"
        disabled={!selected || isPending}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  )
}
