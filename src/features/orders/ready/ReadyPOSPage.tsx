import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateReadyOrderMutation, useGetInventoryItemsQuery } from '@/features/api/appApi'

type PaymentMethod = 'Cash' | 'MBOK'

interface ReadyProduct {
  id: number
  name: string
  size: string
  stock: number
  price: number
  inventoryItemId: number
}

interface CartItem extends ReadyProduct {
  qty: number
}

const money = (v: number) => `${v.toLocaleString()} SDG`

export function ReadyPOSPage() {
  const { t } = useTranslation()
  const { data } = useGetInventoryItemsQuery({ page: 1, limit: 100 })
  const [createReadyOrder, { isLoading: isSubmitting }] = useCreateReadyOrderMutation()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [receivedAmount, setReceivedAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [dueDate, setDueDate] = useState('')

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.data ?? [])
      .map((item) => ({
        id: item.id,
        inventoryItemId: item.id,
        name: item.product?.name ?? t('orders.ready.defaultProductName', 'Ready product'),
        size: item.size ?? '—',
        stock: item.qty,
        price: item.price,
      }))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.size.toLowerCase().includes(q))
  }, [data?.data, search])

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.qty * i.price, 0), [cart])
  const remaining = Math.max(0, total - receivedAmount)

  const addToCart = (product: ReadyProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const changeQty = (id: number, nextQty: number) => {
    if (nextQty < 1) return
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">
          {t('orders.ready.title', 'Ready Products POS')}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {t('orders.ready.subtitle', 'Sell ready stock items quickly with live cart and checkout summary.')}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('orders.ready.productsTitle', 'In-stock Products')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('orders.ready.searchPlaceholder', 'Search by product name or size')}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className="rounded-[12px] border border-border p-3 text-left transition hover:shadow-card"
                >
                  <div
                    className="mb-2 flex h-24 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: 'var(--card-mint)' }}
                  >
                    <ShoppingBag className="h-7 w-7 text-text-secondary" />
                  </div>
                  <p className="text-[13px] font-semibold text-text-primary">{p.name}</p>
                  <p className="mt-0.5 text-[12px] text-text-muted">
                    {t('orders.ready.size', 'Size')} {p.size} · {t('orders.ready.stock', 'Stock')} {p.stock}
                  </p>
                  <p className="mt-2 text-[14px] font-bold text-primary">{money(p.price)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('orders.ready.cartTitle', 'Cart & Checkout')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 && (
              <p className="text-[13px] text-text-muted">
                {t('orders.ready.cartEmpty', 'Cart is empty. Add products from the grid.')}
              </p>
            )}
            {cart.map((item) => (
              <div key={item.id} className="rounded-[10px] border border-border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">{item.name}</p>
                    <p className="text-[12px] text-text-muted">
                      {t('orders.ready.size', 'Size')} {item.size} · {money(item.price)}
                    </p>
                  </div>
                  <button type="button" onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}>
                    <Trash2 className="h-4 w-4 text-text-muted hover:text-danger" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, item.qty - 1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-[13px] font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, item.qty + 1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[13px] font-semibold text-text-primary">{money(item.qty * item.price)}</p>
                </div>
              </div>
            ))}

            <div className="rounded-[10px] bg-[#FAFAFA] p-3 space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">{t('orders.ready.total', 'Total')}</span>
                <span className="font-semibold text-text-primary">{money(total)}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-text-secondary">
                  {t('orders.ready.receivedAmount', 'Received Amount')}
                </label>
                <Input type="number" min={0} value={receivedAmount} onChange={(e) => setReceivedAmount(Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">{t('orders.ready.remaining', 'Remaining')}</span>
                <span className={`font-semibold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>{money(remaining)}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-text-secondary">
                  {t('orders.ready.paymentMethod', 'Payment Method')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                >
                  <option value="Cash">{t('orders.ready.cash', 'Cash')}</option>
                  <option value="MBOK">{t('orders.ready.mbok', 'MBOK')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-text-secondary">
                  {t('orders.ready.dueDate', 'Due Date')}
                </label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <Button
                className="mt-2 w-full"
                disabled={cart.length === 0 || isSubmitting}
                onClick={async () => {
                  if (!cart.length) return
                  await createReadyOrder({
                    items: cart.map((item) => ({
                      inventoryItemId: item.inventoryItemId,
                      qty: item.qty,
                      unitPrice: item.price,
                    })),
                    total,
                    paid: receivedAmount,
                    paymentMethod: paymentMethod.toLowerCase() as 'cash' | 'mbok',
                    dueDate: dueDate || undefined,
                  })
                  setCart([])
                  setReceivedAmount(0)
                  setDueDate('')
                }}
              >
                {t('orders.ready.checkout', 'Checkout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

