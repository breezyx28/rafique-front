export type NumberFormat = 'money' | 'decimal' | 'integer'

export function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.-]/g, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return 0
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function formatGroupedNumber(value: number, format: NumberFormat = 'decimal'): string {
  if (!Number.isFinite(value) || value === 0) return ''
  if (format === 'integer') {
    return Math.round(value).toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: format === 'money' ? 2 : 2,
  })
}

export function formatNumberWhileTyping(raw: string, format: NumberFormat): string {
  if (raw === '' || raw === '-' || raw === '.') return raw

  if (format === 'integer') {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    return Number(digits).toLocaleString('en-US')
  }

  const stripped = raw.replace(/[^\d.]/g, '')
  const trailingDot = stripped.endsWith('.')
  const [intPart = '', ...rest] = stripped.split('.')
  const decimals = rest.join('').slice(0, 2)
  const groupedInt = intPart === '' ? '' : Number(intPart).toLocaleString('en-US')

  if (trailingDot && decimals === '') return `${groupedInt}.`
  if (rest.length > 0) return `${groupedInt}.${decimals}`
  return groupedInt
}
