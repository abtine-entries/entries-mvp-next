/**
 * Generate a concise AI-style title from the user's natural language instruction.
 * This becomes the `ruleText` stored in the database (the display title in the rules table).
 */
export function generateRuleTitle(userText: string): string {
  const cleaned = userText.trim()

  // Try to extract a concise summary from common patterns
  const patterns: Array<{ re: RegExp; build: (m: RegExpMatchArray) => string }> = [
    // "Anything from X should be Y" → "X → Y"
    {
      re: /(?:anything|everything|transactions?|charges?|payments?)\s+(?:from|by)\s+(.+?)\s+(?:should|are|is|go)\s+(?:be\s+)?(?:categorize[d]?\s+(?:as|under)\s+)?(.+?)\.?$/i,
      build: (m) => `${m[1].trim()} → ${m[2].trim()}`,
    },
    // "Flag X when Y" → "Flag X when Y"
    {
      re: /^(flag|alert|notify|warn).{5,}$/i,
      build: () => cleaned.length <= 50 ? cleaned : cleaned.slice(0, 47) + '...',
    },
    // "If X, then Y" → short form
    {
      re: /^if\s+(.+?)(?:,\s*then\s*|\s*,\s*)(.+?)\.?$/i,
      build: (m) => {
        const condition = m[1].trim()
        const action = m[2].trim()
        const short = `${action} — ${condition}`
        return short.length <= 55 ? short : short.slice(0, 52) + '...'
      },
    },
  ]

  for (const { re, build } of patterns) {
    const match = cleaned.match(re)
    if (match) return build(match)
  }

  // Fallback: truncate to a reasonable title length
  const maxLen = 55
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen).replace(/\s+\S*$/, '') + '...'
}

/**
 * Generate a scripted Esme clarification question based on the user's prompt.
 * Returns null if no clarification is needed (Esme can go straight to confirmation).
 */
export function getClarifyingQuestion(userText: string): string | null {
  const lower = userText.toLowerCase()

  // Check if the user mentioned a threshold without being specific
  if (/over|above|more than|exceed/i.test(lower) && !/\$?\d/.test(lower)) {
    return "What amount threshold did you have in mind?"
  }

  // Check if time-based but vague
  if (/every|weekly|daily|monday|morning/i.test(lower) && !/\d/.test(lower) && lower.length < 40) {
    return "Should I do this every week, or on a different schedule?"
  }

  // Very short or vague input
  if (lower.split(/\s+/).length < 4) {
    return "Can you tell me a bit more about what you'd like me to do? For example, when should this rule trigger and what action should I take?"
  }

  return null
}
