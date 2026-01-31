'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, ArrowUp } from 'lucide-react'
import { toast } from 'sonner'
import { createRule } from './actions'
import { generateRuleTitle, getClarifyingQuestion } from './conversation-engine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  role: 'esme' | 'user'
  content: string
  timestamp: Date
  confirmationCard?: ConfirmationCard
}

interface ConfirmationCard {
  title: string
  prompt: string
}

type Phase =
  | 'greeting'
  | 'awaiting_input'
  | 'processing'
  | 'clarifying'
  | 'confirming'
  | 'creating'
  | 'done'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _msgId = 0
function nextId() {
  return `msg-${++_msgId}-${Date.now()}`
}

function esmeMsg(content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return { id: nextId(), role: 'esme', content, timestamp: new Date(), ...extra }
}

function userMsg(content: string): ChatMessage {
  return { id: nextId(), role: 'user', content, timestamp: new Date() }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        E
      </div>
      <div className="rounded-2xl px-4 py-3 bg-card border border-border">
        <div className="flex gap-1.5 items-center h-4">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onConfirm,
  onEdit,
  phase,
}: {
  message: ChatMessage
  onConfirm?: () => void
  onEdit?: () => void
  phase: Phase
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          E
        </div>
      )}
      <div className={cn('max-w-[85%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
            isUser ? 'bg-muted' : 'bg-card border border-border'
          )}
        >
          {message.content}

          {/* Confirmation card */}
          {message.confirmationCard && (
            <div className="mt-3 rounded-xl border bg-background p-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Rule</span>
                  <span className="font-medium text-right">{message.confirmationCard.title}</span>
                </div>
              </div>
              {phase === 'confirming' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={onConfirm}>
                    Looks good, create it
                  </Button>
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    Let me rephrase
                  </Button>
                </div>
              )}
              {phase === 'creating' && (
                <p className="text-xs text-muted-foreground">Creating rule...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CreateRuleSheetProps {
  workspaceId: string
}

export function CreateRuleSheet({ workspaceId }: CreateRuleSheetProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mountedRef = useRef(true)

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState<Phase>('greeting')
  const [input, setInput] = useState('')

  // Track the pending rule data between phases
  const pendingPromptRef = useRef<string>('')

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Auto-scroll on new messages or phase change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase])

  // Initialize when sheet opens
  useEffect(() => {
    if (!open) return

    setMessages([
      esmeMsg(
        "What would you like me to learn? Describe the rule in your own words \u2014 for example, \"Flag any transaction over $5,000 for my review\" or \"Gusto charges are always Payroll\"."
      ),
    ])
    setPhase('awaiting_input')

    setTimeout(() => textareaRef.current?.focus(), 400)
  }, [open])

  // -------------------------------------------------------------------------
  // Conversation engine
  // -------------------------------------------------------------------------

  const appendEsme = useCallback((content: string, extra?: Partial<ChatMessage>) => {
    setMessages((prev) => [...prev, esmeMsg(content, extra)])
  }, [])

  async function processUserInput(text: string) {
    setMessages((prev) => [...prev, userMsg(text)])
    setPhase('processing')

    // Simulate thinking delay
    await new Promise((r) => setTimeout(r, 800))
    if (!mountedRef.current) return

    // Check if Esme needs to ask a clarifying question
    const clarification = getClarifyingQuestion(text)
    if (clarification) {
      pendingPromptRef.current = text
      appendEsme(clarification)
      setPhase('clarifying')
      setTimeout(() => textareaRef.current?.focus(), 100)
      return
    }

    // Good enough — show confirmation
    showConfirmation(text)
  }

  async function processClarificationResponse(text: string) {
    setMessages((prev) => [...prev, userMsg(text)])
    setPhase('processing')

    await new Promise((r) => setTimeout(r, 600))
    if (!mountedRef.current) return

    // Combine original prompt with the clarification into the full instruction
    const fullPrompt = `${pendingPromptRef.current}. ${text}`
    showConfirmation(fullPrompt)
  }

  function showConfirmation(prompt: string) {
    const ruleTitle = generateRuleTitle(prompt)
    pendingPromptRef.current = prompt

    appendEsme("Got it. Here's the rule I'll create:", {
      confirmationCard: {
        title: ruleTitle,
        prompt,
      },
    })
    setPhase('confirming')
  }

  async function handleConfirm() {
    const prompt = pendingPromptRef.current
    if (!prompt) return

    const ruleTitle = generateRuleTitle(prompt)
    setPhase('creating')

    const parsedCondition = JSON.stringify({ prompt })
    const result = await createRule(workspaceId, ruleTitle, parsedCondition)

    if (!mountedRef.current) return

    if (result.success) {
      appendEsme("Done \u2014 I've added this to my playbook. I'll start applying it right away.")
      setPhase('done')
      toast.success('Rule created')
      router.refresh()

      setTimeout(() => {
        if (mountedRef.current) handleOpenChange(false)
      }, 1500)
    } else {
      appendEsme(`Something went wrong: ${result.error || 'Unknown error'}. Want to try again?`)
      setPhase('awaiting_input')
    }
  }

  function handleEdit() {
    appendEsme("No problem \u2014 go ahead and rephrase it.")
    pendingPromptRef.current = ''
    setPhase('awaiting_input')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // -------------------------------------------------------------------------
  // Input handling
  // -------------------------------------------------------------------------

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || inputDisabled) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    if (phase === 'clarifying') {
      processClarificationResponse(trimmed)
    } else {
      processUserInput(trimmed)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setMessages([])
      setPhase('greeting')
      setInput('')
      pendingPromptRef.current = ''
    }
  }

  const inputDisabled = phase === 'processing' || phase === 'creating' || phase === 'done'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton
        className="sm:max-w-xl w-full flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
              E
            </div>
            Teach Esme a new rule
          </SheetTitle>
          <SheetDescription className="text-xs">
            Describe what you want Esme to do in plain English
          </SheetDescription>
        </SheetHeader>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              phase={phase}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
            />
          ))}
          {phase === 'processing' && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t bg-background px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={inputDisabled ? '' : 'Describe your rule...'}
              disabled={inputDisabled}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || inputDisabled}
              className="h-10 w-10 shrink-0 rounded-xl"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
