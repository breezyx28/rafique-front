import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.ComponentProps<'input'> & {
  label?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const input = (
      <input
        id={inputId}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[6px] border border-border bg-surface px-3 py-2 text-[13px] text-text-primary shadow-sm transition-colors ring-offset-app placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!label) return input

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-[12px] font-medium text-text-secondary">
          {label}
        </label>
        {input}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
