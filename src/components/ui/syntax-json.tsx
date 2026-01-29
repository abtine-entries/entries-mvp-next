'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export function SyntaxJson({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data, null, 2)

  // Tokenize JSON for syntax highlighting
  const highlighted = json.replace(
    /("(?:\\.|[^"\\])*")\s*:/g, // keys
    '<span class="text-zinc-400">$1</span>:'
  ).replace(
    /:\s*("(?:\\.|[^"\\])*")/g, // string values
    ': <span class="text-blue-400">$1</span>'
  ).replace(
    /:\s*(\d+(?:\.\d+)?)/g, // numbers
    ': <span class="text-amber-400">$1</span>'
  ).replace(
    /:\s*(true|false|null)/g, // booleans & null
    ': <span class="text-purple-400">$1</span>'
  )

  return (
    <ScrollArea className="w-full">
      <pre
        className="text-[11px] leading-relaxed font-mono text-zinc-300 whitespace-pre-wrap break-all"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
