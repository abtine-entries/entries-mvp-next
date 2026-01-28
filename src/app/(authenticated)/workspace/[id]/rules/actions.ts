'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Type for category with basic info
export interface CategoryInfo {
  id: string
  name: string
  type: string
}

// Result type for getting categories
export interface GetCategoriesResult {
  categories?: CategoryInfo[]
  error?: string
}

// Result type for creating a rule
export interface CreateRuleResult {
  success: boolean
  error?: string
  ruleId?: string
}

// Result type for getting matching transactions count
export interface MatchingTransactionsResult {
  count?: number
  error?: string
}

/**
 * Get all categories for a workspace
 */
export async function getWorkspaceCategories(
  workspaceId: string
): Promise<GetCategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: { name: 'asc' },
    })

    return { categories }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return { error: 'Failed to load categories' }
  }
}

/**
 * Parse a plain English rule into a structured condition
 * Currently supports simple patterns like:
 * - "Transactions from <vendor> are <category>"
 * - "Transactions containing <keyword> are <category>"
 * - "Transactions with <keyword> in description are <category>"
 */
function parseRuleText(ruleText: string): { type: string; value: string } | null {
  const text = ruleText.toLowerCase().trim()

  // Pattern: "Transactions from <vendor> are ..."
  const fromMatch = text.match(/transactions?\s+from\s+(.+?)\s+(are|go to|categorize as)/i)
  if (fromMatch) {
    return { type: 'vendor', value: fromMatch[1].trim() }
  }

  // Pattern: "Transactions containing <keyword> are ..."
  const containingMatch = text.match(/transactions?\s+containing\s+(.+?)\s+(are|go to|categorize as)/i)
  if (containingMatch) {
    return { type: 'contains', value: containingMatch[1].trim() }
  }

  // Pattern: "Transactions with <keyword> in description are ..."
  const withMatch = text.match(/transactions?\s+with\s+(.+?)\s+(in|are|go to)/i)
  if (withMatch) {
    return { type: 'contains', value: withMatch[1].trim() }
  }

  // Pattern: "<keyword> transactions are ..."
  const prefixMatch = text.match(/^(.+?)\s+transactions?\s+(are|go to|categorize as)/i)
  if (prefixMatch) {
    return { type: 'contains', value: prefixMatch[1].trim() }
  }

  // Fallback: use the entire text before "are" as a contains pattern
  const beforeAreMatch = text.match(/(.+?)\s+(are|go to|categorize as)/i)
  if (beforeAreMatch) {
    const value = beforeAreMatch[1].replace(/transactions?\s*/gi, '').trim()
    if (value) {
      return { type: 'contains', value }
    }
  }

  return null
}

/**
 * Get count of transactions that would match a rule
 */
export async function getMatchingTransactionsCount(
  workspaceId: string,
  ruleText: string
): Promise<MatchingTransactionsResult> {
  try {
    const parsedCondition = parseRuleText(ruleText)

    if (!parsedCondition) {
      return { count: 0 }
    }

    // Build the where clause based on the parsed condition
    const searchValue = parsedCondition.value.toLowerCase()

    const count = await prisma.transaction.count({
      where: {
        workspaceId,
        description: {
          contains: searchValue,
        },
      },
    })

    return { count }
  } catch (error) {
    console.error('Failed to count matching transactions:', error)
    return { error: 'Failed to count matching transactions' }
  }
}

/**
 * Create a new categorization rule
 */
export async function createRule(
  workspaceId: string,
  ruleText: string,
  categoryId: string
): Promise<CreateRuleResult> {
  try {
    // Get the current user session
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate inputs
    const trimmedRuleText = ruleText.trim()
    if (!trimmedRuleText) {
      return { success: false, error: 'Rule text is required' }
    }

    if (!categoryId) {
      return { success: false, error: 'Category is required' }
    }

    // Verify the category belongs to this workspace
    const category = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId },
    })

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    // Parse the rule text into a structured condition
    const parsedCondition = parseRuleText(trimmedRuleText)

    if (!parsedCondition) {
      return { success: false, error: 'Could not parse rule. Try a format like "Transactions from Gusto are Payroll"' }
    }

    // Create the rule
    const rule = await prisma.rule.create({
      data: {
        workspaceId,
        ruleText: trimmedRuleText,
        parsedCondition: JSON.stringify(parsedCondition),
        categoryId,
        isActive: true,
        matchCount: 0,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: 'rule_created',
        entityType: 'Rule',
        entityId: rule.id,
        oldValue: null,
        newValue: JSON.stringify({
          ruleText: trimmedRuleText,
          categoryId,
          categoryName: category.name,
          parsedCondition,
        }),
      },
    })

    // Revalidate the rules page
    revalidatePath(`/workspace/${workspaceId}/rules`)

    return { success: true, ruleId: rule.id }
  } catch (error) {
    console.error('Failed to create rule:', error)
    return { success: false, error: 'Failed to create rule. Please try again.' }
  }
}
