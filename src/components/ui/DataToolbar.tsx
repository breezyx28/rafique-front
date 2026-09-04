import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export const toolbarSelectClass =
  'h-10 w-full cursor-pointer rounded-[6px] border border-border bg-white px-3 text-[13px] text-text-primary'

export function FilterToolbar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  )
}

export function ToolbarField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label className="mb-1 block text-[12px] font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <ToolbarField label={label} className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </ToolbarField>
  )
}

export function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
  label = 'rows',
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  label?: string
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-text-muted">
        Showing page {page} of {totalPages} · {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
