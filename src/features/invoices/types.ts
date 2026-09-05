export interface InvoicePayload {
  orderNumber: string
  receiptNumber?: string | null
  submittedAt: string
  customerName: string
  customerPhone: string
  dueDate: string
  customerNote: string
  workshopNote: string
  paymentMethod: string
  total: number
  paid: number
  remaining: number
  items: Array<{
    product: string
    qty: number
    unitPrice: number
    subtotal: number
    measurements: Array<{ label: string; value: string }>
  }>
}

export type InvoiceType = 'customer' | 'workshop' | 'pickup'

export { formatMoney as money } from '@/lib/localeFormat'

