'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { EsmeHome } from '@/components/esme/esme-home'
import { EsmeCanvas } from './esme-canvas'
import { sendEsmeMessage } from './actions'
import type { CanvasBlock, SerializedAlert } from './types'

interface EsmePageShellProps {
  workspaceId: string
  workspaceName: string
  initialBlocks: CanvasBlock[]
  alerts: SerializedAlert[]
}

export function EsmePageShell({
  workspaceId,
  workspaceName,
  initialBlocks,
  alerts,
}: EsmePageShellProps) {
  const [showCanvas, setShowCanvas] = useState(false)
  const [, startTransition] = useTransition()

  function handleSubmit(message: string) {
    startTransition(async () => {
      const result = await sendEsmeMessage(workspaceId, message)
      if (result.success) {
        setShowCanvas(true)
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    })
  }

  if (!showCanvas) {
    return <EsmeHome alerts={alerts} onSubmit={handleSubmit} />
  }

  return (
    <EsmeCanvas
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      initialBlocks={initialBlocks}
      alerts={alerts}
    />
  )
}
