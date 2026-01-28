'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sparkles,
  Send,
  User,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface EntriesAIChatProps {
  workspaceName: string
}

// Suggested prompts
const suggestedPrompts = [
  {
    icon: TrendingUp,
    title: 'Revenue trends',
    prompt: 'Show me revenue trends for the past 3 months',
  },
  {
    icon: TrendingDown,
    title: 'Largest expenses',
    prompt: 'What were the top 5 largest expenses this month?',
  },
  {
    icon: AlertTriangle,
    title: 'Anomalies',
    prompt: 'Are there any unusual transactions I should review?',
  },
  {
    icon: FileText,
    title: 'Unmatched items',
    prompt: 'Show me all unmatched bank transactions',
  },
  {
    icon: Calculator,
    title: 'Category breakdown',
    prompt: 'Give me a breakdown of expenses by category',
  },
]

// Mock conversation for demo
const mockConversation: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'What were the top 5 largest expenses this month?',
    timestamp: new Date('2024-01-20T10:00:00'),
  },
  {
    id: '2',
    role: 'assistant',
    content: `Here are the top 5 largest expenses for January 2024:

1. **WeWork** - $3,500.00 (Rent)
2. **Amazon Web Services** - $1,234.56 (Cloud Services)
3. **Office Depot** - $450.00 (Office Supplies)
4. **Adobe Inc** - $299.00 (Software)
5. **Staples** - $156.32 (Office Supplies)

**Total: $5,639.88**

Would you like me to provide more details on any of these expenses, or compare them to previous months?`,
    timestamp: new Date('2024-01-20T10:00:05'),
  },
]

export function EntriesAIChat({ workspaceName }: EntriesAIChatProps) {
  const [messages, setMessages] = useState<Message[]>(mockConversation)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${input.trim()}". In a production environment, I would analyze your financial data and provide relevant insights. For now, this is a demo response.

Some things I can help you with:
- Analyzing transaction patterns
- Identifying anomalies
- Summarizing financial data
- Answering questions about your books

Feel free to ask me anything about ${workspaceName}'s financials!`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            // Empty state with suggestions
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Ask Entries AI anything
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                I can help you understand your financial data, find transactions,
                identify patterns, and answer questions about {workspaceName}&apos;s books.
              </p>

              {/* Suggested prompts */}
              <div className="grid gap-3 max-w-lg mx-auto">
                {suggestedPrompts.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm">{suggestion.title}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div
                      className={cn(
                        'text-xs mt-2',
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about transactions, trends, anomalies..."
              className="pr-12 h-12 bg-card"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1 h-10 w-10"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Entries AI can help you understand your financial data. Always verify
            important information.
          </p>
        </form>
      </div>
    </div>
  )
}
