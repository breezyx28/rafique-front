import i18n from '@/lib/i18n'
import type { InvoicePayload } from './types'

const LATEST_ORDER_KEY = 'latest-invoice-order'

function seedOrder(
  order: InvoicePayload,
  notes: { customerNote: string; workshopNote: string },
  measurements: InvoicePayload['items'][number]['measurements']
): InvoicePayload {
  return {
    ...order,
    customerNote: notes.customerNote,
    workshopNote: notes.workshopNote,
    paymentMethod: order.paymentMethod === 'MBOK' ? i18n.t('orders.mbok') : i18n.t('orders.cash'),
    items: order.items.map((item, index) =>
      index === 0 ? { ...item, measurements } : item
    ),
  }
}

function localizedSeedOrders(): InvoicePayload[] {
  const cm = i18n.t('invoiceSeed.cm')
  return [
    seedOrder(
      {
        orderNumber: '00123',
        submittedAt: '2026-03-01',
        customerName: 'Ahmed Ali',
        customerPhone: '09xxxxxxxx',
        dueDate: '2026-03-15',
        customerNote: '',
        workshopNote: '',
        paymentMethod: 'Cash',
        total: 500,
        paid: 300,
        remaining: 200,
        items: [
          {
            product: 'Jelabeya',
            qty: 1,
            unitPrice: 500,
            subtotal: 500,
            measurements: [],
          },
        ],
      },
      {
        customerNote: i18n.t('invoiceSeed.bringReceipt'),
        workshopNote: i18n.t('invoiceSeed.urgentWhite'),
      },
      [
        { label: i18n.t('invoiceSeed.height'), value: `180 ${cm}` },
        { label: i18n.t('invoiceSeed.arms'), value: `65 ${cm}` },
        { label: i18n.t('invoiceSeed.neck'), value: `42 ${cm}` },
      ]
    ),
    seedOrder(
      {
        orderNumber: '00124',
        submittedAt: '2026-03-02',
        customerName: 'Musa Ibrahim',
        customerPhone: '0923232323',
        dueDate: '2026-03-18',
        customerNote: '',
        workshopNote: '',
        paymentMethod: 'MBOK',
        total: 22000,
        paid: 22000,
        remaining: 0,
        items: [
          {
            product: 'Allala',
            qty: 2,
            unitPrice: 11000,
            subtotal: 22000,
            measurements: [],
          },
        ],
      },
      {
        customerNote: i18n.t('invoiceSeed.callBeforePickup'),
        workshopNote: i18n.t('invoiceSeed.looseFitting'),
      },
      [
        { label: i18n.t('invoiceSeed.height'), value: `175 ${cm}` },
        { label: i18n.t('invoiceSeed.shoulder'), value: `46 ${cm}` },
        { label: i18n.t('invoiceSeed.sleeve'), value: `63 ${cm}` },
      ]
    ),
    seedOrder(
      {
        orderNumber: '00125',
        submittedAt: '2026-03-03',
        customerName: 'Sara Osman',
        customerPhone: '0934343434',
        dueDate: '2026-03-10',
        customerNote: '',
        workshopNote: i18n.t('invoiceSeed.deliverQuickly'),
        paymentMethod: 'Cash',
        total: 12000,
        paid: 10000,
        remaining: 2000,
        items: [
          {
            product: 'Ready Jelabeya',
            qty: 1,
            unitPrice: 12000,
            subtotal: 12000,
            measurements: [],
          },
        ],
      },
      {
        customerNote: '',
        workshopNote: i18n.t('invoiceSeed.deliverQuickly'),
      },
      [
        { label: i18n.t('invoiceSeed.height'), value: `170 ${cm}` },
        { label: i18n.t('invoiceSeed.arms'), value: `60 ${cm}` },
      ]
    ),
  ]
}

export const fallbackOrder: InvoicePayload = localizedSeedOrders()[0]

export function persistLatestInvoiceOrder(order: InvoicePayload) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LATEST_ORDER_KEY, JSON.stringify(order))
}

export function getInvoiceHistory(incomingOrder?: InvoicePayload): InvoicePayload[] {
  const all: InvoicePayload[] = [...localizedSeedOrders()]

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LATEST_ORDER_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as InvoicePayload
        all.unshift(parsed)
      } catch {
        // Ignore parse failures and keep seed data.
      }
    }
  }

  if (incomingOrder) all.unshift(incomingOrder)

  const unique = new Map<string, InvoicePayload>()
  all.forEach((order) => {
    if (!unique.has(order.orderNumber)) unique.set(order.orderNumber, order)
  })
  return Array.from(unique.values())
}

export function getInvoiceByOrderNumber(orderNumber: string, incomingOrder?: InvoicePayload) {
  return getInvoiceHistory(incomingOrder).find((o) => o.orderNumber === orderNumber)
}
