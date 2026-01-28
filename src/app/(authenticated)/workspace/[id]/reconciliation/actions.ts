'use server'

import { Transaction } from '@/generated/prisma/client'
import type { MatchType } from '@/lib/services/mock-ai-matching'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

export interface MatchSuggestion {
  qboTxnId: string
  confidence: number
  matchType: MatchType
  reasoning: string
}

export interface ApproveMatchResult {
  success: boolean
  error?: string
  matchId?: string
}

export interface CreateManualMatchResult {
  success: boolean
  error?: string
  matchId?: string
}

export interface RejectMatchResult {
  success: boolean
  error?: string
}

export interface BulkApproveResult {
  success: boolean
  error?: string
  approvedCount: number
  failedCount: number
}

export interface HighConfidenceMatch {
  bankTxnId: string
  qboTxnId: string
  confidence: number
  matchType: MatchType
  reasoning: string
}

/**
 * Approve a suggested match between a bank and QBO transaction
 * Creates a Match record and updates both transactions to 'matched' status
 */
export async function approveMatch(
  workspaceId: string,
  bankTransactionId: string,
  qboTransactionId: string,
  matchType: MatchType,
  confidence: number,
  reasoning: string
): Promise<ApproveMatchResult> {
  try {
    // Verify both transactions exist and belong to this workspace
    const [bankTxn, qboTxn] = await Promise.all([
      prisma.transaction.findFirst({
        where: { id: bankTransactionId, workspaceId },
      }),
      prisma.transaction.findFirst({
        where: { id: qboTransactionId, workspaceId },
      }),
    ])

    if (!bankTxn || !qboTxn) {
      return { success: false, error: 'One or both transactions not found' }
    }

    if (bankTxn.status === 'matched' || qboTxn.status === 'matched') {
      return { success: false, error: 'One or both transactions already matched' }
    }

    // Create match and update transactions in a transaction
    const match = await prisma.$transaction(async (tx) => {
      // Create the match record
      const newMatch = await tx.match.create({
        data: {
          workspaceId,
          bankTransactionId,
          qboTransactionId,
          matchType,
          confidence,
          reasoning,
        },
      })

      // Update both transactions to matched status
      await tx.transaction.update({
        where: { id: bankTransactionId },
        data: { status: 'matched' },
      })

      await tx.transaction.update({
        where: { id: qboTransactionId },
        data: { status: 'matched' },
      })

      return newMatch
    })

    // Revalidate the reconciliation page to show updated state
    revalidatePath(`/workspace/${workspaceId}/reconciliation`)

    return { success: true, matchId: match.id }
  } catch (error) {
    console.error('Failed to approve match:', error)
    return { success: false, error: 'Failed to approve match. Please try again.' }
  }
}

/**
 * Create a manual match between a bank and QBO transaction
 * Creates a Match record with type 'manual' and updates both transactions to 'matched' status
 */
export async function createManualMatch(
  workspaceId: string,
  bankTransactionId: string,
  qboTransactionId: string
): Promise<CreateManualMatchResult> {
  try {
    // Verify both transactions exist and belong to this workspace
    const [bankTxn, qboTxn] = await Promise.all([
      prisma.transaction.findFirst({
        where: { id: bankTransactionId, workspaceId },
      }),
      prisma.transaction.findFirst({
        where: { id: qboTransactionId, workspaceId },
      }),
    ])

    if (!bankTxn || !qboTxn) {
      return { success: false, error: 'One or both transactions not found' }
    }

    if (bankTxn.source !== 'bank') {
      return { success: false, error: 'First transaction must be a bank transaction' }
    }

    if (qboTxn.source !== 'qbo') {
      return { success: false, error: 'Second transaction must be a QBO transaction' }
    }

    if (bankTxn.status === 'matched' || qboTxn.status === 'matched') {
      return { success: false, error: 'One or both transactions already matched' }
    }

    // Create match and update transactions in a transaction
    const match = await prisma.$transaction(async (tx) => {
      // Create the match record with manual type
      const newMatch = await tx.match.create({
        data: {
          workspaceId,
          bankTransactionId,
          qboTransactionId,
          matchType: 'manual',
          confidence: 1.0, // Manual matches have full confidence
          reasoning: 'Manually matched by user',
        },
      })

      // Update both transactions to matched status
      await tx.transaction.update({
        where: { id: bankTransactionId },
        data: { status: 'matched' },
      })

      await tx.transaction.update({
        where: { id: qboTransactionId },
        data: { status: 'matched' },
      })

      return newMatch
    })

    // Revalidate the reconciliation page to show updated state
    revalidatePath(`/workspace/${workspaceId}/reconciliation`)

    return { success: true, matchId: match.id }
  } catch (error) {
    console.error('Failed to create manual match:', error)
    return { success: false, error: 'Failed to create manual match. Please try again.' }
  }
}

/**
 * Reject a match suggestion between a bank and QBO transaction
 * Creates an AuditLog entry for the rejection
 */
export async function rejectMatchSuggestion(
  workspaceId: string,
  bankTransactionId: string,
  qboTransactionId: string,
  matchType: MatchType,
  confidence: number,
  reasoning: string
): Promise<RejectMatchResult> {
  try {
    // Get the current user session
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify both transactions exist and belong to this workspace
    const [bankTxn, qboTxn] = await Promise.all([
      prisma.transaction.findFirst({
        where: { id: bankTransactionId, workspaceId },
      }),
      prisma.transaction.findFirst({
        where: { id: qboTransactionId, workspaceId },
      }),
    ])

    if (!bankTxn || !qboTxn) {
      return { success: false, error: 'One or both transactions not found' }
    }

    // Create an audit log entry for the rejection
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: 'match_suggestion_rejected',
        entityType: 'MatchSuggestion',
        entityId: `${bankTransactionId}:${qboTransactionId}`,
        oldValue: JSON.stringify({
          bankTransactionId,
          qboTransactionId,
          matchType,
          confidence,
          reasoning,
          bankDescription: bankTxn.description,
          qboDescription: qboTxn.description,
          bankAmount: Number(bankTxn.amount),
          qboAmount: Number(qboTxn.amount),
        }),
        newValue: null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to reject match suggestion:', error)
    return { success: false, error: 'Failed to reject match suggestion. Please try again.' }
  }
}

/**
 * Get AI-suggested matches for a selected bank transaction
 * Uses deterministic matching logic based on amount, date, and description
 */
export async function getMatchSuggestionsForTransaction(
  bankTransaction: Transaction,
  qboTransactions: Transaction[]
): Promise<MatchSuggestion[]> {
  const suggestions: MatchSuggestion[] = []
  const bankAmount = Number(bankTransaction.amount)
  const bankDate = new Date(bankTransaction.date)

  for (const qboTxn of qboTransactions) {
    // Skip already matched transactions
    if (qboTxn.status === 'matched') continue

    const qboAmount = Number(qboTxn.amount)
    const qboDate = new Date(qboTxn.date)

    const matchResult = evaluateMatch(
      bankAmount,
      bankDate,
      bankTransaction.description,
      qboAmount,
      qboDate,
      qboTxn.description
    )

    if (matchResult.confidence >= 0.5) {
      suggestions.push({
        qboTxnId: qboTxn.id,
        confidence: matchResult.confidence,
        matchType: matchResult.matchType,
        reasoning: matchResult.reasoning,
      })
    }
  }

  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Evaluate the match quality between a bank and QBO transaction
 */
function evaluateMatch(
  bankAmount: number,
  bankDate: Date,
  bankDescription: string,
  qboAmount: number,
  qboDate: Date,
  qboDescription: string
): { confidence: number; matchType: MatchType; reasoning: string } {
  const amountDiff = Math.abs(bankAmount - qboAmount)
  const baseAmount = Math.abs(qboAmount)
  const percentDiff = baseAmount > 0 ? (amountDiff / baseAmount) * 100 : 100

  const daysDiff = Math.abs(
    Math.floor((bankDate.getTime() - qboDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const descriptionMatch = checkDescriptionMatch(bankDescription, qboDescription)

  // Exact match: Same amount (within $0.01), same date, description matches
  if (amountDiff <= 0.01 && daysDiff === 0 && descriptionMatch) {
    return {
      confidence: 0.99,
      matchType: 'exact',
      reasoning: 'Exact amount match on same date with matching vendor name',
    }
  }

  // Exact amount but different date (timing difference)
  if (amountDiff <= 0.01 && daysDiff <= 5 && descriptionMatch) {
    const confidence = daysDiff <= 2 ? 0.95 : daysDiff <= 3 ? 0.90 : 0.85
    return {
      confidence,
      matchType: 'timing',
      reasoning: `Exact amount match with ${daysDiff} day${daysDiff !== 1 ? 's' : ''} timing difference`,
    }
  }

  // Exact amount but no description match (possible match)
  if (amountDiff <= 0.01 && daysDiff <= 3) {
    return {
      confidence: 0.75,
      matchType: 'timing',
      reasoning: 'Exact amount match but vendor name differs - verify manually',
    }
  }

  // Fee-adjusted match: Amount differs by typical fee percentage (1-5%)
  if (percentDiff > 0 && percentDiff <= 5 && daysDiff <= 5 && descriptionMatch) {
    const feeAmount = amountDiff.toFixed(2)
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
  if (amountDiff >= 10 && amountDiff <= 50 && daysDiff <= 5 && descriptionMatch) {
    return {
      confidence: 0.82,
      matchType: 'fee_adjusted',
      reasoning: `Amount differs by $${amountDiff.toFixed(2)} - possible bank fee`,
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
function checkDescriptionMatch(bankDescription: string, qboDescription: string): boolean {
  const bankLower = bankDescription.toLowerCase()
  const qboLower = qboDescription.toLowerCase()

  // Direct match check
  if (bankLower.includes(qboLower) || qboLower.includes(bankLower)) {
    return true
  }

  // Extract vendor name from QBO description (often in format "Vendor Name - memo")
  const vendorName = qboLower.split(' - ')[0].trim()

  // Check for vendor name in bank description
  if (vendorName.length >= 4 && bankLower.includes(vendorName)) {
    return true
  }

  // Check for partial matches (first word of vendor name)
  const vendorFirstWord = vendorName.split(/\s+/)[0]
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

  const aliases = vendorMappings[vendorName]
  if (aliases) {
    return aliases.some(alias => bankLower.includes(alias))
  }

  // Check for any significant word overlap (at least 4 characters)
  const vendorWords = vendorName.split(/\s+/).filter(w => w.length >= 4)
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

/**
 * Get all high-confidence match suggestions (confidence > 0.9) for bulk approval
 */
export async function getHighConfidenceMatches(
  bankTransactions: Transaction[],
  qboTransactions: Transaction[]
): Promise<HighConfidenceMatch[]> {
  const matches: HighConfidenceMatch[] = []
  const usedQboIds = new Set<string>()

  // Sort bank transactions for consistent ordering
  const sortedBankTxns = [...bankTransactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const bankTxn of sortedBankTxns) {
    if (bankTxn.status === 'matched') continue

    const bankAmount = Number(bankTxn.amount)
    const bankDate = new Date(bankTxn.date)

    let bestMatch: HighConfidenceMatch | null = null

    for (const qboTxn of qboTransactions) {
      // Skip already matched transactions or already used in this batch
      if (qboTxn.status === 'matched' || usedQboIds.has(qboTxn.id)) continue

      const qboAmount = Number(qboTxn.amount)
      const qboDate = new Date(qboTxn.date)

      const result = evaluateMatchForBulk(
        bankAmount,
        bankDate,
        bankTxn.description,
        qboAmount,
        qboDate,
        qboTxn.description
      )

      // Only include high-confidence matches (> 0.9)
      if (result.confidence > 0.9) {
        if (!bestMatch || result.confidence > bestMatch.confidence) {
          bestMatch = {
            bankTxnId: bankTxn.id,
            qboTxnId: qboTxn.id,
            confidence: result.confidence,
            matchType: result.matchType,
            reasoning: result.reasoning,
          }
        }
      }
    }

    if (bestMatch) {
      matches.push(bestMatch)
      usedQboIds.add(bestMatch.qboTxnId)
    }
  }

  return matches
}

/**
 * Evaluate match for bulk approval (same logic as evaluateMatch but exported)
 */
function evaluateMatchForBulk(
  bankAmount: number,
  bankDate: Date,
  bankDescription: string,
  qboAmount: number,
  qboDate: Date,
  qboDescription: string
): { confidence: number; matchType: MatchType; reasoning: string } {
  const amountDiff = Math.abs(bankAmount - qboAmount)
  const baseAmount = Math.abs(qboAmount)
  const percentDiff = baseAmount > 0 ? (amountDiff / baseAmount) * 100 : 100

  const daysDiff = Math.abs(
    Math.floor((bankDate.getTime() - qboDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const descriptionMatch = checkDescriptionMatch(bankDescription, qboDescription)

  // Exact match: Same amount (within $0.01), same date, description matches
  if (amountDiff <= 0.01 && daysDiff === 0 && descriptionMatch) {
    return {
      confidence: 0.99,
      matchType: 'exact',
      reasoning: 'Exact amount match on same date with matching vendor name',
    }
  }

  // Exact amount but different date (timing difference)
  if (amountDiff <= 0.01 && daysDiff <= 5 && descriptionMatch) {
    const confidence = daysDiff <= 2 ? 0.95 : daysDiff <= 3 ? 0.90 : 0.85
    return {
      confidence,
      matchType: 'timing',
      reasoning: `Exact amount match with ${daysDiff} day${daysDiff !== 1 ? 's' : ''} timing difference`,
    }
  }

  // No high-confidence match
  return {
    confidence: 0,
    matchType: 'partial',
    reasoning: 'No high-confidence match found',
  }
}

/**
 * Bulk approve high-confidence matches
 * Creates Match records for all provided matches and updates transactions to 'matched' status
 */
export async function bulkApproveHighConfidenceMatches(
  workspaceId: string,
  matches: HighConfidenceMatch[]
): Promise<BulkApproveResult> {
  if (matches.length === 0) {
    return { success: true, approvedCount: 0, failedCount: 0 }
  }

  let approvedCount = 0
  let failedCount = 0

  try {
    // Process all matches in a single database transaction
    await prisma.$transaction(async (tx) => {
      for (const match of matches) {
        try {
          // Verify both transactions still exist and aren't already matched
          const [bankTxn, qboTxn] = await Promise.all([
            tx.transaction.findFirst({
              where: { id: match.bankTxnId, workspaceId, status: { not: 'matched' } },
            }),
            tx.transaction.findFirst({
              where: { id: match.qboTxnId, workspaceId, status: { not: 'matched' } },
            }),
          ])

          if (!bankTxn || !qboTxn) {
            failedCount++
            continue
          }

          // Create the match record
          await tx.match.create({
            data: {
              workspaceId,
              bankTransactionId: match.bankTxnId,
              qboTransactionId: match.qboTxnId,
              matchType: match.matchType,
              confidence: match.confidence,
              reasoning: match.reasoning,
            },
          })

          // Update both transactions to matched status
          await tx.transaction.update({
            where: { id: match.bankTxnId },
            data: { status: 'matched' },
          })

          await tx.transaction.update({
            where: { id: match.qboTxnId },
            data: { status: 'matched' },
          })

          approvedCount++
        } catch {
          failedCount++
        }
      }
    })

    // Revalidate the reconciliation page to show updated state
    revalidatePath(`/workspace/${workspaceId}/reconciliation`)

    return { success: true, approvedCount, failedCount }
  } catch (error) {
    console.error('Failed to bulk approve matches:', error)
    return {
      success: false,
      error: 'Failed to bulk approve matches. Please try again.',
      approvedCount,
      failedCount: matches.length - approvedCount
    }
  }
}
