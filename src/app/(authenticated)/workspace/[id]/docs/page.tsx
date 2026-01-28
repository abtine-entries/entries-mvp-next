import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  FileText,
  Upload,
  Search,
  Filter,
} from 'lucide-react'
import { DocsDataTable } from './docs-data-table'

interface DocsPageProps {
  params: Promise<{ id: string }>
}

// Mock documents
const mockDocuments = [
  {
    id: '1',
    name: 'Chase Bank Statement - January 2024.pdf',
    type: 'bank_statement',
    uploadedAt: new Date('2024-01-20T10:00:00'),
    size: '245 KB',
    status: 'matched',
    matchedEvent: 'Matched to 47 transactions',
  },
  {
    id: '2',
    name: 'Receipt - Office Depot #12345.pdf',
    type: 'receipt',
    uploadedAt: new Date('2024-01-19T14:30:00'),
    size: '89 KB',
    status: 'matched',
    matchedEvent: 'Matched to $450.00 expense on Jan 15',
  },
  {
    id: '3',
    name: 'Invoice #1042 - Client ABC Inc.pdf',
    type: 'invoice',
    uploadedAt: new Date('2024-01-18T09:15:00'),
    size: '156 KB',
    status: 'matched',
    matchedEvent: 'Matched to $2,500.00 payment on Jan 20',
  },
  {
    id: '4',
    name: 'AWS Receipt - December 2023.pdf',
    type: 'receipt',
    uploadedAt: new Date('2024-01-17T11:20:00'),
    size: '112 KB',
    status: 'pending',
    matchedEvent: null,
  },
  {
    id: '5',
    name: 'Unknown Document.pdf',
    type: 'other',
    uploadedAt: new Date('2024-01-16T16:45:00'),
    size: '78 KB',
    status: 'unprocessed',
    matchedEvent: null,
  },
]

export default async function DocsPage({ params }: DocsPageProps) {
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
          { label: 'Docs', icon: <FileText className="h-4 w-4" /> },
        ]}
        actions={
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Upload area */}
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Drop files here to upload</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supported formats: PDF, PNG, JPG. Max file size: 10MB.
              </p>
              <Button variant="outline">Browse files</Button>
            </CardContent>
          </Card>

          {/* Documents table */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <DocsDataTable data={mockDocuments} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
