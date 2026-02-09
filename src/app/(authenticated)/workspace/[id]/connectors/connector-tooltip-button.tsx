'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus } from 'lucide-react'

interface ConnectorTooltipButtonProps {
  comingSoon: boolean
}

export function ConnectorTooltipButton({ comingSoon }: ConnectorTooltipButtonProps) {
  if (!comingSoon) {
    return (
      <Button variant="outline" size="sm" className="shrink-0">
        <Plus className="h-4 w-4 mr-1" />
        Connect
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0" disabled>
          Coming Soon
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This integration is not yet available</p>
      </TooltipContent>
    </Tooltip>
  )
}
