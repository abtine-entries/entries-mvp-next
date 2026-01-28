'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { toggleRuleStatus } from './actions'

interface RuleRowProps {
  rule: {
    id: string
    ruleText: string
    matchCount: number
    isActive: boolean
    category: {
      name: string
    }
  }
  workspaceId: string
}

export function RuleRow({ rule, workspaceId }: RuleRowProps) {
  const [isActive, setIsActive] = useState(rule.isActive)
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggle() {
    setIsToggling(true)

    // Optimistic update
    const previousState = isActive
    setIsActive(!isActive)

    const result = await toggleRuleStatus(rule.id, workspaceId)

    if (result.success) {
      toast.success(result.isActive ? 'Rule enabled' : 'Rule disabled')
    } else {
      // Revert on error
      setIsActive(previousState)
      toast.error(result.error || 'Failed to update rule')
    }

    setIsToggling(false)
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="line-clamp-2">{rule.ruleText}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {rule.category.name}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{rule.matchCount}</TableCell>
      <TableCell className="text-center">
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
      </TableCell>
    </TableRow>
  )
}
