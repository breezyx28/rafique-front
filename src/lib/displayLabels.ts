import i18n from './i18n'

export function formatPaymentMethod(method?: string | null): string {
  const value = String(method ?? 'cash').toLowerCase()
  if (value === 'mbok') return i18n.t('orders.mbok')
  if (value === 'cash') return i18n.t('orders.cash')
  return method || '—'
}

export function formatOrderStatus(status?: string | null): string {
  const value = String(status ?? 'pending')
  const key = `dashboard.status.${value}`
  const translated = i18n.t(key)
  return translated === key ? value : translated
}

export function getFieldLabel(
  field?: { fieldKey?: string; i18n?: Array<{ lang: string; label: string }> } | null,
): string {
  const fallback = i18n.t('invoiceDetailsPage.measurement')
  if (!field) return fallback
  const current = (i18n.language || 'en').slice(0, 2)
  const entry =
    field.i18n?.find((item) => item.lang === current) ??
    field.i18n?.find((item) => item.lang === 'en') ??
    field.i18n?.[0]
  return entry?.label ?? field.fieldKey ?? fallback
}

export function formatOrderType(type?: string | null): string {
  const value = String(type ?? 'custom')
  const key = `dashboard.type.${value}`
  const translated = i18n.t(key)
  return translated === key ? value : translated
}

function extractOrderNumber(title: string): string {
  return title.match(/#([A-Za-z0-9-]+)/)?.[1] ?? ''
}

function extractStock(title: string): { name: string; qty: string } | null {
  const patterns = [
    /^Low stock:\s*(.+)\s*\(qty\s*(.+)\)$/i,
    /^مخزون منخفض:\s*(.+)\s*\(الكمية\s*(.+)\)$/,
    /^কম স্টক:\s*(.+)\s*\(পরিমাণ\s*(.+)\)$/,
  ]
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) return { name: match[1], qty: match[2] }
  }
  return null
}

function extractCustomer(subtitle?: string | null): string | null {
  if (!subtitle) return null
  const patterns = [/^Customer:\s*(.+)$/i, /^العميل:\s*(.+)$/, /^গ্রাহক:\s*(.+)$/]
  for (const pattern of patterns) {
    const match = subtitle.match(pattern)
    if (match) return match[1]
  }
  return null
}

function isFollowUp(subtitle?: string | null): boolean {
  if (!subtitle) return true
  return [
    /follow up with the customer/i,
    /تابع مع العميل/,
    /গ্রাহকের সাথে যোগাযোগ/,
  ].some((pattern) => pattern.test(subtitle))
}

export function localizeNotification(input: {
  title: string
  subtitle?: string | null
  kind: 'due' | 'stock'
  window?: string | null
}): { title: string; subtitle: string } {
  if (input.kind === 'stock') {
    const stock = extractStock(input.title)
    return {
      title: stock
        ? i18n.t('notifications.lowStock', { name: stock.name, qty: stock.qty })
        : input.title,
      subtitle: i18n.t('notifications.inventoryAlert'),
    }
  }

  const orderNumber = extractOrderNumber(input.title)
  const dueKey =
    input.window === 'due_in_2'
      ? 'notifications.dueIn2'
      : input.window === 'due_tomorrow'
        ? 'notifications.dueTomorrow'
        : input.window === 'due_today'
          ? 'notifications.dueToday'
          : input.window === 'overdue'
            ? 'notifications.overdue'
            : ''
  const title = dueKey && orderNumber ? i18n.t(dueKey, { orderNumber }) : input.title

  const customer = extractCustomer(input.subtitle)
  const subtitle = customer
    ? i18n.t('notifications.customer', { name: customer })
    : isFollowUp(input.subtitle)
      ? i18n.t('notifications.followUp')
      : input.subtitle ?? i18n.t('notifications.followUp')

  return { title, subtitle }
}
