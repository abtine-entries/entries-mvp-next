/**
 * Mock QuickBooks Online (QBO) data service
 * Provides realistic transaction and chart of accounts data for development
 */

export interface QboTransaction {
  id: string
  externalId: string
  date: Date
  description: string
  amount: number
  vendorName: string
  categoryName: string | null
  memo: string | null
}

export interface QboCategory {
  id: string
  name: string
  type: 'expense' | 'income' | 'asset' | 'liability'
  parentId: string | null
}

export interface QboConnectionStatus {
  connected: boolean
  lastSync: Date
}

// Realistic vendor names for mock data
const vendors = [
  { name: 'Amazon Web Services', category: 'Cloud Services' },
  { name: 'Google Cloud Platform', category: 'Cloud Services' },
  { name: 'Stripe', category: 'Payment Processing' },
  { name: 'Gusto', category: 'Payroll' },
  { name: 'Slack Technologies', category: 'Software Subscriptions' },
  { name: 'Zoom Video Communications', category: 'Software Subscriptions' },
  { name: 'Adobe Systems', category: 'Software Subscriptions' },
  { name: 'Microsoft', category: 'Software Subscriptions' },
  { name: 'Salesforce', category: 'Software Subscriptions' },
  { name: 'HubSpot', category: 'Marketing' },
  { name: 'Mailchimp', category: 'Marketing' },
  { name: "Office Depot", category: 'Office Supplies' },
  { name: 'Staples', category: 'Office Supplies' },
  { name: 'FedEx', category: 'Shipping' },
  { name: 'UPS', category: 'Shipping' },
  { name: 'Comcast Business', category: 'Utilities' },
  { name: 'PG&E', category: 'Utilities' },
  { name: 'WeWork', category: 'Rent' },
  { name: 'Regus', category: 'Rent' },
  { name: 'Delta Airlines', category: 'Travel' },
  { name: 'United Airlines', category: 'Travel' },
  { name: 'Marriott Hotels', category: 'Travel' },
  { name: 'Uber', category: 'Travel' },
  { name: 'Lyft', category: 'Travel' },
  { name: 'Blue Cross Blue Shield', category: 'Insurance' },
  { name: "Hartford Insurance", category: 'Insurance' },
]

// Standard chart of accounts categories
const standardCategories: QboCategory[] = [
  // Expense categories
  { id: 'cat-expense-payroll', name: 'Payroll', type: 'expense', parentId: null },
  { id: 'cat-expense-rent', name: 'Rent', type: 'expense', parentId: null },
  { id: 'cat-expense-utilities', name: 'Utilities', type: 'expense', parentId: null },
  { id: 'cat-expense-software', name: 'Software Subscriptions', type: 'expense', parentId: null },
  { id: 'cat-expense-cloud', name: 'Cloud Services', type: 'expense', parentId: null },
  { id: 'cat-expense-marketing', name: 'Marketing', type: 'expense', parentId: null },
  { id: 'cat-expense-office', name: 'Office Supplies', type: 'expense', parentId: null },
  { id: 'cat-expense-shipping', name: 'Shipping', type: 'expense', parentId: null },
  { id: 'cat-expense-travel', name: 'Travel', type: 'expense', parentId: null },
  { id: 'cat-expense-insurance', name: 'Insurance', type: 'expense', parentId: null },
  { id: 'cat-expense-payment-processing', name: 'Payment Processing', type: 'expense', parentId: null },
  { id: 'cat-expense-professional', name: 'Professional Services', type: 'expense', parentId: null },
  { id: 'cat-expense-meals', name: 'Meals & Entertainment', type: 'expense', parentId: null },
  { id: 'cat-expense-misc', name: 'Miscellaneous', type: 'expense', parentId: null },

  // Income categories
  { id: 'cat-income-sales', name: 'Sales Revenue', type: 'income', parentId: null },
  { id: 'cat-income-services', name: 'Service Revenue', type: 'income', parentId: null },
  { id: 'cat-income-interest', name: 'Interest Income', type: 'income', parentId: null },
  { id: 'cat-income-other', name: 'Other Income', type: 'income', parentId: null },

  // Asset categories
  { id: 'cat-asset-cash', name: 'Cash', type: 'asset', parentId: null },
  { id: 'cat-asset-ar', name: 'Accounts Receivable', type: 'asset', parentId: null },
  { id: 'cat-asset-equipment', name: 'Equipment', type: 'asset', parentId: null },

  // Liability categories
  { id: 'cat-liability-ap', name: 'Accounts Payable', type: 'liability', parentId: null },
  { id: 'cat-liability-credit', name: 'Credit Card', type: 'liability', parentId: null },
  { id: 'cat-liability-loan', name: 'Loans Payable', type: 'liability', parentId: null },
]

// Deterministic random number generator based on seed
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

/**
 * Generate mock QBO transactions for a workspace
 * Uses workspace ID as seed for deterministic data generation
 */
export function getQboTransactions(workspaceId: string): QboTransaction[] {
  const seed = hashCode(workspaceId)
  const random = seededRandom(seed)
  const transactions: QboTransaction[] = []

  // Generate transactions for the last 90 days
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 90)

  // Generate 50-80 transactions
  const transactionCount = Math.floor(random() * 30) + 50

  for (let i = 0; i < transactionCount; i++) {
    const vendor = vendors[Math.floor(random() * vendors.length)]
    const daysAgo = Math.floor(random() * 90)
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)

    // Generate realistic amounts based on category
    let amount = generateAmount(vendor.category, random)

    // Most transactions are expenses (negative), some are income (positive)
    if (random() > 0.85) {
      amount = Math.abs(amount) // Income
    } else {
      amount = -Math.abs(amount) // Expense
    }

    const categoryName = getCategoryNameForVendor(vendor.category)

    transactions.push({
      id: `qbo-txn-${workspaceId}-${i}`,
      externalId: `QBO-${workspaceId.slice(0, 8)}-${String(i).padStart(5, '0')}`,
      date,
      description: `${vendor.name} - ${generateMemo(vendor.category, random)}`,
      amount,
      vendorName: vendor.name,
      categoryName,
      memo: random() > 0.5 ? generateMemo(vendor.category, random) : null,
    })
  }

  // Sort by date descending
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Get the standard chart of accounts for a workspace
 * Returns the same categories for all workspaces
 */
export function getChartOfAccounts(workspaceId: string): QboCategory[] {
  // Add workspace-specific prefix to IDs for uniqueness
  return standardCategories.map(cat => ({
    ...cat,
    id: `${workspaceId}-${cat.id}`,
    parentId: cat.parentId ? `${workspaceId}-${cat.parentId}` : null,
  }))
}

/**
 * Get the QBO connection status for a workspace
 * Always returns connected status with a recent sync time
 */
export function getConnectionStatus(workspaceId: string): QboConnectionStatus {
  // Mock: last sync was 5-30 minutes ago based on workspace ID
  const seed = hashCode(workspaceId)
  const random = seededRandom(seed)
  const minutesAgo = Math.floor(random() * 25) + 5

  const lastSync = new Date()
  lastSync.setMinutes(lastSync.getMinutes() - minutesAgo)

  return {
    connected: true,
    lastSync,
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

// Helper function to generate realistic amounts based on category
function generateAmount(category: string, random: () => number): number {
  const ranges: Record<string, [number, number]> = {
    'Cloud Services': [100, 5000],
    'Payment Processing': [50, 2000],
    'Payroll': [5000, 50000],
    'Software Subscriptions': [20, 500],
    'Marketing': [100, 5000],
    'Office Supplies': [20, 500],
    'Shipping': [10, 200],
    'Utilities': [100, 1000],
    'Rent': [2000, 15000],
    'Travel': [50, 2000],
    'Insurance': [500, 3000],
  }

  const [min, max] = ranges[category] || [50, 500]
  const amount = random() * (max - min) + min
  return Math.round(amount * 100) / 100 // Round to 2 decimal places
}

// Helper function to map vendor category to chart of accounts category
function getCategoryNameForVendor(vendorCategory: string): string {
  const mapping: Record<string, string> = {
    'Cloud Services': 'Cloud Services',
    'Payment Processing': 'Payment Processing',
    'Payroll': 'Payroll',
    'Software Subscriptions': 'Software Subscriptions',
    'Marketing': 'Marketing',
    'Office Supplies': 'Office Supplies',
    'Shipping': 'Shipping',
    'Utilities': 'Utilities',
    'Rent': 'Rent',
    'Travel': 'Travel',
    'Insurance': 'Insurance',
  }
  return mapping[vendorCategory] || 'Miscellaneous'
}

// Helper function to generate realistic memo text
function generateMemo(category: string, random: () => number): string {
  const memos: Record<string, string[]> = {
    'Cloud Services': ['Monthly compute', 'Storage fees', 'Data transfer', 'Instance usage'],
    'Payment Processing': ['Transaction fees', 'Monthly subscription', 'Currency conversion'],
    'Payroll': ['Bi-weekly payroll', 'Payroll taxes', 'Benefits administration'],
    'Software Subscriptions': ['Annual subscription', 'Monthly license', 'User seats', 'Premium tier'],
    'Marketing': ['Ad spend', 'Campaign budget', 'Social media', 'Content creation'],
    'Office Supplies': ['Paper supplies', 'Printer ink', 'Office equipment', 'Desk accessories'],
    'Shipping': ['Package delivery', 'Express shipping', 'International shipping'],
    'Utilities': ['Monthly service', 'Internet service', 'Phone service'],
    'Rent': ['Monthly rent', 'Office space', 'Meeting room rental'],
    'Travel': ['Flight booking', 'Hotel stay', 'Ground transportation', 'Meal expense'],
    'Insurance': ['Premium payment', 'Policy renewal', 'Coverage update'],
  }

  const options = memos[category] || ['General expense']
  return options[Math.floor(random() * options.length)]
}
