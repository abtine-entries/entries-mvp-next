/**
 * Mock AI Categorization Service
 * Provides deterministic category suggestions for transactions
 * Uses pattern-based logic to simulate AI categorization behavior
 */

export interface Transaction {
  id: string
  description: string
  amount: number
  vendorName?: string
}

export interface Category {
  id: string
  name: string
  type: 'expense' | 'income' | 'asset' | 'liability'
}

export interface CategorySuggestion {
  categoryId: string
  confidence: number
  reasoning: string
}

/**
 * Known vendor patterns mapped to category names
 * Higher specificity patterns should be checked first
 */
const vendorPatterns: Array<{ patterns: string[]; categoryName: string; confidence: number }> = [
  // Payroll - very high confidence
  { patterns: ['gusto', 'adp', 'paychex', 'payroll'], categoryName: 'Payroll', confidence: 0.98 },

  // Cloud Services
  { patterns: ['aws', 'amazon web services', 'google cloud', 'gcp', 'azure', 'digitalocean', 'heroku', 'cloudflare'], categoryName: 'Cloud Services', confidence: 0.95 },

  // Software Subscriptions
  { patterns: ['slack', 'zoom', 'adobe', 'microsoft', 'msft', 'salesforce', 'sfdc', 'hubspot', 'asana', 'notion', 'figma', 'github', 'atlassian', 'jira', 'confluence', 'dropbox', '1password', 'lastpass'], categoryName: 'Software Subscriptions', confidence: 0.93 },

  // Payment Processing
  { patterns: ['stripe', 'square', 'paypal', 'braintree', 'authorize.net'], categoryName: 'Payment Processing', confidence: 0.94 },

  // Marketing
  { patterns: ['mailchimp', 'constant contact', 'facebook ads', 'google ads', 'linkedin ads', 'twitter ads', 'hootsuite', 'buffer', 'semrush', 'ahrefs', 'hubspot marketing'], categoryName: 'Marketing', confidence: 0.91 },

  // Office Supplies
  { patterns: ['office depot', 'staples', 'amazon office', 'uline'], categoryName: 'Office Supplies', confidence: 0.88 },

  // Shipping
  { patterns: ['fedex', 'fed ex', 'ups', 'united parcel', 'usps', 'dhl', 'stamps.com', 'shippo'], categoryName: 'Shipping', confidence: 0.92 },

  // Utilities
  { patterns: ['comcast', 'verizon', 'at&t', 'att', 'pge', 'pg&e', 'pacific gas', 'con edison', 'xfinity', 'spectrum'], categoryName: 'Utilities', confidence: 0.90 },

  // Rent
  { patterns: ['wework', 'regus', 'spaces', 'industrious', 'rent payment', 'office lease', 'landlord'], categoryName: 'Rent', confidence: 0.85 },

  // Travel
  { patterns: ['delta', 'united airlines', 'american airlines', 'southwest', 'jetblue', 'marriott', 'hilton', 'hyatt', 'airbnb', 'vrbo', 'uber', 'lyft', 'enterprise rent', 'hertz', 'national car', 'expedia', 'booking.com'], categoryName: 'Travel', confidence: 0.89 },

  // Insurance
  { patterns: ['blue cross', 'bcbs', 'anthem', 'aetna', 'cigna', 'united health', 'kaiser', 'hartford', 'state farm', 'allstate', 'geico', 'progressive', 'liberty mutual'], categoryName: 'Insurance', confidence: 0.92 },

  // Professional Services
  { patterns: ['attorney', 'law firm', 'legal', 'cpa', 'accountant', 'consultant', 'advisory'], categoryName: 'Professional Services', confidence: 0.80 },

  // Meals & Entertainment
  { patterns: ['doordash', 'grubhub', 'uber eats', 'seamless', 'restaurant', 'cafe', 'coffee', 'starbucks', 'dunkin'], categoryName: 'Meals & Entertainment', confidence: 0.85 },
]

/**
 * Keyword patterns for when vendor name is not recognized
 * These provide lower confidence suggestions
 */
const keywordPatterns: Array<{ keywords: string[]; categoryName: string; confidence: number }> = [
  { keywords: ['subscription', 'monthly', 'annual', 'license', 'seat'], categoryName: 'Software Subscriptions', confidence: 0.70 },
  { keywords: ['hosting', 'server', 'compute', 'storage', 'bandwidth'], categoryName: 'Cloud Services', confidence: 0.72 },
  { keywords: ['fee', 'processing', 'transaction'], categoryName: 'Payment Processing', confidence: 0.65 },
  { keywords: ['advertising', 'campaign', 'marketing', 'promotion'], categoryName: 'Marketing', confidence: 0.68 },
  { keywords: ['office', 'supplies', 'paper', 'printer'], categoryName: 'Office Supplies', confidence: 0.65 },
  { keywords: ['shipping', 'freight', 'delivery', 'postage'], categoryName: 'Shipping', confidence: 0.70 },
  { keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'utility'], categoryName: 'Utilities', confidence: 0.72 },
  { keywords: ['rent', 'lease', 'space'], categoryName: 'Rent', confidence: 0.68 },
  { keywords: ['flight', 'hotel', 'travel', 'trip', 'airfare', 'lodging', 'mileage'], categoryName: 'Travel', confidence: 0.70 },
  { keywords: ['insurance', 'premium', 'policy', 'coverage'], categoryName: 'Insurance', confidence: 0.75 },
  { keywords: ['legal', 'attorney', 'consulting', 'professional'], categoryName: 'Professional Services', confidence: 0.60 },
  { keywords: ['meal', 'food', 'lunch', 'dinner', 'breakfast', 'catering'], categoryName: 'Meals & Entertainment', confidence: 0.65 },
]

/**
 * Suggest a category for a transaction based on vendor/description patterns
 * Returns a CategorySuggestion with categoryId, confidence (0-1), and reasoning
 */
export function suggestCategory(
  transaction: Transaction,
  categories: Category[]
): CategorySuggestion {
  const description = transaction.description.toLowerCase()
  const vendorName = transaction.vendorName?.toLowerCase() || ''
  const combinedText = `${vendorName} ${description}`

  // First, try to match known vendor patterns (highest confidence)
  for (const pattern of vendorPatterns) {
    const matched = pattern.patterns.some(p => combinedText.includes(p))
    if (matched) {
      const category = findCategoryByName(categories, pattern.categoryName)
      if (category) {
        return {
          categoryId: category.id,
          confidence: pattern.confidence,
          reasoning: `Recognized vendor pattern matches "${pattern.categoryName}" category`,
        }
      }
    }
  }

  // Second, try keyword-based matching (lower confidence)
  for (const pattern of keywordPatterns) {
    const matched = pattern.keywords.some(k => combinedText.includes(k))
    if (matched) {
      const category = findCategoryByName(categories, pattern.categoryName)
      if (category) {
        return {
          categoryId: category.id,
          confidence: pattern.confidence,
          reasoning: `Description keywords suggest "${pattern.categoryName}" category`,
        }
      }
    }
  }

  // Third, try amount-based heuristics
  const amountSuggestion = suggestByAmount(transaction.amount, categories)
  if (amountSuggestion) {
    return amountSuggestion
  }

  // Fallback to Miscellaneous with low confidence
  const miscCategory = findCategoryByName(categories, 'Miscellaneous')
  if (miscCategory) {
    return {
      categoryId: miscCategory.id,
      confidence: 0.30,
      reasoning: 'No clear pattern match - suggest manual review',
    }
  }

  // If no Miscellaneous category exists, use the first expense category
  const fallbackCategory = categories.find(c => c.type === 'expense')
  if (fallbackCategory) {
    return {
      categoryId: fallbackCategory.id,
      confidence: 0.20,
      reasoning: 'Unable to determine category - requires manual classification',
    }
  }

  // Last resort: use first available category
  return {
    categoryId: categories[0].id,
    confidence: 0.10,
    reasoning: 'No matching category patterns found',
  }
}

/**
 * Find a category by name (case-insensitive)
 */
function findCategoryByName(categories: Category[], name: string): Category | undefined {
  const nameLower = name.toLowerCase()
  return categories.find(c => c.name.toLowerCase() === nameLower)
}

/**
 * Suggest category based on transaction amount patterns
 */
function suggestByAmount(amount: number, categories: Category[]): CategorySuggestion | null {
  const absAmount = Math.abs(amount)

  // Large recurring amounts are often payroll or rent
  if (absAmount >= 5000 && absAmount <= 100000) {
    // Could be payroll or rent - use payroll as default for large amounts
    const payrollCategory = findCategoryByName(categories, 'Payroll')
    if (payrollCategory && amount < 0) {
      return {
        categoryId: payrollCategory.id,
        confidence: 0.55,
        reasoning: 'Large recurring expense amount - possibly payroll',
      }
    }
  }

  // Small recurring amounts might be subscriptions
  if (absAmount >= 5 && absAmount <= 100) {
    const softwareCategory = findCategoryByName(categories, 'Software Subscriptions')
    if (softwareCategory && amount < 0) {
      return {
        categoryId: softwareCategory.id,
        confidence: 0.45,
        reasoning: 'Small recurring amount - possibly software subscription',
      }
    }
  }

  // Positive amounts are typically income
  if (amount > 0) {
    const salesCategory = findCategoryByName(categories, 'Sales Revenue')
    if (salesCategory) {
      return {
        categoryId: salesCategory.id,
        confidence: 0.60,
        reasoning: 'Positive amount indicates income - possibly sales revenue',
      }
    }

    const incomeCategory = categories.find(c => c.type === 'income')
    if (incomeCategory) {
      return {
        categoryId: incomeCategory.id,
        confidence: 0.50,
        reasoning: 'Positive amount indicates income',
      }
    }
  }

  return null
}
