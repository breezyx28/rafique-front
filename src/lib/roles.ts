export type AppRole = 'Admin' | 'Cashier' | 'Workshop' | string

const cashierPrefixes = [
  '/orders',
  '/customers',
  '/invoices',
]

export function isAdmin(role?: AppRole) {
  return role === 'Admin'
}

export function isCashier(role?: AppRole) {
  return role === 'Cashier'
}

export function isWorkshop(role?: AppRole) {
  return role === 'Workshop'
}

export function canAccessPath(role: AppRole | undefined, pathname: string) {
  if (!role || role === 'Admin') return true
  if (role === 'Workshop') return pathname === '/workshop/orders'
  if (role === 'Cashier') {
    return cashierPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  }
  return false
}

export function cashierHome() {
  return '/orders/new'
}

export function workshopHome() {
  return '/workshop/orders'
}
