'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface SerializedEsmeMessage {
  id: string
  role: 'esme' | 'user'
  content: string
  metadata: string | null
  createdAt: string
}

interface EsmeChatProps {
  workspaceName: string
  initialMessages: SerializedEsmeMessage[]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function EsmeChat({ workspaceName, initialMessages }: EsmeChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message on load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          {initialMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-3">
                E
              </div>
              <h2 className="text-lg font-semibold mb-1">No messages yet</h2>
              <p className="text-sm text-muted-foreground">
                Esme hasn&apos;t sent any messages for {workspaceName} yet.
              </p>
            </div>
          ) : (
            initialMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Esme avatar */}
                {message.role === 'esme' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    E
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] space-y-1',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'bg-muted'
                        : 'bg-card border border-border'
                    )}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {formatRelativeTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
