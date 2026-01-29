import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Tags } from 'lucide-react'
import { CategorizationTable } from './categorization-table'

interface CategorizePageProps {
  params: Promise<{ id: string }>
}

// Mock uncategorized transactions
const mockUncategorizedTransactions = [
  {
    id: '1',
    date: new Date('2024-01-20'),
    description: 'STRIPE PAYOUT - TRANSFER',
    amount: 4970.00,
    source: 'bank',
    suggestedCategory: 'Revenue',
    confidence: 0.92,
    reasoning: 'Pattern matches previous Stripe payouts which were categorized as Revenue.',
  },
  {
    id: '2',
    date: new Date('2024-01-19'),
    description: 'AMAZON WEB SERVICES',
    amount: -1234.56,
    source: 'bank',
    suggestedCategory: 'Cloud Services',
    confidence: 0.98,
    reasoning: 'Vendor "Amazon Web Services" has been consistently categorized as Cloud Services.',
  },
  {
    id: '3',
    date: new Date('2024-01-18'),
    description: 'UBER *TRIP',
    amount: -45.00,
    source: 'bank',
    suggestedCategory: 'Travel & Transportation',
    confidence: 0.85,
    reasoning: 'Uber is typically categorized as Travel & Transportation based on your history.',
  },
  {
    id: '4',
    date: new Date('2024-01-17'),
    description: 'ZOOM VIDEO COM',
    amount: -45.00,
    source: 'bank',
    suggestedCategory: 'Software & Subscriptions',
    confidence: 0.95,
    reasoning: 'Zoom Video Communications matches rule: "Zoom → Software & Subscriptions".',
  },
  {
    id: '5',
    date: new Date('2024-01-16'),
    description: 'CHECK #1042',
    amount: -2500.00,
    source: 'bank',
    suggestedCategory: null,
    confidence: 0,
    reasoning: 'Check payments require manual review. No consistent pattern found.',
  },
  {
    id: '6',
    date: new Date('2024-01-15'),
    description: 'COSTCO WHSE #123',
    amount: -342.67,
    source: 'bank',
    suggestedCategory: 'Office Supplies',
    confidence: 0.72,
    reasoning: 'Previous Costco purchases were split between Office Supplies and Meals. Most recent was Office Supplies.',
  },
  {
    id: '7',
    date: new Date('2024-01-14'),
    description: 'LINKEDIN PREMIUM',
    amount: -59.99,
    source: 'bank',
    suggestedCategory: 'Marketing & Advertising',
    confidence: 0.78,
    reasoning: 'LinkedIn can be Marketing or Software. Recent similar transactions suggest Marketing.',
  },
  {
    id: '8',
    date: new Date('2024-01-13'),
    description: 'DOORDASH ORDER',
    amount: -67.43,
    source: 'bank',
    suggestedCategory: 'Meals & Entertainment',
    confidence: 0.88,
    reasoning: 'Food delivery services are typically Meals & Entertainment.',
  },
]

// Mock categories
const mockCategories = [
  { id: '1', name: 'Revenue', type: 'income' },
  { id: '2', name: 'Cloud Services', type: 'expense' },
  { id: '3', name: 'Travel & Transportation', type: 'expense' },
  { id: '4', name: 'Software & Subscriptions', type: 'expense' },
  { id: '5', name: 'Office Supplies', type: 'expense' },
  { id: '6', name: 'Marketing & Advertising', type: 'expense' },
  { id: '7', name: 'Meals & Entertainment', type: 'expense' },
  { id: '8', name: 'Professional Services', type: 'expense' },
  { id: '9', name: 'Rent & Utilities', type: 'expense' },
  { id: '10', name: 'Payroll', type: 'expense' },
  { id: '11', name: 'Insurance', type: 'expense' },
  { id: '12', name: 'Bank Fees', type: 'expense' },
]

export default async function CategorizePage({ params }: CategorizePageProps) {
  const { id } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        breadcrumbs={[
          { label: 'Entries', href: '/', icon: <Image src="/entries-icon.png" alt="Entries" width={16} height={16} className="h-4 w-4 rounded-[3px]" /> },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed`, icon: <Building2 className="h-4 w-4" /> },
          { label: 'Categorize', icon: <Tags className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="py-4 gap-1">
              <CardContent className="px-4">
                <p className="text-sm text-muted-foreground">Uncategorized</p>
                <p className="text-2xl font-semibold">{mockUncategorizedTransactions.length}</p>
              </CardContent>
            </Card>
            <Card className="py-4 gap-1">
              <CardContent className="px-4">
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-2xl font-semibold text-green-400">
                  {mockUncategorizedTransactions.filter((t) => t.confidence >= 0.9).length}
                </p>
              </CardContent>
            </Card>
            <Card className="py-4 gap-1">
              <CardContent className="px-4">
                <p className="text-sm text-muted-foreground">Needs Review</p>
                <p className="text-2xl font-semibold text-yellow-400">
                  {mockUncategorizedTransactions.filter((t) => t.confidence > 0 && t.confidence < 0.9).length}
                </p>
              </CardContent>
            </Card>
            <Card className="py-4 gap-1">
              <CardContent className="px-4">
                <p className="text-sm text-muted-foreground">No Suggestion</p>
                <p className="text-2xl font-semibold text-red-400">
                  {mockUncategorizedTransactions.filter((t) => t.confidence === 0).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categorization table */}
          <CategorizationTable
            transactions={mockUncategorizedTransactions}
            categories={mockCategories}
          />
        </div>
      </div>
    </div>
  )
}
