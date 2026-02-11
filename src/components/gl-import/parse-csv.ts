import type { Platform, ParsedGLData, ParsedTransaction, ParsedCategory, ParsedVendor } from './types'

/**
 * Parse a CSV string into rows, handling quoted fields with commas and newlines.
 */
function parseCSVRows(text: string): string[][] {
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field.trim())
        field = ''
      } else if (ch === '\n' || (ch === '\r' && clean[i + 1] === '\n')) {
        if (ch === '\r') i++ // skip \r in \r\n
        current.push(field.trim())
        field = ''
        if (current.some((c) => c !== '')) {
          rows.push(current)
        }
        current = []
      } else {
        field += ch
      }
    }
  }

  // Last field/row
  current.push(field.trim())
  if (current.some((c) => c !== '')) {
    rows.push(current)
  }

  return rows
}

/**
 * Parse a currency string into a number.
 * Handles: $1,234.56  ($1,234.56)  -$1,234.56  1234.56
 */
function parseAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0
  let s = raw.trim()

  // Handle parenthesized negatives: ($1,234.56) → -1234.56
  const isNegParen = s.startsWith('(') && s.endsWith(')')
  if (isNegParen) {
    s = s.slice(1, -1)
  }

  // Remove currency symbols and commas
  s = s.replace(/[$£€,]/g, '')

  const num = parseFloat(s)
  if (isNaN(num)) return 0

  return isNegParen ? -num : num
}

/**
 * Normalize a name for deduplication: lowercase, collapse whitespace, trim.
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Infer category type from account name.
 */
function inferCategoryType(name: string): 'expense' | 'income' | 'asset' | 'liability' {
  const lower = name.toLowerCase()

  if (/revenue|income|sales|interest earned|other income|service revenue/i.test(lower)) {
    return 'income'
  }
  if (/receivable|bank|cash|checking|savings|current asset|fixed asset|undeposited/i.test(lower)) {
    return 'asset'
  }
  if (/payable|loan|credit card|liability|line of credit/i.test(lower)) {
    return 'liability'
  }
  return 'expense'
}

/**
 * Fuzzy-match header columns to detect format.
 */
function matchHeaders(headers: string[], targets: string[]): boolean {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ''))
  return targets.every((t) => normalized.some((h) => h.includes(t.toLowerCase().replace(/[^a-z]/g, ''))))
}

/**
 * Try to parse a date string into ISO format (YYYY-MM-DD).
 * Supports: MM/DD/YYYY, DD/MM/YYYY (with hint), DD Mon YYYY, YYYY-MM-DD
 */
function parseDate(raw: string, platform: Platform): string {
  const s = raw.trim()

  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD Mon YYYY (Xero format)
  const monMatch = s.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})$/i)
  if (monMatch) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    }
    const day = monMatch[1].padStart(2, '0')
    const mon = months[monMatch[2].toLowerCase().slice(0, 3)]
    return `${monMatch[3]}-${mon}-${day}`
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (slashMatch) {
    if (platform === 'xero') {
      // DD/MM/YYYY
      const day = slashMatch[1].padStart(2, '0')
      const mon = slashMatch[2].padStart(2, '0')
      return `${slashMatch[3]}-${mon}-${day}`
    } else {
      // MM/DD/YYYY (QBO)
      const mon = slashMatch[1].padStart(2, '0')
      const day = slashMatch[2].padStart(2, '0')
      return `${slashMatch[3]}-${mon}-${day}`
    }
  }

  // Fallback: return as-is (will be caught by validation later)
  return s
}

/**
 * Check if a row is a summary/total row that should be skipped.
 */
function isSummaryRow(row: string[]): boolean {
  const first = (row[0] || '').toLowerCase()
  const joined = row.join(' ').toLowerCase()
  return !first || first === '' || /^total/i.test(first) || /^(net |beginning |ending )/i.test(joined)
}

// ─── QBO Parsing ──────────────────────────────────────────────

function findColumnIndex(headers: string[], ...candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (const c of candidates) {
    const target = c.toLowerCase().replace(/[^a-z0-9]/g, '')
    const idx = normalized.findIndex((h) => h.includes(target))
    if (idx !== -1) return idx
  }
  return -1
}

function parseQBO(rows: string[][]): ParsedGLData {
  // Find header row
  const headerIdx = rows.findIndex((r) =>
    matchHeaders(r, ['date', 'amount'])
  )
  if (headerIdx === -1) {
    throw new Error('Could not detect QBO GL format. Expected columns: Date, Amount')
  }

  const headers = rows[headerIdx]
  const dateCol = findColumnIndex(headers, 'date')
  const nameCol = findColumnIndex(headers, 'name')
  const memoCol = findColumnIndex(headers, 'memo', 'description')
  const splitCol = findColumnIndex(headers, 'split', 'account')
  const amountCol = findColumnIndex(headers, 'amount')

  if (dateCol === -1 || amountCol === -1) {
    throw new Error('QBO format requires at least Date and Amount columns')
  }

  const categoryMap = new Map<string, ParsedCategory>()
  const vendorMap = new Map<string, ParsedVendor>()
  const transactions: ParsedTransaction[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (isSummaryRow(row)) continue

    const dateRaw = row[dateCol] || ''
    if (!dateRaw) continue

    const date = parseDate(dateRaw, 'qbo')
    const vendorRaw = (nameCol !== -1 ? row[nameCol] : '') || ''
    const memo = (memoCol !== -1 ? row[memoCol] : '') || ''
    const categoryRaw = (splitCol !== -1 ? row[splitCol] : '') || ''
    const amount = parseAmount(row[amountCol] || '')

    if (amount === 0) continue

    const description = memo || vendorRaw || 'Unknown'
    const vendorName = vendorRaw || 'Unknown'
    const categoryName = categoryRaw || 'Uncategorized'

    // Track category
    const catNorm = normalizeName(categoryName)
    if (!categoryMap.has(catNorm) && categoryName !== 'Uncategorized') {
      categoryMap.set(catNorm, {
        name: categoryName,
        type: inferCategoryType(categoryName),
      })
    }

    // Track vendor
    const vendNorm = normalizeName(vendorName)
    if (!vendorMap.has(vendNorm) && vendorName !== 'Unknown') {
      vendorMap.set(vendNorm, {
        name: vendorName,
        normalizedName: vendNorm,
      })
    }

    transactions.push({
      date,
      description,
      amount,
      categoryName,
      vendorName,
      source: 'qbo',
    })
  }

  return {
    transactions,
    categories: Array.from(categoryMap.values()),
    vendors: Array.from(vendorMap.values()),
  }
}

// ─── Xero Parsing ─────────────────────────────────────────────

function parseXero(rows: string[][]): ParsedGLData {
  // Find header row
  const headerIdx = rows.findIndex((r) =>
    matchHeaders(r, ['date', 'account'])
  )
  if (headerIdx === -1) {
    throw new Error('Could not detect Xero GL format. Expected columns: Date, Account')
  }

  const headers = rows[headerIdx]
  const dateCol = findColumnIndex(headers, 'date')
  const descCol = findColumnIndex(headers, 'description')
  const debitCol = findColumnIndex(headers, 'debit')
  const creditCol = findColumnIndex(headers, 'credit')
  const grossCol = findColumnIndex(headers, 'gross')
  const accountCol = findColumnIndex(headers, 'account')

  if (dateCol === -1 || accountCol === -1) {
    throw new Error('Xero format requires at least Date and Account columns')
  }

  const categoryMap = new Map<string, ParsedCategory>()
  const vendorMap = new Map<string, ParsedVendor>()
  const transactions: ParsedTransaction[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (isSummaryRow(row)) continue

    const dateRaw = row[dateCol] || ''
    if (!dateRaw) continue

    const date = parseDate(dateRaw, 'xero')
    const descRaw = (descCol !== -1 ? row[descCol] : '') || ''
    const categoryName = row[accountCol] || 'Uncategorized'

    // Calculate amount: prefer debit/credit columns, fall back to gross
    let amount = 0
    if (debitCol !== -1 || creditCol !== -1) {
      const debit = debitCol !== -1 ? parseAmount(row[debitCol] || '') : 0
      const credit = creditCol !== -1 ? parseAmount(row[creditCol] || '') : 0
      amount = credit - debit // credits positive, debits negative
    } else if (grossCol !== -1) {
      amount = parseAmount(row[grossCol] || '')
    }

    if (amount === 0) continue

    // Extract vendor from description (before first " - ")
    const dashIdx = descRaw.indexOf(' - ')
    const vendorName = dashIdx > 0 ? descRaw.slice(0, dashIdx).trim() : descRaw || 'Unknown'
    const description = descRaw || vendorName || 'Unknown'

    // Track category
    const catNorm = normalizeName(categoryName)
    if (!categoryMap.has(catNorm) && categoryName !== 'Uncategorized') {
      categoryMap.set(catNorm, {
        name: categoryName,
        type: inferCategoryType(categoryName),
      })
    }

    // Track vendor
    const vendNorm = normalizeName(vendorName)
    if (!vendorMap.has(vendNorm) && vendorName !== 'Unknown') {
      vendorMap.set(vendNorm, {
        name: vendorName,
        normalizedName: vendNorm,
      })
    }

    transactions.push({
      date,
      description,
      amount,
      categoryName,
      vendorName,
      source: 'xero',
    })
  }

  return {
    transactions,
    categories: Array.from(categoryMap.values()),
    vendors: Array.from(vendorMap.values()),
  }
}

// ─── Public API ───────────────────────────────────────────────

export function parseGLCSV(text: string, platform: Platform): ParsedGLData {
  const rows = parseCSVRows(text)

  if (rows.length < 2) {
    throw new Error('CSV file is empty or has no data rows')
  }

  if (platform === 'qbo') {
    return parseQBO(rows)
  } else {
    return parseXero(rows)
  }
}
