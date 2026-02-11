export type Platform = 'qbo' | 'xero'

export interface ParsedTransaction {
  date: string // ISO date string
  description: string
  amount: number // positive = credit, negative = debit
  categoryName: string
  vendorName: string
  source: Platform
}

export interface ParsedCategory {
  name: string
  type: 'expense' | 'income' | 'asset' | 'liability'
}

export interface ParsedVendor {
  name: string
  normalizedName: string
}

export interface ParsedGLData {
  transactions: ParsedTransaction[]
  categories: ParsedCategory[]
  vendors: ParsedVendor[]
}

export interface ImportSummary {
  transactionCount: number
  categoryCount: number
  vendorCount: number
}

export interface ImportResult {
  success: boolean
  error?: string
  importId?: string
  transactionCount?: number
  categoryCount?: number
  vendorCount?: number
}
