'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { connectorConfig, type ConnectorType } from './connector-logo-config'

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 56,
} as const

type Size = keyof typeof sizeMap

interface ConnectorLogoProps {
  connector: ConnectorType
  size?: Size
  className?: string
}

interface InitialsBadgeProps {
  initials: string
  color: string
  size: number
}

function InitialsBadge({ initials, color, size }: InitialsBadgeProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  )
}

export function ConnectorLogo({ connector, size = 'md', className }: ConnectorLogoProps) {
  const [hasError, setHasError] = useState(false)
  const config = connectorConfig[connector]
  const pixels = sizeMap[size]

  if (!config) {
    return (
      <InitialsBadge
        initials="??"
        color="#6B7280"
        size={pixels}
      />
    )
  }

  if (hasError) {
    return (
      <InitialsBadge
        initials={config.initials}
        color={config.color}
        size={pixels}
      />
    )
  }

  const logoUrl = config.staticLogo ?? `https://img.logo.dev/${config.domain}?token=${LOGO_DEV_TOKEN}`

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden bg-white flex items-center justify-center',
        className
      )}
      style={{ width: pixels, height: pixels }}
    >
      <Image
        src={logoUrl}
        alt={`${connector} logo`}
        width={pixels}
        height={pixels}
        className="object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  )
}
