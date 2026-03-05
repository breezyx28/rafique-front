export interface InvoicePayload {
  orderNumber: string
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

export type InvoiceType = 'customer' | 'workshop'

export const money = (v: number) => `${v.toLocaleString()} SDG`

