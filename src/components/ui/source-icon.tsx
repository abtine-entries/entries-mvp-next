'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import { hasConnectorLogo, type ConnectorType } from '@/components/ui/connector-logo-config'

const sizeClasses = {
  xs: 'size-4',
  sm: 'size-6',
  md: 'size-10',
  lg: 'size-14',
} as const

const sizeMap = { xs: 16, sm: 24, md: 40, lg: 56 } as const

interface SourceIconProps {
  /** The raw source key, e.g. "chase", "quickbooks", "entries" */
  sourceKey: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders a source logo (ConnectorLogo or Entries logo).
 * Falls back to a generic circle with "?" if the source is unknown.
 */
export function SourceIcon({ sourceKey, size = 'sm', className }: SourceIconProps) {
  if (sourceKey === 'entries') {
    const iconPx = Math.round(sizeMap[size] * 0.6)
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback className="bg-transparent">
          <Image src="/entries-icon.png" alt="Entries" width={iconPx} height={iconPx} className="rounded-[3px]" unoptimized />
        </AvatarFallback>
      </Avatar>
    )
  }

  if (hasConnectorLogo(sourceKey)) {
    return <ConnectorLogo connector={sourceKey as ConnectorType} size={size} className={className} />
  }

  const fallbackTextSize = size === 'xs' ? 'text-[7px]' : size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-xs'
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={fallbackTextSize}>
        ?
      </AvatarFallback>
    </Avatar>
  )
}
