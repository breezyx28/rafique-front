import { create } from 'zustand'

export interface CartItem {
  productId: number
  productName: string
  qty: number
  unitPrice: number
  subtotal: number
  measurements?: Record<number, string>
  inventoryItemId?: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'subtotal'>) => void
  updateQty: (productId: number, qty: number) => void
  removeItem: (productId: number) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const subtotal = item.unitPrice * item.qty
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId && (item.inventoryItemId ? i.inventoryItemId === item.inventoryItemId : true))
      if (existing) {
        const newQty = existing.qty + item.qty
        return {
          items: state.items.map((i) =>
            i === existing ? { ...i, qty: newQty, subtotal: i.unitPrice * newQty } : i
          ),
        }
      }
      return { items: [...state.items, { ...item, subtotal }] }
    })
  },
  updateQty: (productId, qty) => {
    if (qty <= 0) return get().removeItem(productId)
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, qty, subtotal: i.unitPrice * qty } : i
      ),
    }))
  },
  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
  },
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
}))
