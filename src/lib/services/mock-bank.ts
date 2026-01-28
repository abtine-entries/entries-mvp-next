/**
 * Mock Bank data service
 * Provides realistic bank transaction data for reconciliation with QBO
 * Includes timing differences, fee adjustments, and unmatched transactions
 */

import { getQboTransactions, type QboTransaction } from './mock-qbo'

export interface BankTransaction {
  id: string
  externalId: string
  date: Date
  description: string
  amount: number
  bankName: string
  accountType: 'checking' | 'savings' | 'credit'
  memo: string | null
}

// Deterministic random number generator based on seed
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Helper function to generate a hash code from a string
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Generate mock bank transactions for a workspace
 * Creates transactions that mirror QBO data with realistic differences:
 * - Timing offsets (1-2 day delays for bank processing)
 * - Fee adjustments (payment processor fees, bank fees)
 * - Some unmatched transactions (bank-only)
 */
export function getBankTransactions(workspaceId: string): BankTransaction[] {
  // Use a different seed than QBO to get different random sequence
  const seed = hashCode(workspaceId + '-bank')
  const random = seededRandom(seed)
  const transactions: BankTransaction[] = []

  // Get QBO transactions to create matching bank transactions
  const qboTransactions = getQboTransactions(workspaceId)

  // Create bank transactions that correspond to QBO transactions
  // with realistic variations
  qboTransactions.forEach((qboTxn, index) => {
    // Skip some QBO transactions (these will be QBO-only, unmatched)
    if (random() < 0.1) {
      return // ~10% of QBO transactions have no bank match
    }

    const bankTxn = createBankTransactionFromQbo(qboTxn, index, random)
    transactions.push(bankTxn)
  })

  // Add some bank-only transactions (no QBO match)
  const bankOnlyCount = Math.floor(random() * 8) + 5 // 5-12 bank-only transactions
  for (let i = 0; i < bankOnlyCount; i++) {
    transactions.push(createBankOnlyTransaction(workspaceId, i, random))
  }

  // Sort by date descending
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Create a bank transaction that corresponds to a QBO transaction
 * with realistic differences (timing, fees, description variations)
 */
function createBankTransactionFromQbo(
  qboTxn: QboTransaction,
  index: number,
  random: () => number
): BankTransaction {
  // Determine the type of difference to apply
  const differenceType = random()

  let date = new Date(qboTxn.date)
  let amount = qboTxn.amount
  let description = qboTxn.description

  // Apply timing difference (40% of transactions)
  if (differenceType < 0.4) {
    // Bank shows transaction 1-3 days later (processing delay)
    const daysOffset = Math.floor(random() * 3) + 1
    date = new Date(qboTxn.date)
    date.setDate(date.getDate() + daysOffset)
  }
  // Apply fee adjustment (20% of transactions)
  else if (differenceType < 0.6) {
    // Bank shows different amount due to fees
    const feeType = random()
    if (feeType < 0.5) {
      // Payment processor fee (2-3%)
      const feePercent = 0.02 + random() * 0.01
      amount = Math.round(qboTxn.amount * (1 - feePercent) * 100) / 100
    } else {
      // Fixed bank fee ($10-50)
      const fixedFee = Math.round((10 + random() * 40) * 100) / 100
      if (qboTxn.amount < 0) {
        amount = qboTxn.amount - fixedFee // Expense becomes larger
      } else {
        amount = qboTxn.amount - fixedFee // Income becomes smaller
      }
    }
  }
  // Apply both timing and fee difference (10% of transactions)
  else if (differenceType < 0.7) {
    // Timing offset
    const daysOffset = Math.floor(random() * 2) + 1
    date = new Date(qboTxn.date)
    date.setDate(date.getDate() + daysOffset)

    // Fee adjustment
    const feePercent = 0.025
    amount = Math.round(qboTxn.amount * (1 - feePercent) * 100) / 100
  }
  // Exact match (30% of transactions) - no changes needed

  // Bank descriptions are often different from QBO
  description = transformToBankDescription(qboTxn.vendorName, random)

  return {
    id: `bank-txn-${qboTxn.id.replace('qbo-txn-', '')}`,
    externalId: `BANK-${qboTxn.externalId.replace('QBO-', '')}`,
    date,
    description,
    amount,
    bankName: random() < 0.7 ? 'Chase Business' : 'Bank of America',
    accountType: random() < 0.8 ? 'checking' : (random() < 0.5 ? 'credit' : 'savings'),
    memo: random() > 0.7 ? `REF: ${Math.floor(random() * 1000000)}` : null,
  }
}

/**
 * Transform QBO vendor name to typical bank description format
 * Banks often show abbreviated or formatted vendor names differently
 */
function transformToBankDescription(vendorName: string, random: () => number): string {
  const formats = [
    // Format 1: ALL CAPS with location code
    () => `${vendorName.toUpperCase().replace(/\s+/g, ' ')} ${Math.floor(random() * 9999)}`,
    // Format 2: Abbreviated with date reference
    () => `${vendorName.slice(0, 15).toUpperCase()} POS`,
    // Format 3: Wire/ACH format
    () => `ACH DEBIT ${vendorName.toUpperCase()}`,
    // Format 4: Check card format
    () => `CHECKCARD ${vendorName.slice(0, 20).toUpperCase()}`,
    // Format 5: Direct debit
    () => `DIRECT DEBIT - ${vendorName}`,
  ]

  const format = formats[Math.floor(random() * formats.length)]
  return format()
}

/**
 * Create a bank-only transaction (no QBO match)
 * These represent transactions not yet entered in QBO
 */
function createBankOnlyTransaction(
  workspaceId: string,
  index: number,
  random: () => number
): BankTransaction {
  const today = new Date()
  const daysAgo = Math.floor(random() * 30) // Bank-only are typically recent
  const date = new Date(today)
  date.setDate(date.getDate() - daysAgo)

  // Bank-only transaction types
  const bankOnlyTypes = [
    { description: 'ATM WITHDRAWAL', amount: -(Math.floor(random() * 4) + 1) * 100 },
    { description: 'MONTHLY SERVICE FEE', amount: -(15 + Math.floor(random() * 20)) },
    { description: 'WIRE TRANSFER FEE', amount: -(25 + Math.floor(random() * 20)) },
    { description: 'INTEREST PAYMENT', amount: Math.round((random() * 50 + 5) * 100) / 100 },
    { description: 'CASH DEPOSIT', amount: Math.round((random() * 2000 + 500) * 100) / 100 },
    { description: 'CHECK DEPOSIT #' + Math.floor(random() * 9999), amount: Math.round((random() * 5000 + 100) * 100) / 100 },
    { description: 'VENMO TRANSFER', amount: -(Math.round((random() * 200 + 20) * 100) / 100) },
    { description: 'ZELLE PAYMENT', amount: -(Math.round((random() * 500 + 50) * 100) / 100) },
    { description: 'PAYPAL TRANSFER', amount: Math.round((random() * 1000 + 100) * 100) / 100 },
    { description: 'SQUARE DEPOSIT', amount: Math.round((random() * 3000 + 200) * 100) / 100 },
    { description: 'NSF FEE', amount: -35 },
    { description: 'OVERDRAFT FEE', amount: -35 },
  ]

  const txnType = bankOnlyTypes[Math.floor(random() * bankOnlyTypes.length)]

  return {
    id: `bank-only-${workspaceId}-${index}`,
    externalId: `BANK-ONLY-${workspaceId.slice(0, 8)}-${String(index).padStart(4, '0')}`,
    date,
    description: txnType.description,
    amount: txnType.amount,
    bankName: random() < 0.7 ? 'Chase Business' : 'Bank of America',
    accountType: random() < 0.9 ? 'checking' : 'savings',
    memo: null,
  }
}
