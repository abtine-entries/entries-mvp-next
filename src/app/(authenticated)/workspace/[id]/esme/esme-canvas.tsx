'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { toast } from 'sonner'
import { sendEsmeMessage } from './actions'
import { CanvasBlock } from './canvas-block'
import type { CanvasBlock as CanvasBlockType } from './types'

interface EsmeCanvasProps {
  workspaceId: string
  workspaceName: string
  initialBlocks: CanvasBlockType[]
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
