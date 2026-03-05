import type { InvoicePayload } from './types'

const LATEST_ORDER_KEY = 'latest-invoice-order'

export const fallbackOrder: InvoicePayload = {
  orderNumber: '00123',
  submittedAt: '2026-03-01',
  customerName: 'Ahmed Ali',
  customerPhone: '09xxxxxxxx',
  dueDate: '2026-03-15',
  customerNote: 'Please bring this receipt when collecting.',
  workshopNote: 'Urgent - use white fabric.',
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
      measurements: [
        { label: 'Height', value: '180 cm' },
        { label: 'Arms', value: '65 cm' },
        { label: 'Neck', value: '42 cm' },
      ],
    },
  ],
}

const invoiceHistorySeed: InvoicePayload[] = [
  fallbackOrder,
  {
    orderNumber: '00124',
    submittedAt: '2026-03-02',
    customerName: 'Musa Ibrahim',
    customerPhone: '0923232323',
    dueDate: '2026-03-18',
    customerNote: 'Call before pickup.',
    workshopNote: 'Loose fitting requested.',
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
        measurements: [
          { label: 'Height', value: '175 cm' },
          { label: 'Shoulder', value: '46 cm' },
          { label: 'Sleeve', value: '63 cm' },
        ],
      },
    ],
  },
  {
    orderNumber: '00125',
    submittedAt: '2026-03-03',
    customerName: 'Sara Osman',
    customerPhone: '0934343434',
    dueDate: '2026-03-10',
    customerNote: '',
    workshopNote: 'Deliver quickly.',
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
        measurements: [
          { label: 'Height', value: '170 cm' },
          { label: 'Arms', value: '60 cm' },
        ],
      },
    ],
  },
]

export function persistLatestInvoiceOrder(order: InvoicePayload) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LATEST_ORDER_KEY, JSON.stringify(order))
}

export function getInvoiceHistory(incomingOrder?: InvoicePayload): InvoicePayload[] {
  const all: InvoicePayload[] = [...invoiceHistorySeed]

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

