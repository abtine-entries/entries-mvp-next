import { Breadcrumb, type BreadcrumbItem } from './breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
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
        'flex h-12 items-center justify-between border-b border-border bg-background px-8',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 !h-4" />
        <Breadcrumb items={breadcrumbs} />
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
