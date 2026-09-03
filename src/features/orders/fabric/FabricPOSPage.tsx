import { useMemo, useState } from 'react'
import { Scissors, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  useCreateFabricOrderMutation,
  useGetInventoryFabricsQuery,
} from '@/features/api/appApi'

type CartRow = {
  fabricId: number
  name: string
  meters: number
  available: number
  price: number
}

export function FabricPOSPage() {
  const { t } = useTranslation()
  const { data } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [createOrder, { isLoading }] = useCreateFabricOrderMutation()
  const [cart, setCart] = useState<CartRow[]>([])
  const [paid, setPaid] = useState(0)
  const [message, setMessage] = useState('')
  const total = useMemo(
    () => cart.reduce((sum, row) => sum + row.meters * row.price, 0),
    [cart]
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">
          {t('fabricPos.title', 'Fabric Sales')}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {t('fabricPos.subtitle', 'Cut and sell fabric by meter directly from inventory.')}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>{t('fabricPos.available', 'Available fabrics')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.data ?? []).filter((fabric) => fabric.qty > 0).map((fabric) => (
              <button
                key={fabric.id}
                type="button"
                className="rounded-[12px] border border-border p-4 text-left hover:shadow-card"
                onClick={() => {
                  if (cart.some((row) => row.fabricId === fabric.id)) return
                  setCart((rows) => [...rows, {
                    fabricId: fabric.id,
                    name: fabric.name,
                    meters: 1,
                    available: fabric.qty,
                    price: fabric.sellingPricePerMeter,
                  }])
                }}
              >
                <Scissors className="mb-3 h-5 w-5 text-primary" />
                <p className="text-[13px] font-semibold">{fabric.name}</p>
                <p className="text-[12px] text-text-muted">{fabric.qty} m available</p>
                <p className="mt-2 text-[13px] font-semibold text-primary">
                  {fabric.sellingPricePerMeter.toLocaleString()} SDG / m
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('fabricPos.cart', 'Cut list')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cart.map((row) => (
              <div key={row.fabricId} className="rounded-[10px] border border-border p-3">
                <div className="flex justify-between">
                  <p className="text-[13px] font-semibold">{row.name}</p>
                  <button onClick={() => setCart((rows) => rows.filter((item) => item.fabricId !== row.fabricId))}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
                <Input
                  className="mt-2"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={row.available}
                  value={row.meters}
                  onChange={(event) => {
                    const meters = Math.min(row.available, Math.max(0, Number(event.target.value)))
                    setCart((rows) => rows.map((item) => item.fabricId === row.fabricId ? { ...item, meters } : item))
                  }}
                />
              </div>
            ))}
            <div className="rounded-[10px] bg-primary-light p-3">
              <p className="text-[12px] text-text-secondary">Total</p>
              <p className="text-[20px] font-bold text-primary">{total.toLocaleString()} SDG</p>
            </div>
            <Input type="number" min={0} max={total} value={paid} onChange={(event) => setPaid(Number(event.target.value))} />
            <Button
              className="w-full"
              disabled={!cart.length || isLoading || paid < 0 || paid > total}
              onClick={async () => {
                const order = await createOrder({
                  items: cart.map(({ fabricId, meters }) => ({ fabricId, meters })),
                  paid,
                  paymentMethod: 'cash',
                }).unwrap()
                setMessage(`Order #${order.orderNumber} completed`)
                setCart([])
                setPaid(0)
              }}
            >
              {t('fabricPos.checkout', 'Complete fabric sale')}
            </Button>
            {message && <p className="text-[12px] font-medium text-success">{message}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
