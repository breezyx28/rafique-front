import i18n from '@/lib/i18n'
import { formatDate, formatMoney } from '@/lib/localeFormat'
import { formatPaymentMethod } from '@/lib/displayLabels'
import type { InvoicePayload } from '@/features/invoices/types'

/** Normalize local Sudan numbers (09…) and bare 9-digit mobiles to WhatsApp international form. */
export function toWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits || digits.replace(/0/g, '') === '') return null
  if (digits.startsWith('249') && digits.length >= 12) return digits
  if (digits.startsWith('0') && digits.length >= 10) return `249${digits.slice(1)}`
  if (digits.length === 9) return `249${digits}`
  if (digits.length >= 10) return digits
  return null
}

export function buildInvoiceWhatsAppMessage(order: InvoicePayload, invoiceTerms?: string): string {
  const lines = [
    i18n.t('whatsapp.invoiceTitle', { orderNumber: order.orderNumber }),
    i18n.t('whatsapp.customerLine', { name: order.customerName }),
    i18n.t('whatsapp.dateLine', { date: formatDate(order.submittedAt) }),
    i18n.t('whatsapp.dueLine', { dueDate: formatDate(order.dueDate) }),
    i18n.t('whatsapp.totalLine', { amount: formatMoney(order.total) }),
    i18n.t('whatsapp.paidLine', { amount: formatMoney(order.paid) }),
    i18n.t('whatsapp.remainingLine', { amount: formatMoney(order.remaining) }),
    i18n.t('whatsapp.methodLine', { method: formatPaymentMethod(order.paymentMethod) }),
  ]

  if (order.receiptNumber) {
    lines.splice(1, 0, i18n.t('whatsapp.receiptLine', { number: order.receiptNumber }))
  }

  const products = order.items.map((item) => `${item.product} × ${item.qty}`).filter(Boolean)
  if (products.length) {
    lines.push(i18n.t('whatsapp.itemsLine', { items: products.join(', ') }))
  }

  if (invoiceTerms?.trim()) {
    lines.push('', i18n.t('whatsapp.termsHeading'), invoiceTerms.trim())
  }

  return lines.join('\n')
}

export function openInvoiceWhatsApp(
  phone: string | null | undefined,
  order: InvoicePayload,
  invoiceTerms?: string
): boolean {
  const waPhone = toWhatsAppPhone(phone)
  if (!waPhone) return false
  const text = buildInvoiceWhatsAppMessage(order, invoiceTerms)
  const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
