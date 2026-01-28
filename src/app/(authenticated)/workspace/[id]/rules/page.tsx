import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, BookOpen } from 'lucide-react'

interface RulesPageProps {
  params: Promise<{ id: string }>
}

export default async function RulesPage({ params }: RulesPageProps) {
  const { id } = await params

  const rules = await prisma.rule.findMany({
    where: { workspaceId: id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categorization Rules</h2>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Rules ({rules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No rules yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create categorization rules to automatically categorize
                transactions based on patterns like vendor names or descriptions.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Rule</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Match Count</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      <span className="line-clamp-2">{rule.ruleText}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {rule.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rule.matchCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {rule.isActive ? (
                        <Badge className="bg-green-600 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
