import i18n from './i18n'

const exactMessages: Record<string, string> = {
  'At least one custom product is required': 'errors.customProductRequired',
  'At least one ready product is required': 'errors.readyProductRequired',
  'At least one fabric is required': 'errors.fabricRequired',
  'A registered customer is required': 'errors.customerRequired',
  'Paid amount must be between zero and total': 'errors.paidRange',
  'Order not found': 'errors.orderNotFound',
  'Only custom orders can go to workshop': 'errors.customWorkshopOnly',
  'Order is not in the workshop': 'errors.orderNotInWorkshop',
  'Order has not been delivered to workshop': 'errors.orderNotDelivered',
  'Username already exists': 'errors.usernameExists',
  'Invalid credentials': 'errors.invalidCredentials',
  'Customer not found': 'errors.customerNotFound',
  'Product not found': 'errors.productNotFound',
  'Inventory item not found': 'errors.inventoryItemNotFound',
  'Fabric not found': 'errors.fabricMissing',
  'Expense not found': 'errors.expenseNotFound',
  'Field not found': 'errors.fieldNotFound',
  'Only ready products can be stocked': 'errors.readyStockOnly',
  'Created user not found': 'errors.createdUserNotFound',
  'Customer can collect the order only after it is ready for pickup': 'errors.collectOnlyWhenReady',
  'Fabric and meters can be changed only before workshop delivery': 'errors.fabricLockedAfterWorkshop',
  'Every order item must have fabric and meters before workshop delivery': 'errors.fabricMetersRequired',
  'Undo window expired. Delete the order to start again.': 'errors.undoExpired',
  'Order item not found': 'errors.orderItemMissing',
}

export function translateApiMessage(raw: unknown): string {
  const first = Array.isArray(raw) ? raw[0] : raw
  if (!first || first === 'Rejected') return i18n.t('errors.generic')
  const text = String(first)
  const exactKey = exactMessages[text]
  if (exactKey) return i18n.t(exactKey)

  const insufficient = text.match(/^Insufficient meters for (.+)$/)
  if (insufficient) return i18n.t('errors.insufficientMeters', { name: insufficient[1] })

  const fabric = text.match(/^Fabric (.+) not found$/)
  if (fabric) return i18n.t('errors.fabricNotFoundNamed', { name: fabric[1] })

  const orderItem = text.match(/^Order item (.+) not found$/)
  if (orderItem) return i18n.t('errors.orderItemNotFound', { name: orderItem[1] })

  const inventoryItem = text.match(/^Inventory item (.+) not found$/)
  if (inventoryItem) return i18n.t('errors.inventoryItemNotFoundNamed', { name: inventoryItem[1] })

  const insufficientStock = text.match(/^Insufficient stock for inventory item (.+)$/)
  if (insufficientStock) return i18n.t('errors.insufficientStock', { name: insufficientStock[1] })

  return text
}
