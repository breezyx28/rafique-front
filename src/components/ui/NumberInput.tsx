import * as React from 'react'
import { Input, type InputProps } from '@/components/ui/Input'
import {
  formatGroupedNumber,
  formatNumberWhileTyping,
  parseFormattedNumber,
  type NumberFormat,
} from '@/lib/numberFormat'
import { cn } from '@/lib/utils'

type NumberInputProps = Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange'> & {
  value: number | string
  onValueChange: (value: number) => void
  format?: NumberFormat
}

export function NumberInput({
  value,
  onValueChange,
  format = 'decimal',
  min,
  max,
  onFocus,
  onBlur,
  className,
  placeholder,
  ...props
}: NumberInputProps) {
  const numericValue = Number(value) || 0
  const [focused, setFocused] = React.useState(false)
  const [draft, setDraft] = React.useState('')

  React.useEffect(() => {
    if (!focused) {
      setDraft(formatGroupedNumber(numericValue, format))
    }
  }, [focused, format, numericValue])

  const clamp = (next: number) => {
    let result = next
    if (min != null && min !== '' && Number.isFinite(Number(min))) {
      result = Math.max(Number(min), result)
    }
    if (max != null && max !== '' && Number.isFinite(Number(max))) {
      result = Math.min(Number(max), result)
    }
    return result
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={format === 'integer' ? 'numeric' : 'decimal'}
      autoComplete="off"
      dir="ltr"
      placeholder={placeholder ?? '0'}
      value={focused ? draft : formatGroupedNumber(numericValue, format)}
      className={cn('tabular-nums', className)}
      onFocus={(event) => {
        setFocused(true)
        if (numericValue === 0) {
          setDraft('')
        } else {
          setDraft(formatGroupedNumber(numericValue, format))
          requestAnimationFrame(() => event.currentTarget.select())
        }
        onFocus?.(event)
      }}
      onChange={(event) => {
        const nextDraft = formatNumberWhileTyping(event.target.value, format)
        setDraft(nextDraft)
        onValueChange(parseFormattedNumber(nextDraft))
      }}
      onBlur={(event) => {
        setFocused(false)
        onValueChange(clamp(parseFormattedNumber(draft)))
        onBlur?.(event)
      }}
    />
  )
}
