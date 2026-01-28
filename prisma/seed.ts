import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { Decimal } from '@prisma/client/runtime/client'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Database is at project root (relative to where prisma runs)
const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const dbPath = resolve(projectRoot, 'dev.db')

// Create Prisma client with the adapter
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

// Standard chart of accounts categories
const categories = [
  { name: 'Bank Fees', type: 'expense' },
  { name: 'Office Supplies', type: 'expense' },
  { name: 'Payroll', type: 'expense' },
  { name: 'Rent', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Professional Services', type: 'expense' },
  { name: 'Sales Revenue', type: 'income' },
  { name: 'Service Revenue', type: 'income' },
  { name: 'Accounts Receivable', type: 'asset' },
  { name: 'Accounts Payable', type: 'liability' },
]

// Realistic vendor names for different category types
const vendorsByCategory: Record<string, string[]> = {
  'Bank Fees': ['Chase Bank', 'Bank of America', 'Wells Fargo'],
  'Office Supplies': ['Staples', 'Office Depot', 'Amazon'],
  'Payroll': ['Gusto', 'ADP', 'Paychex'],
  'Rent': ['XYZ Property Management', 'ABC Realty'],
  'Utilities': ['PG&E', 'AT&T', 'Comcast'],
  'Professional Services': ['Smith & Associates CPA', 'Legal Counsel LLC'],
  'Sales Revenue': ['Customer Payment', 'Stripe Payment'],
  'Service Revenue': ['Consulting Fee', 'Client Retainer'],
}

// Generate a random date within the last 3 months
function randomDate(): Date {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  return new Date(threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime()))
}

// Generate a random amount between min and max
function randomAmount(min: number, max: number, isNegative = true): Decimal {
  const amount = Math.round((Math.random() * (max - min) + min) * 100) / 100
  return new Decimal(isNegative ? -amount : amount)
}

// Generate external ID
function generateExternalId(source: string, index: number): string {
  return `${source.toUpperCase()}-${Date.now()}-${index.toString().padStart(4, '0')}`
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clean up existing data
  await prisma.event.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.anomaly.deleteMany()
  await prisma.match.deleteMany()
  await prisma.rule.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned up existing data')

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      // Password hash for "password123" (bcrypt with 10 rounds)
      passwordHash: '$2b$10$wXTHmCjeCqbEKV70OQ32cOmh5IwFY1IW0hJ.Cx8dPYb7cbDw7gU62',
    },
  })

  console.log(`✅ Created user: ${user.email}`)

  // Create 2 workspaces
  const workspace1 = await prisma.workspace.create({
    data: {
      name: 'Acme Corporation',
      userId: user.id,
      qboStatus: 'connected',
      lastSyncAt: new Date(),
    },
  })

  const workspace2 = await prisma.workspace.create({
    data: {
      name: 'Tech Startup Inc',
      userId: user.id,
      qboStatus: 'connected',
      lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  })

  console.log(`✅ Created workspaces: ${workspace1.name}, ${workspace2.name}`)

  // Create categories for each workspace
  const categoryMap: Record<string, Record<string, string>> = {
    [workspace1.id]: {},
    [workspace2.id]: {},
  }

  for (const ws of [workspace1, workspace2]) {
    for (const cat of categories) {
      const created = await prisma.category.create({
        data: {
          workspaceId: ws.id,
          name: cat.name,
          type: cat.type,
        },
      })
      categoryMap[ws.id][cat.name] = created.id
    }
  }

  console.log('✅ Created 10 categories per workspace')

  // Create transactions for each workspace
  for (const ws of [workspace1, workspace2]) {
    let txnIndex = 0

    // Create 50+ transactions per workspace
    // Mix of bank and QBO sources
    for (const cat of categories) {
      const vendors = vendorsByCategory[cat.name] || ['Generic Vendor']
      const isIncome = cat.type === 'income'

      // Create 5-6 transactions per category
      for (let i = 0; i < (Math.floor(Math.random() * 2) + 5); i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)]
        const date = randomDate()
        const amount = randomAmount(
          isIncome ? 500 : 50,
          isIncome ? 5000 : 2000,
          !isIncome
        )

        // Create bank transaction
        const bankTxn = await prisma.transaction.create({
          data: {
            workspaceId: ws.id,
            source: 'bank',
            externalId: generateExternalId('bank', txnIndex++),
            date,
            description: `${vendor} - ${cat.name}`,
            amount,
            categoryId: categoryMap[ws.id][cat.name],
            status: 'unmatched',
          },
        })

        // Create corresponding QBO transaction (with slight variations for realism)
        // Some with timing differences, some with fee adjustments
        const hasTimingDiff = Math.random() > 0.7
        const hasFeeAdjustment = Math.random() > 0.8

        const qboDate = hasTimingDiff
          ? new Date(date.getTime() + (Math.random() * 2 + 1) * 24 * 60 * 60 * 1000)
          : date

        const qboAmount = hasFeeAdjustment
          ? new Decimal(amount.toNumber() * (isIncome ? 0.97 : 1.03)) // 3% fee
          : amount

        const qboTxn = await prisma.transaction.create({
          data: {
            workspaceId: ws.id,
            source: 'qbo',
            externalId: generateExternalId('qbo', txnIndex++),
            date: qboDate,
            description: `${vendor}`,
            amount: qboAmount,
            categoryId: categoryMap[ws.id][cat.name],
            status: 'unmatched',
          },
        })

        // Create some pre-matched transactions (about 40%)
        if (Math.random() > 0.6) {
          await prisma.match.create({
            data: {
              workspaceId: ws.id,
              bankTransactionId: bankTxn.id,
              qboTransactionId: qboTxn.id,
              matchType: hasFeeAdjustment ? 'partial' : (hasTimingDiff ? 'suggested' : 'exact'),
              confidence: hasFeeAdjustment ? 0.75 : (hasTimingDiff ? 0.85 : 0.98),
              reasoning: hasFeeAdjustment
                ? 'Amount differs by processing fee'
                : (hasTimingDiff ? 'Same amount, timing difference detected' : 'Exact match on amount and date'),
            },
          })

          // Update transaction status
          await prisma.transaction.update({
            where: { id: bankTxn.id },
            data: { status: 'matched' },
          })
          await prisma.transaction.update({
            where: { id: qboTxn.id },
            data: { status: 'matched' },
          })
        }
      }
    }

    // Create some unmatched bank-only transactions
    for (let i = 0; i < 5; i++) {
      await prisma.transaction.create({
        data: {
          workspaceId: ws.id,
          source: 'bank',
          externalId: generateExternalId('bank', txnIndex++),
          date: randomDate(),
          description: `Unknown Vendor ${i + 1}`,
          amount: randomAmount(100, 500),
          status: 'unmatched',
        },
      })
    }

    console.log(`✅ Created 50+ transactions for ${ws.name}`)
  }

  // Create Event records for all transactions
  for (const ws of [workspace1, workspace2]) {
    const transactions = await prisma.transaction.findMany({
      where: { workspaceId: ws.id },
    })

    for (const txn of transactions) {
      await prisma.event.create({
        data: {
          workspaceId: ws.id,
          entityType: 'transaction',
          entityId: txn.id,
          title: txn.description,
        },
      })
    }

    console.log(`✅ Created ${transactions.length} events for ${ws.name}`)
  }

  // Create 5 anomalies of different types for workspace1
  const anomalyTypes: Array<{
    type: string
    severity: string
    description: string
    suggestedResolution: string
  }> = [
    {
      type: 'timing',
      severity: 'low',
      description: 'Transaction processed 5 days after expected date',
      suggestedResolution: 'Review transaction timing with bank',
    },
    {
      type: 'duplicate',
      severity: 'high',
      description: 'Potential duplicate payment detected for Staples',
      suggestedResolution: 'Verify if both transactions are legitimate',
    },
    {
      type: 'amount',
      severity: 'medium',
      description: 'Amount differs from historical average by 150%',
      suggestedResolution: 'Confirm unusual amount with vendor',
    },
    {
      type: 'vendor',
      severity: 'medium',
      description: 'New vendor not previously seen in transactions',
      suggestedResolution: 'Add vendor to approved vendor list if legitimate',
    },
    {
      type: 'unusual',
      severity: 'high',
      description: 'Large transaction outside normal business hours',
      suggestedResolution: 'Verify authorization of after-hours transaction',
    },
  ]

  // Get some transactions to attach anomalies to
  const ws1Transactions = await prisma.transaction.findMany({
    where: { workspaceId: workspace1.id },
    take: 5,
  })

  for (let i = 0; i < anomalyTypes.length; i++) {
    await prisma.anomaly.create({
      data: {
        workspaceId: workspace1.id,
        transactionId: ws1Transactions[i].id,
        type: anomalyTypes[i].type,
        severity: anomalyTypes[i].severity,
        description: anomalyTypes[i].description,
        suggestedResolution: anomalyTypes[i].suggestedResolution,
        status: 'open',
      },
    })
  }

  console.log('✅ Created 5 anomalies of different types')

  // Summary
  const userCount = await prisma.user.count()
  const workspaceCount = await prisma.workspace.count()
  const categoryCount = await prisma.category.count()
  const transactionCount = await prisma.transaction.count()
  const matchCount = await prisma.match.count()
  const anomalyCount = await prisma.anomaly.count()
  const eventCount = await prisma.event.count()

  console.log('\n📊 Seed Summary:')
  console.log(`   Users: ${userCount}`)
  console.log(`   Workspaces: ${workspaceCount}`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   Transactions: ${transactionCount}`)
  console.log(`   Matches: ${matchCount}`)
  console.log(`   Anomalies: ${anomalyCount}`)
  console.log(`   Events: ${eventCount}`)
  console.log('\n✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
