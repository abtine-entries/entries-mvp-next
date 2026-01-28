'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'
import { addEventNote } from './actions'

interface NoteData {
  id: string
  content: string
  authorType: string
  authorName: string
  createdAt: string
}

interface NotesSectionProps {
  workspaceId: string
  eventId: string
  initialNotes: NoteData[]
}

export function NotesSection({
  workspaceId,
  eventId,
  initialNotes,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<NoteData[]>(initialNotes)
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const content = inputValue.trim()
    if (!content) return

    setInputValue('')

    startTransition(async () => {
      const result = await addEventNote(workspaceId, eventId, content)
      if (result.success && result.note) {
        setNotes((prev) => [
          ...prev,
          {
            id: result.note!.id,
            content: result.note!.content,
            authorType: result.note!.authorType,
            authorName: result.note!.authorName,
            createdAt: result.note!.createdAt,
          },
        ])
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Notes
          {notes.length > 0 && (
            <span className="text-muted-foreground font-normal text-sm">
              ({notes.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}

        {notes.map((note) => (
          <div key={note.id} className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {note.authorType === 'ai' ? 'Entries AI' : note.authorName}
              </span>
              <span>&middot;</span>
              <span>{formatTimestamp(note.createdAt)}</span>
            </div>
            <p className="text-sm">{note.content}</p>
          </div>
        ))}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a note..."
            disabled={isPending}
            className="h-8 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !inputValue.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
