import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    extractedData: {
      accountEnding: '4521',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      transactionCount: 47,
    },
  },
  {
    id: '2',
    name: 'Receipt - Office Depot #12345.pdf',
    type: 'receipt',
    uploadedAt: new Date('2024-01-19T14:30:00'),
    size: '89 KB',
    status: 'matched',
    matchedEvent: 'Matched to $450.00 expense on Jan 15',
    extractedData: {
      vendor: 'Office Depot',
      amount: '$450.00',
      date: '2024-01-15',
    },
  },
  {
    id: '3',
    name: 'Invoice #1042 - Client ABC Inc.pdf',
    type: 'invoice',
    uploadedAt: new Date('2024-01-18T09:15:00'),
    size: '156 KB',
    status: 'matched',
    matchedEvent: 'Matched to $2,500.00 payment on Jan 20',
    extractedData: {
      client: 'Client ABC Inc',
      amount: '$2,500.00',
      invoiceNumber: '1042',
    },
  },
  {
    id: '4',
    name: 'AWS Receipt - December 2023.pdf',
    type: 'receipt',
    uploadedAt: new Date('2024-01-17T11:20:00'),
    size: '112 KB',
    status: 'pending',
    matchedEvent: null,
    extractedData: {
      vendor: 'Amazon Web Services',
      amount: '$1,234.56',
      date: '2023-12-31',
    },
  },
  {
    id: '5',
    name: 'Unknown Document.pdf',
    type: 'other',
    uploadedAt: new Date('2024-01-16T16:45:00'),
    size: '78 KB',
    status: 'unprocessed',
    matchedEvent: null,
    extractedData: null,
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'matched':
      return (
        <Badge
          variant="outline"
          className="bg-green-500/20 text-green-400 border-green-500/30"
        >
          <Check className="h-3 w-3 mr-1" />
          Matched
        </Badge>
      )
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending Match
        </Badge>
      )
    case 'unprocessed':
      return (
        <Badge
          variant="outline"
          className="bg-gray-500/20 text-gray-400 border-gray-500/30"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Unprocessed
        </Badge>
      )
    default:
      return null
  }
}

function getDocTypeLabel(type: string) {
  switch (type) {
    case 'bank_statement':
      return 'Bank Statement'
    case 'receipt':
      return 'Receipt'
    case 'invoice':
      return 'Invoice'
    default:
      return 'Document'
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

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
          { label: 'Entries', href: '/' },
          { label: workspace.name, href: `/workspace/${workspace.id}/event-feed` },
          { label: 'Docs' },
        ]}
        actions={
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl space-y-6">
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

          {/* Documents list */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_120px_120px_140px_80px] gap-4 px-4 py-3 border-b border-border text-sm text-muted-foreground">
                <div>Document</div>
                <div>Type</div>
                <div>Uploaded</div>
                <div>Status</div>
                <div></div>
              </div>

              {/* Document rows */}
              <div className="divide-y divide-border">
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[1fr_120px_120px_140px_80px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.name}
                        </p>
                        {doc.matchedEvent && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {doc.matchedEvent}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {getDocTypeLabel(doc.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
