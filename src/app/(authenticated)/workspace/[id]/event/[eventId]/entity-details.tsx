import { Badge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

interface EntityDetail {
  label: string
  value: string | null
  badge?: {
    variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info'
  }
  icon?: ReactNode
}

interface EntityDetailsProps {
  details: EntityDetail[]
}

export function EntityDetails({ details }: EntityDetailsProps) {
  if (details.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4">
      {details.map((detail) => (
        <div key={detail.label} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">{detail.label}:</span>
          {detail.value ? (
            <div className="flex items-center gap-1.5">
              {detail.icon}
              {detail.badge ? (
                <Badge variant={detail.badge.variant}>{detail.value}</Badge>
              ) : (
                <span className="text-sm font-medium">{detail.value}</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">N/A</span>
          )}
        </div>
      ))}
    </div>
  )
}
