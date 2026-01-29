'use client'

import { Sparkles } from 'lucide-react'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import { hasConnectorLogo, type ConnectorType } from '@/components/ui/connector-logo-config'

interface SourceIconProps {
  /** The raw source key, e.g. "chase", "quickbooks", "entries" */
  sourceKey: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders a source logo (ConnectorLogo or Sparkles for Entries AI).
 * Falls back to a generic circle with "?" if the source is unknown.
 */
export function SourceIcon({ sourceKey, size = 'sm', className }: SourceIconProps) {
  if (sourceKey === 'entries') {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
    return <Sparkles className={`${sizeClass} text-primary ${className ?? ''}`} />
  }

  if (hasConnectorLogo(sourceKey)) {
    return <ConnectorLogo connector={sourceKey as ConnectorType} size={size} className={className} />
  }

  const pixels = size === 'sm' ? 'w-4 h-4 text-[8px]' : size === 'md' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
  return (
    <div className={`${pixels} rounded-full bg-muted flex items-center justify-center ${className ?? ''}`}>
      ?
    </div>
  )
}
