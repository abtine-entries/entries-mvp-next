import { Breadcrumb, type BreadcrumbItem } from './breadcrumb'
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
        'flex h-12 items-center justify-between border-b border-border bg-background px-6',
        className
      )}
    >
      <Breadcrumb items={breadcrumbs} />
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
