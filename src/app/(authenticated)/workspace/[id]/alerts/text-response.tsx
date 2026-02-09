'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { resolveAlert } from './actions'

interface TextResponseProps {
  alertId: string
  workspaceId: string
}

export function TextResponse({ alertId, workspaceId }: TextResponseProps) {
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!value.trim()) return
    startTransition(async () => {
      const result = await resolveAlert(alertId, workspaceId, value.trim())
      if (result.success) {
        toast.success('Response submitted')
      } else {
        toast.error(result.error ?? 'Failed to submit response')
      }
    })
  }

  return (
    <div className="flex gap-2 mt-3">
      <Input
        placeholder="Type your response..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) handleSubmit()
        }}
      />
      <Button
        size="sm"
        disabled={!value.trim() || isPending}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  )
}
