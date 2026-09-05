import i18n from './i18n'
import { usePreferenceStore, type DateFormat } from '@/store/usePreferenceStore'

export function localeTag(): string {
  const lang = (i18n.language || 'en').split('-')[0]
  if (lang === 'ar') return 'ar'
  if (lang === 'bn') return 'bn-BD'
  return 'en-US'
}

export function formatCount(value: number): string {
  return Number(value || 0).toLocaleString(localeTag())
}

export function formatMoney(value: number, currency?: string): string {
  const code = currency || usePreferenceStore.getState().currency || 'SDG'
  const label = code === 'SDG' ? i18n.t('common.currency', { defaultValue: 'SDG' }) : code
  return `${formatCount(value)} ${label}`
}

export function formatShortMonth(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString(localeTag(), { month: 'short' })
}

export function getDateFormat(): DateFormat {
  return usePreferenceStore.getState().dateFormat === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'
}

export function formatDate(value?: string | null): string {
  if (!value || value === '—') return '—'
  const iso = String(value).slice(0, 10)
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return String(value)
  const [, year, month, day] = match
  return getDateFormat() === 'DD/MM/YYYY' ? `${day}/${month}/${year}` : `${year}-${month}-${day}`
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = formatDate(value)
  const timeMatch = String(value).match(/T(\d{2}:\d{2})/)
  return timeMatch ? `${date} ${timeMatch[1]}` : date
}
