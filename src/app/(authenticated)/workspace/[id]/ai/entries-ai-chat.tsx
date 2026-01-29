'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ArrowUp,
  TrendingUp,
  AlertTriangle,
  GitCompare,
  Tags,
  X,
  History,
  Plus,
  MessageSquare,
  Trash2,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import type { ConnectorType } from '@/components/ui/connector-logo-config'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

interface EntriesAIChatProps {
  workspaceName: string
}

// Connected data source logos to show beneath the input
const connectedSources: ConnectorType[] = [
  'quickbooks',
  'chase',
  'stripe',
  'xero',
  'gusto',
  'square',
  'shopify',
  'bill',
]

// Get started prompt cards
const getStartedPrompts = [
  {
    icon: TrendingUp,
    label: 'Summarize this month\u2019s financials',
  },
  {
    icon: GitCompare,
    label: 'Reconcile unmatched transactions',
  },
  {
    icon: AlertTriangle,
    label: 'Flag unusual transactions',
  },
  {
    icon: Tags,
    label: 'Categorize uncategorized expenses',
  },
]

function formatRelativeDate(date: Date): string {
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

export function EntriesAIChat({ workspaceName }: EntriesAIChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showGetStarted, setShowGetStarted] = useState(true)
  const [showConnectors, setShowConnectors] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null
  const messages = activeConversation?.messages ?? []
  const hasMessages = messages.length > 0

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [input])

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null)
    setShowGetStarted(true)
    setShowConnectors(true)
    setInput('')
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    // Create a new conversation or append to existing
    if (!activeConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: input.trim().slice(0, 60) + (input.trim().length > 60 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date(),
      }
      setConversations((prev) => [newConversation, ...prev])
      setActiveConversationId(newConversation.id)
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, userMessage] }
            : c
        )
      )
    }

    setInput('')
    setIsLoading(true)
    setShowGetStarted(false)

    // Simulate AI response
    const currentConvId = activeConversationId || Date.now().toString()
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". In a production environment, I would analyze your financial data and provide relevant insights. For now, this is a demo response.

Some things I can help you with:
- Analyzing transaction patterns
- Identifying anomalies
- Summarizing financial data
- Answering questions about your books

Feel free to ask me anything about ${workspaceName}'s financials!`,
        timestamp: new Date(),
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConvId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      )
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const loadConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setShowGetStarted(false)
    setShowHistory(false)
  }

  const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    if (activeConversationId === conversationId) {
      startNewConversation()
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat history sidebar */}
      <div
        className={cn(
          'border-r border-border bg-muted/30 flex flex-col transition-all duration-200 overflow-hidden',
          showHistory ? 'w-64' : 'w-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">History</span>
          <button
            onClick={() => setShowHistory(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={startNewConversation}
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-2 pb-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    'w-full text-left rounded-md px-3 py-2 text-sm transition-colors group flex items-start gap-2',
                    conv.id === activeConversationId
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{conv.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeDate(conv.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat toolbar — history toggle */}
        <div className="flex items-center px-4 py-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            History
          </Button>
          {activeConversation && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground ml-auto"
              onClick={startNewConversation}
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-6 h-full flex flex-col">
            {!hasMessages ? (
              /* Empty state — centered greeting + input */
              <div className="flex-1 flex flex-col items-center justify-center pb-8">
                <h1 className="text-xl font-semibold mb-8">
                  How can I help you today?
                </h1>

                {/* Input box */}
                <div className="w-full">
                  <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-primary">
                    <form onSubmit={handleSubmit}>
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask, search, or make anything..."
                        rows={1}
                        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                        disabled={isLoading}
                      />
                      <div className="flex items-center justify-end px-4 pb-3">
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background"
                          disabled={!input.trim() || isLoading}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Connected sources bar */}
                  {showConnectors && (
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs text-muted-foreground">
                        Get better answers from your apps
                      </span>
                      <div className="flex items-center gap-1">
                        {connectedSources.map((source) => (
                          <ConnectorLogo
                            key={source}
                            connector={source}
                            size="sm"
                          />
                        ))}
                        <button
                          onClick={() => setShowConnectors(false)}
                          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Get started cards */}
                {showGetStarted && (
                  <div className="w-full mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">
                        Get started
                      </span>
                      <button
                        onClick={() => setShowGetStarted(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {getStartedPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handlePromptClick(prompt.label)}
                          className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <prompt.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm leading-snug">
                            {prompt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Conversation view — Notion-style */
              <div className="flex-1 py-6 space-y-5">
                {messages.map((message) =>
                  message.role === 'user' ? (
                    /* User message — light bubble, right-aligned */
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    /* Assistant message — flat on canvas, no bubble */
                    <div key={message.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">Entries AI</span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed pl-[22px]">
                        {message.content}
                      </div>
                      <div className="pl-[22px] pt-1">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                      <span className="font-medium">Entries AI</span>
                    </div>
                    <div className="flex gap-1 pl-[22px] py-1">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom input — only when there are messages */}
        {hasMessages && (
          <div className="p-4 bg-background">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-primary">
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about transactions, trends, anomalies..."
                    rows={1}
                    className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-end px-4 pb-3">
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background"
                      disabled={!input.trim() || isLoading}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Entries AI can make mistakes. Always verify important information.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
