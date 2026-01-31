'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Result type for creating a rule
export interface CreateRuleResult {
  success: boolean
  error?: string
  ruleId?: string
}

// Result type for toggling rule status
export interface ToggleRuleResult {
  success: boolean
  isActive?: boolean
  error?: string
}

/**
 * Create a new rule from a natural-language prompt.
 * ruleText is the concise AI-generated title.
 * parsedCondition is a JSON string containing the original prompt and any structured data.
 */
export async function createRule(
  workspaceId: string,
  ruleText: string,
  parsedCondition: string
): Promise<CreateRuleResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const trimmedRuleText = ruleText.trim()
    if (!trimmedRuleText) {
      return { success: false, error: 'Rule text is required' }
    }

    const rule = await prisma.rule.create({
      data: {
        workspaceId,
        ruleText: trimmedRuleText,
        parsedCondition,
        isActive: true,
        matchCount: 0,
      },
    })

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: 'rule_created',
        entityType: 'Rule',
        entityId: rule.id,
        oldValue: null,
        newValue: JSON.stringify({ ruleText: trimmedRuleText, parsedCondition }),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/rules`)
    return { success: true, ruleId: rule.id }
  } catch (error) {
    console.error('Failed to create rule:', error)
    return { success: false, error: 'Failed to create rule. Please try again.' }
  }
}

/**
 * Toggle a rule's isActive status
 */
export async function toggleRuleStatus(
  ruleId: string,
  workspaceId: string
): Promise<ToggleRuleResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const rule = await prisma.rule.findFirst({
      where: { id: ruleId, workspaceId },
    })

    if (!rule) {
      return { success: false, error: 'Rule not found' }
    }

    const newIsActive = !rule.isActive

    await prisma.rule.update({
      where: { id: ruleId },
      data: { isActive: newIsActive },
    })

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: newIsActive ? 'rule_enabled' : 'rule_disabled',
        entityType: 'Rule',
        entityId: ruleId,
        oldValue: JSON.stringify({ isActive: rule.isActive, ruleText: rule.ruleText }),
        newValue: JSON.stringify({ isActive: newIsActive, ruleText: rule.ruleText }),
      },
    })

    revalidatePath(`/workspace/${workspaceId}/rules`)
    return { success: true, isActive: newIsActive }
  } catch (error) {
    console.error('Failed to toggle rule status:', error)
    return { success: false, error: 'Failed to update rule. Please try again.' }
  }
}
