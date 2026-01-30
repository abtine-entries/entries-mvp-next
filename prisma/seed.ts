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
  'Accounts Receivable': ['Client Invoice', 'Pending Collection'],
  'Accounts Payable': ['Vendor Invoice', 'Supplier Payment'],
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

  // Clean up existing data (order matters for foreign key constraints)
  await prisma.esmeConfidence.deleteMany()
  await prisma.esmeMessage.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.eventNote.deleteMany()
  await prisma.eventProperty.deleteMany()
  await prisma.event.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.anomaly.deleteMany()
  await prisma.match.deleteMany()
  await prisma.rule.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.category.deleteMany()
  await prisma.eventPropertyDefinition.deleteMany()
  await prisma.document.deleteMany()
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

  // Create vendors for each workspace
  // vendorMap: workspaceId -> normalizedName -> Vendor record
  const vendorMap: Record<string, Record<string, { id: string; name: string }>> = {
    [workspace1.id]: {},
    [workspace2.id]: {},
  }

  for (const ws of [workspace1, workspace2]) {
    // Collect all unique vendor names from vendorsByCategory
    const uniqueVendors = new Set<string>()
    for (const names of Object.values(vendorsByCategory)) {
      for (const name of names) {
        uniqueVendors.add(name)
      }
    }

    for (const vendorName of uniqueVendors) {
      const normalizedName = vendorName.toLowerCase().trim()
      const now = new Date()
      const created = await prisma.vendor.create({
        data: {
          workspaceId: ws.id,
          name: vendorName,
          normalizedName,
          totalSpend: new Decimal(0),
          transactionCount: 0,
          firstSeen: now,
          lastSeen: now,
        },
      })
      vendorMap[ws.id][normalizedName] = { id: created.id, name: created.name }
    }
  }

  console.log('✅ Created vendors for each workspace')

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
        const vendorNormalized = vendor.toLowerCase().trim()
        const vendorRecord = vendorMap[ws.id][vendorNormalized]
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
            vendorId: vendorRecord?.id ?? null,
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
            vendorId: vendorRecord?.id ?? null,
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

  // Update vendor aggregates (totalSpend, transactionCount, firstSeen, lastSeen)
  for (const ws of [workspace1, workspace2]) {
    const vendors = await prisma.vendor.findMany({
      where: { workspaceId: ws.id },
    })

    for (const vendor of vendors) {
      const transactions = await prisma.transaction.findMany({
        where: { vendorId: vendor.id },
        orderBy: { date: 'asc' },
      })

      if (transactions.length > 0) {
        // Sum absolute amounts for totalSpend
        const totalSpend = transactions.reduce(
          (sum, txn) => sum.plus(txn.amount.abs()),
          new Decimal(0)
        )
        const firstSeen = transactions[0].date
        const lastSeen = transactions[transactions.length - 1].date

        await prisma.vendor.update({
          where: { id: vendor.id },
          data: {
            totalSpend,
            transactionCount: transactions.length,
            firstSeen,
            lastSeen,
          },
        })
      }
    }

    console.log(`✅ Updated vendor aggregates for ${ws.name}`)
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

  // Create sample alerts across workspaces
  const anomalies = await prisma.anomaly.findMany({
    where: { workspaceId: workspace1.id },
    take: 2,
  })

  const alertsData = [
    // --- Workspace 1: Acme Corporation (8 alerts) ---
    // Anomaly alerts (3)
    {
      workspaceId: workspace1.id,
      type: 'anomaly',
      priority: 'requires_action',
      status: 'active',
      title: 'Duplicate transaction detected: $1,500 to Acme Corp',
      body: 'Two identical payments of $1,500.00 were made to Acme Corp within 24 hours. This may be an accidental duplicate.',
      entityType: 'anomaly',
      entityId: anomalies[0]?.id ?? null,
      responseType: 'confirm',
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    {
      workspaceId: workspace1.id,
      type: 'anomaly',
      priority: 'requires_action',
      status: 'active',
      title: 'Unusual amount: $15,000 payment to new vendor',
      body: 'A $15,000 payment was made to "GlobalTech Services", a vendor not previously seen in this workspace. The amount is 300% above the average transaction.',
      entityType: 'anomaly',
      entityId: anomalies[1]?.id ?? null,
      responseType: null,
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    {
      workspaceId: workspace1.id,
      type: 'anomaly',
      priority: 'fyi',
      status: 'resolved',
      title: 'Timing mismatch on vendor payment',
      body: 'Payment to Staples posted 5 days after the expected date based on historical patterns.',
      entityType: 'transaction',
      entityId: ws1Transactions[0]?.id ?? null,
      responseType: null,
      responseOptions: null,
      responseValue: 'dismissed',
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      resolvedById: user.id,
      snoozedUntil: null,
      assignedToId: null,
    },
    // AI question alerts (3)
    {
      workspaceId: workspace1.id,
      type: 'ai_question',
      priority: 'requires_action',
      status: 'active',
      title: 'Confirm categorization: 12 Stripe charges as Payment Processing?',
      body: 'I found 12 recurring charges from Stripe totaling $847.00. Should these be categorized as "Payment Processing" under Bank Fees?',
      entityType: null,
      entityId: null,
      responseType: 'confirm',
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    {
      workspaceId: workspace1.id,
      type: 'ai_question',
      priority: 'requires_action',
      status: 'active',
      title: 'Which category for recurring Adobe subscription?',
      body: 'Monthly Adobe Creative Cloud charge of $54.99 could be classified under multiple categories. Please select the appropriate one.',
      entityType: null,
      entityId: null,
      responseType: 'select',
      responseOptions: JSON.stringify(['Software & Subscriptions', 'Office Supplies', 'Professional Services']),
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    {
      workspaceId: workspace1.id,
      type: 'ai_question',
      priority: 'requires_action',
      status: 'active',
      title: 'What is the purpose of the $2,300 transfer?',
      body: 'An internal transfer of $2,300 was detected between checking and savings accounts. Please describe the purpose for proper classification.',
      entityType: 'transaction',
      entityId: ws1Transactions[2]?.id ?? null,
      responseType: 'text',
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    // System alert (1)
    {
      workspaceId: workspace1.id,
      type: 'system',
      priority: 'fyi',
      status: 'active',
      title: 'QuickBooks sync completed: 47 new transactions',
      body: 'Successfully synced 47 new transactions from QuickBooks Online. 12 were auto-matched, 35 require review.',
      entityType: null,
      entityId: null,
      responseType: null,
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    // Insight alert (1)
    {
      workspaceId: workspace1.id,
      type: 'insight',
      priority: 'fyi',
      status: 'active',
      title: 'Client expenses up 40% vs last month',
      body: 'Acme Corporation total expenses increased from $12,400 to $17,360 compared to last month. Largest increase in Professional Services (+$3,200) and Office Supplies (+$1,100).',
      entityType: null,
      entityId: null,
      responseType: null,
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },

    // --- Workspace 2: Tech Startup Inc (6 alerts) ---
    // System alerts (2)
    {
      workspaceId: workspace2.id,
      type: 'system',
      priority: 'requires_action',
      status: 'active',
      title: 'Sync failed: QuickBooks connection error',
      body: 'The scheduled QuickBooks sync failed due to an authentication error. Please reconnect the QuickBooks integration to resume automatic syncing.',
      entityType: null,
      entityId: null,
      responseType: null,
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    {
      workspaceId: workspace2.id,
      type: 'system',
      priority: 'fyi',
      status: 'resolved',
      title: 'Chase bank feed connected successfully',
      body: 'Chase business checking account has been connected. Historical transactions from the last 90 days have been imported.',
      entityType: null,
      entityId: null,
      responseType: null,
      responseOptions: null,
      responseValue: 'dismissed',
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolvedById: user.id,
      snoozedUntil: null,
      assignedToId: null,
    },
    // Insight alerts (2)
    {
      workspaceId: workspace2.id,
      type: 'insight',
      priority: 'fyi',
      status: 'active',
      title: 'Payroll costs trending 15% above budget',
      body: 'Tech Startup Inc payroll expenses for this quarter are tracking 15% above the projected budget. Current run rate: $48,000/month vs budgeted $41,700/month.',
      entityType: null,
      entityId: null,
      responseType: null,
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    {
      workspaceId: workspace2.id,
      type: 'insight',
      priority: 'fyi',
      status: 'snoozed',
      title: 'Recurring vendor payments could be consolidated',
      body: 'Three separate monthly payments to AWS, Google Cloud, and Azure total $2,800/month. Consider consolidating to a single cloud provider for potential savings.',
      entityType: null,
      entityId: null,
      responseType: null,
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // snoozed for 1 week
      assignedToId: null,
    },
    // Anomaly alert (1)
    {
      workspaceId: workspace2.id,
      type: 'anomaly',
      priority: 'requires_action',
      status: 'active',
      title: 'Duplicate subscription charge: Slack',
      body: 'Two Slack charges of $12.50/user were billed this month (Dec 1 and Dec 15). This may be a billing error from the provider.',
      entityType: null,
      entityId: null,
      responseType: 'confirm',
      responseOptions: null,
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
    // AI question alert (1)
    {
      workspaceId: workspace2.id,
      type: 'ai_question',
      priority: 'requires_action',
      status: 'active',
      title: 'How should contractor payments be classified?',
      body: 'There are 8 payments totaling $24,000 to individual contractors this month. Should these be categorized as "Professional Services" or "Payroll"?',
      entityType: null,
      entityId: null,
      responseType: 'select',
      responseOptions: JSON.stringify(['Professional Services', 'Payroll', 'Contractor Payments (new category)']),
      responseValue: null,
      resolvedAt: null,
      resolvedById: null,
      snoozedUntil: null,
      assignedToId: null,
    },
  ]

  for (const alertData of alertsData) {
    await prisma.alert.create({ data: alertData })
  }

  const alertCount = await prisma.alert.count()
  console.log(`✅ Created ${alertCount} sample alerts across workspaces`)

  // Create sample Esme messages for each workspace
  for (const ws of [workspace1, workspace2]) {
    // Fetch alerts for this workspace to reference in metadata
    const wsAlerts = await prisma.alert.findMany({
      where: { workspaceId: ws.id, status: 'active' },
      take: 2,
    })

    const baseTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago

    const esmeMessages = [
      {
        workspaceId: ws.id,
        role: 'esme',
        content: `Good morning! I've been reviewing ${ws.name}'s recent activity. There are a few things that need your attention today.`,
        metadata: null,
        createdAt: new Date(baseTime.getTime()),
      },
      {
        workspaceId: ws.id,
        role: 'esme',
        content: `I found a potential issue that needs your review.`,
        metadata: wsAlerts[0] ? JSON.stringify({ alertId: wsAlerts[0].id }) : null,
        createdAt: new Date(baseTime.getTime() + 1 * 60 * 1000), // +1 min
      },
      {
        workspaceId: ws.id,
        role: 'user',
        content: `Thanks Esme, I'll take a look at that. Can you also check if there are any unmatched transactions from this week?`,
        metadata: null,
        createdAt: new Date(baseTime.getTime() + 30 * 60 * 1000), // +30 min
      },
      {
        workspaceId: ws.id,
        role: 'esme',
        content: `Of course! I found 12 unmatched bank transactions from the past 7 days. Most are small recurring charges that could be auto-categorized. Would you like me to suggest categories for them?`,
        metadata: null,
        createdAt: new Date(baseTime.getTime() + 31 * 60 * 1000), // +31 min
      },
      {
        workspaceId: ws.id,
        role: 'user',
        content: `Yes, go ahead and suggest categories. But flag anything over $500 for my review.`,
        metadata: null,
        createdAt: new Date(baseTime.getTime() + 45 * 60 * 1000), // +45 min
      },
      {
        workspaceId: ws.id,
        role: 'esme',
        content: `Got it! I've categorized 9 transactions under $500. Here are 3 that need your review — each is over $500.`,
        metadata: wsAlerts[1] ? JSON.stringify({ alertId: wsAlerts[1].id }) : null,
        createdAt: new Date(baseTime.getTime() + 46 * 60 * 1000), // +46 min
      },
      {
        workspaceId: ws.id,
        role: 'esme',
        content: `Daily digest: ${ws.name} has 5 active alerts, 35 unmatched transactions, and the QuickBooks sync completed successfully this morning. Everything else looks good!`,
        metadata: null,
        createdAt: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000), // +1 day
      },
      {
        workspaceId: ws.id,
        role: 'user',
        content: `What's the total spend on office supplies this month?`,
        metadata: null,
        createdAt: new Date(baseTime.getTime() + 25 * 60 * 60 * 1000), // +25 hours
      },
      {
        workspaceId: ws.id,
        role: 'esme',
        content: `Office supplies total for this month is $1,847.32 across 8 transactions. That's 12% higher than last month ($1,649.00). The biggest line item is a $450 Staples order from last Tuesday.`,
        metadata: null,
        createdAt: new Date(baseTime.getTime() + 25 * 60 * 60 * 1000 + 30 * 1000), // +25 hours 30 sec
      },
    ]

    for (const msg of esmeMessages) {
      await prisma.esmeMessage.create({ data: msg })
    }
  }

  const esmeMessageCount = await prisma.esmeMessage.count()
  console.log(`✅ Created ${esmeMessageCount} Esme messages across workspaces`)

  // Create sample Document records for each workspace
  const sampleDocuments = [
    {
      fileName: 'Chase Bank Statement - January 2024.pdf',
      fileType: 'pdf',
      fileSize: 250880, // ~245 KB
      storagePath: '/uploads/chase-bank-statement-jan-2024.pdf',
      folder: 'Bank Statements',
      parsedContent: 'Chase Business Checking - Statement Period: Jan 1-31, 2024. 47 transactions totaling $24,500.',
      status: 'parsed',
    },
    {
      fileName: 'Receipt - Office Depot #12345.pdf',
      fileType: 'pdf',
      fileSize: 91136, // ~89 KB
      storagePath: '/uploads/receipt-office-depot-12345.pdf',
      folder: 'Receipts',
      parsedContent: 'Office Depot Receipt - Order #12345 - $450.00 - Office Supplies',
      status: 'parsed',
    },
    {
      fileName: 'Invoice #1042 - Client ABC Inc.pdf',
      fileType: 'pdf',
      fileSize: 159744, // ~156 KB
      storagePath: '/uploads/invoice-1042-abc-inc.pdf',
      folder: 'Invoices',
      parsedContent: null,
      status: 'uploaded',
    },
    {
      fileName: 'AWS Receipt - December 2023.pdf',
      fileType: 'pdf',
      fileSize: 114688, // ~112 KB
      storagePath: '/uploads/aws-receipt-dec-2023.pdf',
      folder: 'Receipts',
      parsedContent: null,
      status: 'parsing',
    },
    {
      fileName: 'Employee W2 Scan.png',
      fileType: 'image',
      fileSize: 2048000, // ~2 MB
      storagePath: '/uploads/employee-w2-scan.png',
      folder: null,
      parsedContent: null,
      status: 'error',
    },
    {
      fileName: 'Q4 Expense Report.csv',
      fileType: 'csv',
      fileSize: 45056, // ~44 KB
      storagePath: '/uploads/q4-expense-report.csv',
      folder: 'Reports',
      parsedContent: 'Quarterly expense report with 128 line items.',
      status: 'parsed',
    },
  ]

  for (const ws of [workspace1, workspace2]) {
    for (let i = 0; i < sampleDocuments.length; i++) {
      const doc = sampleDocuments[i]
      await prisma.document.create({
        data: {
          workspaceId: ws.id,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          storagePath: doc.storagePath,
          folder: doc.folder,
          parsedContent: doc.parsedContent,
          status: doc.status,
          uploadedById: user.id,
          createdAt: new Date(Date.now() - (sampleDocuments.length - i) * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  const documentCount = await prisma.document.count()
  console.log(`✅ Created ${documentCount} sample documents across workspaces`)

  // Create sample EsmeConfidence records for each workspace
  // Realistic progression: some categories well-established (tier 2), most at tier 1
  const confidenceRecords = [
    // Category patterns — well-confirmed
    { patternType: 'category', patternKey: 'Payroll', tier: 2, confirmCount: 15, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: false },
    { patternType: 'category', patternKey: 'Rent', tier: 2, confirmCount: 12, correctionCount: 1, lastConfirmedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), lastCorrectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), isLocked: false },
    { patternType: 'category', patternKey: 'Utilities', tier: 2, confirmCount: 10, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: false },
    // Category patterns — learning (tier 1)
    { patternType: 'category', patternKey: 'Office Supplies', tier: 1, confirmCount: 3, correctionCount: 1, lastConfirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), lastCorrectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), isLocked: false },
    { patternType: 'category', patternKey: 'Professional Services', tier: 1, confirmCount: 5, correctionCount: 2, lastConfirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), lastCorrectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), isLocked: false },
    { patternType: 'category', patternKey: 'Bank Fees', tier: 1, confirmCount: 7, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: false },
    { patternType: 'category', patternKey: 'Sales Revenue', tier: 1, confirmCount: 4, correctionCount: 1, lastConfirmedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), lastCorrectedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), isLocked: false },
    { patternType: 'category', patternKey: 'Service Revenue', tier: 1, confirmCount: 2, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: false },
    // Vendor patterns
    { patternType: 'vendor', patternKey: 'Gusto', tier: 2, confirmCount: 14, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: false },
    { patternType: 'vendor', patternKey: 'Staples', tier: 1, confirmCount: 4, correctionCount: 1, lastConfirmedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), lastCorrectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), isLocked: false },
    { patternType: 'vendor', patternKey: 'Chase Bank', tier: 1, confirmCount: 6, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: false },
    // Locked pattern — accountant wants to always be asked about legal fees
    { patternType: 'category', patternKey: 'Accounts Payable', tier: 1, confirmCount: 3, correctionCount: 0, lastConfirmedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), lastCorrectedAt: null, isLocked: true },
  ]

  for (const ws of [workspace1, workspace2]) {
    for (const record of confidenceRecords) {
      await prisma.esmeConfidence.create({
        data: {
          workspaceId: ws.id,
          patternType: record.patternType,
          patternKey: record.patternKey,
          tier: record.tier,
          confirmCount: record.confirmCount,
          correctionCount: record.correctionCount,
          lastConfirmedAt: record.lastConfirmedAt,
          lastCorrectedAt: record.lastCorrectedAt,
          isLocked: record.isLocked,
        },
      })
    }
  }

  const esmeConfidenceCount = await prisma.esmeConfidence.count()
  console.log(`✅ Created ${esmeConfidenceCount} Esme confidence records across workspaces`)

  // Summary
  const userCount = await prisma.user.count()
  const workspaceCount = await prisma.workspace.count()
  const categoryCount = await prisma.category.count()
  const vendorCount = await prisma.vendor.count()
  const transactionCount = await prisma.transaction.count()
  const matchCount = await prisma.match.count()
  const anomalyCount = await prisma.anomaly.count()
  const eventCount = await prisma.event.count()
  const finalAlertCount = await prisma.alert.count()
  const finalEsmeMessageCount = await prisma.esmeMessage.count()
  const finalDocumentCount = await prisma.document.count()
  const finalEsmeConfidenceCount = await prisma.esmeConfidence.count()

  console.log('\n📊 Seed Summary:')
  console.log(`   Users: ${userCount}`)
  console.log(`   Workspaces: ${workspaceCount}`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   Vendors: ${vendorCount}`)
  console.log(`   Transactions: ${transactionCount}`)
  console.log(`   Matches: ${matchCount}`)
  console.log(`   Anomalies: ${anomalyCount}`)
  console.log(`   Events: ${eventCount}`)
  console.log(`   Alerts: ${finalAlertCount}`)
  console.log(`   Esme Messages: ${finalEsmeMessageCount}`)
  console.log(`   Documents: ${finalDocumentCount}`)
  console.log(`   Esme Confidence: ${finalEsmeConfidenceCount}`)
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
