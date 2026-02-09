'use client'

import { useState } from 'react'
import {
  AtSign,
  ArrowUp,
  Paperclip,
  Sparkles,
} from 'lucide-react'
import { EsmeAvatar } from '@/components/esme-avatar'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import type { SerializedAlert } from '@/app/(authenticated)/workspace/[id]/esme/types'

interface EsmeHomeProps {
  alerts: SerializedAlert[]
  onSubmit?: (message: string) => void
}

export function EsmeHome({ alerts, onSubmit }: EsmeHomeProps) {
  const [inputValue, setInputValue] = useState('')
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id))

  function handleSubmit() {
    if (!inputValue.trim()) return
    onSubmit?.(inputValue.trim())
    setInputValue('')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
      {/* Avatar + Greeting */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <EsmeAvatar className="h-16 w-16" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          How can I help you today?
        </h1>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-[640px] mb-12">
        <div className="rounded-xl border border-border bg-background shadow-sm">
          {/* Context row */}
          <div className="px-4 pt-3">
            <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border px-2.5 py-1">
              <AtSign className="h-3 w-3" />
              Add context
            </button>
          </div>

          {/* Text input */}
          <div className="px-4 py-2">
            <input
              type="text"
              placeholder="Ask, search, or make anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-1">
              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md">
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-md hover:bg-muted">
                <Sparkles className="h-3.5 w-3.5" />
                Auto
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stacked alert cards */}
      {visibleAlerts.length > 0 && (
        <div className="w-full max-w-[640px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {visibleAlerts.length} alert{visibleAlerts.length !== 1 ? 's' : ''}
            </p>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setDismissedIds(new Set(alerts.map((a) => a.id)))}
            >
              Dismiss all
            </button>
          </div>

          {/* Stacked deck */}
          <div
            className="relative"
            style={{ height: `${72 + Math.min(visibleAlerts.length - 1, 3) * 6}px` }}
          >
            {visibleAlerts.map((alert, i) => {
              const stackIndex = Math.min(i, 3)
              const offset = stackIndex * 6
              const scale = 1 - stackIndex * 0.02
              const zIndex = visibleAlerts.length - i

              return (
                <div
                  key={alert.id}
                  className={`absolute inset-x-0 transition-all duration-300 ease-out ${
                    i > 0 ? 'pointer-events-none' : ''
                  }`}
                  style={{
                    top: `${offset}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    zIndex,
                    opacity: i > 3 ? 0 : 1,
                  }}
                >
                  <Alert className="cursor-pointer">
                    <EsmeAvatar />
                    <AlertTitle className="line-clamp-1">{alert.title}</AlertTitle>
                    {alert.body && (
                      <AlertDescription className="line-clamp-1">
                        {alert.body}
                      </AlertDescription>
                    )}
                  </Alert>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
