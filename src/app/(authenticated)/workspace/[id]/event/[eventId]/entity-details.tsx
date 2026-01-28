import { Badge } from '@/components/ui/badge'

interface EntityDetail {
  label: string
  value: string | null
  badge?: {
    variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info'
  }
}

interface EntityDetailsProps {
  details: EntityDetail[]
}

export function EntityDetails({ details }: EntityDetailsProps) {
  if (details.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4">
      {details.map((detail) => (
        <div key={detail.label} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground shrink-0">{detail.label}:</span>
          {detail.value ? (
            detail.badge ? (
              <Badge variant={detail.badge.variant}>{detail.value}</Badge>
            ) : (
              <span className="text-sm font-medium">{detail.value}</span>
            )
          ) : (
            <span className="text-sm text-muted-foreground italic">N/A</span>
          )}
        </div>
      ))}
    </div>
  )
}
