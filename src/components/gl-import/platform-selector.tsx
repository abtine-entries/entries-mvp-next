'use client'

import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { Platform } from './types'

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void
  onSkip?: () => void
}

const platforms: { id: Platform; name: string; connector: 'quickbooks' | 'xero' }[] = [
  { id: 'qbo', name: 'QuickBooks Online', connector: 'quickbooks' },
  { id: 'xero', name: 'Xero', connector: 'xero' },
]

export function PlatformSelector({ onSelect, onSkip }: PlatformSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className="flex flex-col items-center gap-3 rounded-lg border border-border p-5 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ConnectorLogo connector={p.connector} size="lg" />
            <span className="text-sm font-medium">{p.name}</span>
          </button>
        ))}
      </div>
      {onSkip && (
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  )
}
