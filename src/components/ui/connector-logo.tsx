'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from './avatar'
import { connectorConfig, type ConnectorType } from './connector-logo-config'

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 40,
  lg: 56,
} as const

const sizeClasses = {
  xs: 'size-4 text-[6px]',
  sm: 'size-6 text-[10px]',
  md: 'size-10 text-base',
  lg: 'size-14 text-[22px]',
} as const

type Size = keyof typeof sizeMap

interface ConnectorLogoProps {
  connector: ConnectorType
  size?: Size
  className?: string
}

export function ConnectorLogo({ connector, size = 'md', className }: ConnectorLogoProps) {
  const config = connectorConfig[connector]
  const pixels = sizeMap[size]
  const initials = config?.initials ?? '??'
  const color = config?.color ?? '#6B7280'
  const Icon = config?.icon

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {Icon ? (
        <AvatarFallback
          className="bg-transparent"
        >
          <Icon size={Math.round(pixels * 0.6)} color="default" />
        </AvatarFallback>
      ) : (
        <AvatarFallback
          className="text-white font-semibold"
          style={{ backgroundColor: color }}
        >
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
