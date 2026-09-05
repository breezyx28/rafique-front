import { localeTag } from './localeFormat'

export type NumberFormat = 'money' | 'decimal' | 'integer'

const groupingChars = /[,\s،٬]/g

function groupedInteger(value: number): string {
  return Math.round(value).toLocaleString(localeTag(), {
    numberingSystem: 'latn',
    useGrouping: true,
    maximumFractionDigits: 0,
  })
}

export function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(groupingChars, '').replace(/٫/g, '.').replace(/[^\d.-]/g, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return 0
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function formatGroupedNumber(value: number, format: NumberFormat = 'decimal'): string {
  if (!Number.isFinite(value) || value === 0) return ''
  if (format === 'integer') return groupedInteger(value)
  return value.toLocaleString(localeTag(), {
    numberingSystem: 'latn',
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatNumberWhileTyping(raw: string, format: NumberFormat): string {
  if (raw === '' || raw === '-' || raw === '.') return raw

  if (format === 'integer') {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    return groupedInteger(Number(digits))
  }

  const stripped = raw.replace(groupingChars, '').replace(/٫/g, '.').replace(/[^\d.]/g, '')
  const trailingDot = stripped.endsWith('.')
  const [intPart = '', ...rest] = stripped.split('.')
  const decimals = rest.join('').slice(0, 2)
  const groupedInt = intPart === '' ? '' : groupedInteger(Number(intPart))

  if (trailingDot && decimals === '') return `${groupedInt}.`
  if (rest.length > 0) return `${groupedInt}.${decimals}`
  return groupedInt
}
