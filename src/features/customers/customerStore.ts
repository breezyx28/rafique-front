export interface CustomerMeasurement {
  label: string
  value: string
}

export interface CustomerRecord {
  id: string
  name: string
  phone: string
  ordersCount: number
  totalSpent: number
  lastOrderDate: string
  measurements: CustomerMeasurement[]
}

const STORAGE_KEY = 'customers-store-v1'

const seedCustomers: CustomerRecord[] = [
  {
    id: 'c-001',
    name: 'Ahmed Ali',
    phone: '0912121212',
    ordersCount: 18,
    totalSpent: 220000,
    lastOrderDate: '2026-03-01',
    measurements: [
      { label: 'Height', value: '180 cm' },
      { label: 'Arms', value: '65 cm' },
      { label: 'Neck', value: '42 cm' },
    ],
  },
  {
    id: 'c-002',
    name: 'Musa Ibrahim',
    phone: '0923232323',
    ordersCount: 11,
    totalSpent: 142000,
    lastOrderDate: '2026-02-28',
    measurements: [
      { label: 'Height', value: '176 cm' },
      { label: 'Waist', value: '38 in' },
    ],
  },
  {
    id: 'c-003',
    name: 'Sara Osman',
    phone: '0934343434',
    ordersCount: 9,
    totalSpent: 98000,
    lastOrderDate: '2026-02-27',
    measurements: [
      { label: 'Height', value: '170 cm' },
      { label: 'Shoulder', value: '44 cm' },
    ],
  },
  {
    id: 'c-004',
    name: 'Yaser Adam',
    phone: '0945454545',
    ordersCount: 5,
    totalSpent: 56000,
    lastOrderDate: '2026-02-24',
    measurements: [
      { label: 'Height', value: '168 cm' },
      { label: 'Hip', value: '41 in' },
    ],
  },
  {
    id: 'c-005',
    name: 'Hind Abdelrahman',
    phone: '0956565656',
    ordersCount: 6,
    totalSpent: 79000,
    lastOrderDate: '2026-02-22',
    measurements: [
      { label: 'Height', value: '172 cm' },
      { label: 'Arms', value: '61 cm' },
    ],
  },
]

export function getCustomers(): CustomerRecord[] {
  if (typeof window === 'undefined') return seedCustomers
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return seedCustomers
  try {
    const parsed = JSON.parse(raw) as CustomerRecord[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedCustomers
  } catch {
    return seedCustomers
  }
}

export function saveCustomers(customers: CustomerRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

