'use client'

import { useRef, useEffect, useState, useTransition, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, PanelRightClose, PanelRight } from 'lucide-react'
import { toast } from 'sonner'
import { sendEsmeMessage } from './actions'
import { CanvasBlock } from './canvas-block'
import { EsmeAlertTray } from './esme-alert-tray'
import type { CanvasBlock as CanvasBlockType, SerializedAlert } from './types'

const STORAGE_KEY = 'esme-alert-tray-collapsed'

interface EsmeCanvasProps {
  workspaceId: string
  workspaceName: string
  initialBlocks: CanvasBlockType[]
  alerts: SerializedAlert[]
}

export function EsmeCanvas({ workspaceId, workspaceName, initialBlocks, alerts }: EsmeCanvasProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [trayCollapsed, setTrayCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Read localStorage + responsive default on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setTrayCollapsed(stored === 'true')
    } else if (window.matchMedia('(max-width: 1023px)').matches) {
      setTrayCollapsed(true)
    }
    setHydrated(true)
  }, [])

  const toggleTray = useCallback(() => {
    setTrayCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

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
    <div className="flex-1 flex overflow-hidden relative">
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
              initialBlocks.map((block) => (
                <CanvasBlock key={block.id} block={block} workspaceId={workspaceId} />
              ))
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

      {/* Right panel — alert tray */}
      <div
        className="border-l border-border flex flex-col overflow-hidden transition-all duration-200"
        style={{ width: hydrated && trayCollapsed ? 0 : 320, borderLeftWidth: hydrated && trayCollapsed ? 0 : undefined }}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between min-w-[320px]">
          <h3 className="text-sm font-semibold">Alerts</h3>
          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {alerts.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleTray}
              title="Collapse alert tray"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <EsmeAlertTray alerts={alerts} workspaceId={workspaceId} />
      </div>

      {/* Floating expand button when tray is collapsed */}
      {hydrated && trayCollapsed && (
        <button
          onClick={toggleTray}
          className="absolute right-0 top-3 flex items-center gap-1.5 rounded-l-lg border border-r-0 border-border bg-background px-2 py-2 shadow-sm transition-opacity hover:bg-muted"
          title="Expand alert tray"
        >
          <PanelRight className="h-4 w-4" />
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {alerts.length}
            </Badge>
          )}
        </button>
      )}
    </div>
  )
}
