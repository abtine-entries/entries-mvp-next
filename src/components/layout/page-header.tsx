import { Breadcrumb, type BreadcrumbItem } from './breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { EsmeHeaderPresence } from '@/components/esme/esme-header-presence'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-8',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 !h-4" />
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <EsmeHeaderPresence />
      </div>
    </header>
  )
}
