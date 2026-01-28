'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { toggleRuleStatus } from './actions'

interface RuleStatusToggleProps {
  rule: {
    id: string
    isActive: boolean
  }
  workspaceId: string
}

export function RuleStatusToggle({ rule, workspaceId }: RuleStatusToggleProps) {
  const [isActive, setIsActive] = useState(rule.isActive)
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggle() {
    setIsToggling(true)

    const previousState = isActive
    setIsActive(!isActive)

    const result = await toggleRuleStatus(rule.id, workspaceId)

    if (result.success) {
      toast.success(result.isActive ? 'Rule enabled' : 'Rule disabled')
    } else {
      setIsActive(previousState)
      toast.error(result.error || 'Failed to update rule')
    }

    setIsToggling(false)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        aria-label={isActive ? 'Disable rule' : 'Enable rule'}
      />
      <span
        className={`text-xs font-medium ${
          isActive ? 'text-green-600' : 'text-muted-foreground'
        }`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}
