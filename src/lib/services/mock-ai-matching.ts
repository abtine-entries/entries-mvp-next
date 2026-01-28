/**
 * Mock AI Matching Service
 * Provides deterministic match suggestions between bank and QBO transactions
 * Uses pattern-based logic to simulate AI matching behavior
 */

import type { BankTransaction } from './mock-bank'
import type { QboTransaction } from './mock-qbo'

export type MatchType = 'exact' | 'timing' | 'fee_adjusted' | 'partial'

export interface MatchSuggestion {
  bankTxnId: string
  qboTxnId: string
  confidence: number
  matchType: MatchType
  reasoning: string
}

/**
 * Suggest matches between bank and QBO transactions
 * Uses deterministic matching logic based on amount, date, and description patterns
 */
export function suggestMatches(
  bankTxns: BankTransaction[],
  qboTxns: QboTransaction[]
): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = []
  const matchedBankIds = new Set<string>()
  const matchedQboIds = new Set<string>()

  // First pass: Find exact matches (same amount, same or similar date)
  for (const bankTxn of bankTxns) {
    if (matchedBankIds.has(bankTxn.id)) continue

    for (const qboTxn of qboTxns) {
      if (matchedQboIds.has(qboTxn.id)) continue

      const matchResult = evaluateMatch(bankTxn, qboTxn)

      if (matchResult.confidence >= 0.5) {
        suggestions.push({
          bankTxnId: bankTxn.id,
          qboTxnId: qboTxn.id,
          confidence: matchResult.confidence,
          matchType: matchResult.matchType,
          reasoning: matchResult.reasoning,
        })
        matchedBankIds.add(bankTxn.id)
        matchedQboIds.add(qboTxn.id)
        break // Move to next bank transaction after finding a match
      }
    }
  }

  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Evaluate the match quality between a bank and QBO transaction
 */
function evaluateMatch(
  bankTxn: BankTransaction,
  qboTxn: QboTransaction
): { confidence: number; matchType: MatchType; reasoning: string } {
  const amountDiff = Math.abs(bankTxn.amount - qboTxn.amount)
  const amountAbsDiff = Math.abs(amountDiff)
  const baseAmount = Math.abs(qboTxn.amount)
  const percentDiff = baseAmount > 0 ? (amountAbsDiff / baseAmount) * 100 : 100

  const daysDiff = Math.abs(
    Math.floor((bankTxn.date.getTime() - qboTxn.date.getTime()) / (1000 * 60 * 60 * 24))
  )

  const descriptionMatch = checkDescriptionMatch(bankTxn.description, qboTxn.vendorName)

  // Exact match: Same amount (within $0.01), same date, description matches
  if (amountAbsDiff <= 0.01 && daysDiff === 0 && descriptionMatch) {
    return {
      confidence: 0.99,
      matchType: 'exact',
      reasoning: 'Exact amount match on same date with matching vendor name',
    }
  }

  // Exact amount but different date (timing difference)
  if (amountAbsDiff <= 0.01 && daysDiff <= 5 && descriptionMatch) {
    const confidence = daysDiff <= 2 ? 0.95 : daysDiff <= 3 ? 0.90 : 0.85
    return {
      confidence,
      matchType: 'timing',
      reasoning: `Exact amount match with ${daysDiff} day${daysDiff !== 1 ? 's' : ''} timing difference`,
    }
  }

  // Exact amount but no description match (possible match)
  if (amountAbsDiff <= 0.01 && daysDiff <= 3) {
    return {
      confidence: 0.75,
      matchType: 'timing',
      reasoning: 'Exact amount match but vendor name differs - verify manually',
    }
  }

  // Fee-adjusted match: Amount differs by typical fee percentage (1-5%)
  if (percentDiff > 0 && percentDiff <= 5 && daysDiff <= 5 && descriptionMatch) {
    const feeAmount = amountAbsDiff.toFixed(2)
    if (percentDiff <= 3) {
      return {
        confidence: 0.88,
        matchType: 'fee_adjusted',
        reasoning: `Amount differs by $${feeAmount} (${percentDiff.toFixed(1)}%) - likely payment processing fee`,
      }
    }
    return {
      confidence: 0.78,
      matchType: 'fee_adjusted',
      reasoning: `Amount differs by $${feeAmount} (${percentDiff.toFixed(1)}%) - possible fee adjustment`,
    }
  }

  // Fixed fee adjustment: Amount differs by $10-50 (common bank fees)
  if (amountAbsDiff >= 10 && amountAbsDiff <= 50 && daysDiff <= 5 && descriptionMatch) {
    return {
      confidence: 0.82,
      matchType: 'fee_adjusted',
      reasoning: `Amount differs by $${amountAbsDiff.toFixed(2)} - possible bank fee`,
    }
  }

  // Partial match: Same vendor, close date, but significant amount difference
  if (descriptionMatch && daysDiff <= 7 && percentDiff <= 20) {
    return {
      confidence: 0.60,
      matchType: 'partial',
      reasoning: `Matching vendor with ${percentDiff.toFixed(1)}% amount difference - review carefully`,
    }
  }

  // Weak match: Only date and general amount range match
  if (daysDiff <= 3 && percentDiff <= 10) {
    return {
      confidence: 0.55,
      matchType: 'partial',
      reasoning: 'Similar amount and date but vendor name does not match - low confidence',
    }
  }

  // No match
  return {
    confidence: 0,
    matchType: 'partial',
    reasoning: 'No match found',
  }
}

/**
 * Check if bank description contains vendor name or related keywords
 * Bank descriptions are often abbreviated or formatted differently
 */
function checkDescriptionMatch(bankDescription: string, vendorName: string): boolean {
  const bankLower = bankDescription.toLowerCase()
  const vendorLower = vendorName.toLowerCase()

  // Direct vendor name match
  if (bankLower.includes(vendorLower)) {
    return true
  }

  // Check for partial matches (first word of vendor name)
  const vendorFirstWord = vendorLower.split(/\s+/)[0]
  if (vendorFirstWord.length >= 4 && bankLower.includes(vendorFirstWord)) {
    return true
  }

  // Common vendor name abbreviations/variations
  const vendorMappings: Record<string, string[]> = {
    'amazon web services': ['aws', 'amazon'],
    'google cloud platform': ['google', 'gcp'],
    'slack technologies': ['slack'],
    'zoom video communications': ['zoom'],
    'adobe systems': ['adobe'],
    'microsoft': ['msft', 'microsoft'],
    'salesforce': ['sfdc', 'salesforce'],
    'hubspot': ['hubspot'],
    'mailchimp': ['mailchimp', 'intuit'],
    'office depot': ['office depot', 'od'],
    'staples': ['staples'],
    'fedex': ['fedex', 'fed ex'],
    'ups': ['ups', 'united parcel'],
    'comcast business': ['comcast'],
    'pg&e': ['pge', 'pg&e', 'pacific gas'],
    'wework': ['wework'],
    'regus': ['regus'],
    'delta airlines': ['delta'],
    'united airlines': ['united'],
    'marriott hotels': ['marriott'],
    'uber': ['uber'],
    'lyft': ['lyft'],
    'blue cross blue shield': ['bcbs', 'blue cross', 'anthem'],
    'hartford insurance': ['hartford'],
    'gusto': ['gusto'],
    'stripe': ['stripe'],
  }

  const aliases = vendorMappings[vendorLower]
  if (aliases) {
    return aliases.some(alias => bankLower.includes(alias))
  }

  // Check for any significant word overlap (at least 4 characters)
  const vendorWords = vendorLower.split(/\s+/).filter(w => w.length >= 4)
  const bankWords = bankLower.split(/\s+/).filter(w => w.length >= 4)

  for (const vendorWord of vendorWords) {
    for (const bankWord of bankWords) {
      if (vendorWord === bankWord ||
          vendorWord.includes(bankWord) ||
          bankWord.includes(vendorWord)) {
        return true
      }
    }
  }

  return false
}
