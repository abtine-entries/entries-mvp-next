'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, AlertTriangle, MessageCircleQuestion, RefreshCw, TrendingUp, Bell, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { sendEsmeMessage } from './actions'
import { ConfirmResponse } from '../alerts/confirm-response'
import { SelectResponse } from '../alerts/select-response'
import { TextResponse } from '../alerts/text-response'
import type { CanvasBlock, SerializedAlert } from './types'

interface EsmeCanvasProps {
  workspaceId: string
  workspaceName: string
  initialBlocks: CanvasBlock[]
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  anomaly: AlertTriangle,
  ai_question: MessageCircleQuestion,
  system: RefreshCw,
  insight: TrendingUp,
}

const typeLabels: Record<string, string> = {
  anomaly: 'Anomaly',
  ai_question: 'AI Question',
  system: 'System',
  insight: 'Insight',
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

function AlertActionCard({ alert, workspaceId }: { alert: SerializedAlert; workspaceId: string }) {
  const Icon = typeIcons[alert.type] ?? Bell
  const isRequiresAction = alert.priority === 'requires_action'
  const isResolved = alert.status === 'resolved'

  return (
    <div className={cn(
      'mt-2 rounded-xl border p-3 text-sm',
      isResolved ? 'opacity-60' : '',
      isRequiresAction && !isResolved ? 'border-l-4 border-l-warning' : ''
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Badge variant={isRequiresAction ? 'warning' : 'secondary'} className="text-xs">
          {isRequiresAction ? 'Requires Action' : 'FYI'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {typeLabels[alert.type] ?? alert.type}
        </span>
      </div>
      <p className="font-medium mb-1">{alert.title}</p>
      <p className="text-muted-foreground line-clamp-2">{alert.body}</p>

      {isResolved ? (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Resolved{alert.responseValue ? `: ${alert.responseValue}` : ''}</span>
        </div>
      ) : (
        <>
          {alert.responseType === 'confirm' && (
            <ConfirmResponse alertId={alert.id} workspaceId={workspaceId} />
          )}
          {alert.responseType === 'select' && alert.responseOptions && (
            <SelectResponse
              alertId={alert.id}
              workspaceId={workspaceId}
              responseOptions={alert.responseOptions}
            />
          )}
          {alert.responseType === 'text' && (
            <TextResponse alertId={alert.id} workspaceId={workspaceId} />
          )}
        </>
      )}
    </div>
  )
}

export function EsmeCanvas({ workspaceId, workspaceName, initialBlocks }: EsmeCanvasProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  // Auto-scroll to newest message on load and when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [initialBlocks])

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || isPending) return

    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    startTransition(async () => {
      const result = await sendEsmeMessage(workspaceId, trimmed)
      if (!result.success) {
        toast.error(result.error || 'Failed to send message')
        setInput(trimmed) // Restore input on failure
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable block list */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
            {initialBlocks.length === 0 ? (
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
              initialBlocks.map((block) => {
                if (block.type === 'user_message') {
                  return (
                    <div key={block.id} className="flex gap-3 justify-end">
                      <div className="max-w-[80%] space-y-1 items-end">
                        <div className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap bg-muted">
                          {block.content}
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                          {formatRelativeTime(block.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                }

                if (block.type === 'alert') {
                  return (
                    <div key={block.id} className="space-y-1">
                      <div className="text-sm whitespace-pre-wrap">
                        {block.content}
                      </div>
                      <AlertActionCard alert={block.alert} workspaceId={workspaceId} />
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(block.createdAt)}
                      </p>
                    </div>
                  )
                }

                // Default: text block (and future block types will fall through here for now)
                return (
                  <div key={block.id} className="space-y-1">
                    <div className="text-sm whitespace-pre-wrap">
                      {block.content}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(block.createdAt)}
                    </p>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-border bg-background px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Esme anything..."
              disabled={isPending}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || isPending}
              className="h-10 w-10 shrink-0 rounded-xl"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right panel — alert tray placeholder */}
      <div className="w-80 border-l border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Alerts</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Alert tray coming soon</p>
        </div>
      </div>
    </div>
  )
}
