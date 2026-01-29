'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import { hasConnectorLogo, type ConnectorType } from '@/components/ui/connector-logo-config'

const sizeClasses = {
  xs: 'size-4',
  sm: 'size-6',
  md: 'size-10',
  lg: 'size-14',
} as const

const iconSizeMap = { xs: 10, sm: 16, md: 26, lg: 36 } as const

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
    const iconPx = iconSizeMap[size]
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src="/entries-icon.png" alt="Entries" className="rounded-md" />
        <AvatarFallback className="bg-muted">
          <Image src="/entries-icon.png" alt="Entries" width={iconPx} height={iconPx} className="rounded-md" />
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
