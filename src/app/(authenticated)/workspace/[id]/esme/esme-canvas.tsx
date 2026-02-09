'use client'

import { useRef, useEffect, useState, useTransition, useCallback } from 'react'
import { DndContext, DragOverlay, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, PanelRightClose, PanelRight } from 'lucide-react'
import { toast } from 'sonner'
import { sendEsmeMessage, dropAlertToCanvas } from './actions'
import { CanvasBlock } from './canvas-block'
import { EsmeAlertTray, AlertTrayCard } from './esme-alert-tray'
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
  const [activeAlert, setActiveAlert] = useState<SerializedAlert | null>(null)

  // Compute alertIds already on the canvas for duplicate prevention
  const canvasAlertIds = new Set(
    initialBlocks
      .filter((b): b is CanvasBlockType & { type: 'alert' } => b.type === 'alert')
      .map((b) => b.alert.id)
  )

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

  function handleDragStart(event: DragStartEvent) {
    const alert = event.active.data.current?.alert as SerializedAlert | undefined
    setActiveAlert(alert ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveAlert(null)

    if (!event.over || event.over.id !== 'canvas-drop-zone') return

    const alert = event.active.data.current?.alert as SerializedAlert | undefined
    if (!alert) return

    // Duplicate prevention
    if (canvasAlertIds.has(alert.id)) {
      toast.error('This alert is already on the canvas')
      return
    }

    startTransition(async () => {
      const result = await dropAlertToCanvas(workspaceId, alert.id)
      if (!result.success) {
        toast.error(result.error || 'Failed to add alert to canvas')
      }
    })
  }

  function handleDragCancel() {
    setActiveAlert(null)
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex-1 min-h-0 flex relative">
        {/* Left column — canvas + input */}
        <CanvasDropZone
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          initialBlocks={initialBlocks}
          input={input}
          isPending={isPending}
          messagesEndRef={messagesEndRef}
          textareaRef={textareaRef}
          handleSubmit={handleSubmit}
          handleKeyDown={handleKeyDown}
          handleTextareaChange={handleTextareaChange}
          isDragging={activeAlert !== null}
        />

        {/* Right column — alert tray (fixed height, contents scroll) */}
        <div
          className="border-l border-border flex flex-col transition-all duration-200"
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

      {/* DragOverlay — semi-transparent copy of alert card during drag */}
      <DragOverlay>
        {activeAlert ? (
          <AlertTrayCard
            alert={activeAlert}
            workspaceId={workspaceId}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function CanvasDropZone({
  workspaceId,
  workspaceName,
  initialBlocks,
  input,
  isPending,
  messagesEndRef,
  textareaRef,
  handleSubmit,
  handleKeyDown,
  handleTextareaChange,
  isDragging,
}: {
  workspaceId: string
  workspaceName: string
  initialBlocks: CanvasBlockType[]
  input: string
  isPending: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  handleSubmit: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  isDragging: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  })

  return (
    <div ref={setNodeRef} className="flex-1 min-w-0 flex flex-col">
      {/* Scrollable canvas */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto relative transition-colors duration-150 ${
          isDragging
            ? isOver
              ? 'border-2 border-dashed border-primary/60 bg-primary/5'
              : 'border-2 border-dashed border-primary/20'
            : ''
        }`}
      >
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
          {isDragging && isOver && (
            <div className="flex items-center justify-center py-4 text-sm text-primary/60 font-medium">
              Drop alert here to add to canvas
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fade gradient above input */}
      <div className="pointer-events-none h-8 -mt-8 relative z-10 bg-gradient-to-t from-background to-transparent" />

      {/* Input bar — pinned to bottom */}
      <div className="shrink-0 bg-background px-4 py-4">
        <div className="max-w-2xl mx-auto relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Esme anything..."
            disabled={isPending}
            rows={2}
            className="w-full resize-none rounded-2xl border border-border bg-muted/50 px-5 py-4 pr-16 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isPending}
            className="absolute right-3 bottom-3 h-10 w-10 shrink-0 rounded-full"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
