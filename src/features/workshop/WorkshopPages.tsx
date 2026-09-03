import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  useGetInventoryFabricsQuery,
  useGetWorkshopOrdersQuery,
  useGetWorkshopPayrollQuery,
  useSetWorkshopItemReadinessMutation,
  useUpdateFabricMutation,
} from '@/features/api/appApi'

const money = (value: number) => `${value.toLocaleString()} SDG`

export function DeliveredOrdersPage() {
  const { t } = useTranslation()
  const { data: orders, isLoading } = useGetWorkshopOrdersQuery()
  const [setReadiness, { isLoading: isUpdating }] = useSetWorkshopItemReadinessMutation()

  return (
    <WorkshopShell title={t('workshop.delivered', 'Delivered Orders')}>
      <div className="space-y-4">
        {isLoading && <p className="text-[13px] text-text-muted">Loading…</p>}
        {(orders ?? []).map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>#{order.orderNumber} · {order.customer?.name ?? 'Walk-in'}</CardTitle>
                <p className="text-[12px] text-text-muted">{order.noteWorkshop || 'No workshop note'}</p>
              </div>
              {order.receiptNumber && (
                <span className="rounded-full bg-successBg px-3 py-1 text-[11px] font-semibold text-success">
                  {order.receiptNumber}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-[10px] border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold">{item.product?.name}</p>
                      <p className="text-[12px] text-text-muted">
                        {item.fabricConsumptions.map((row) => `${row.fabric?.name}: ${row.meters}m`).join(' · ')}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-[12px] font-semibold">
                      <input
                        type="checkbox"
                        checked={item.workshopStatus === 'ready'}
                        disabled={isUpdating}
                        onChange={(event) => setReadiness({ id: item.id!, ready: event.target.checked })}
                      />
                      {item.workshopStatus === 'ready' ? 'Ready' : 'Not ready'}
                    </label>
                  </div>
                  <div className="mt-3 grid gap-1 sm:grid-cols-3">
                    {item.measurements.map((measurement) => (
                      <p key={measurement.id ?? measurement.fieldId} className="text-[12px]">
                        <span className="text-text-muted">{measurement.field?.fieldKey}:</span>{' '}
                        {measurement.value}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {!isLoading && !orders?.length && (
          <Card><CardContent className="pt-5 text-[13px] text-text-muted">No orders delivered to workshop.</CardContent></Card>
        )}
      </div>
    </WorkshopShell>
  )
}

export function SewingPricingPage() {
  const { data: fabrics } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [updateFabric] = useUpdateFabricMutation()

  return (
    <WorkshopShell title="Sewing Pricing">
      <Card>
        <CardHeader>
          <CardTitle>Tailor charge per sewn meter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[13px] text-text-secondary">
            This is the tailor rate only. Fabric package prices are managed in Inventory.
          </p>
          {(fabrics?.data ?? []).map((fabric) => (
            <PricingRow
              key={fabric.id}
              label={fabric.name}
              value={fabric.sewingRatePerMeter}
              onSave={(value) => updateFabric({ id: fabric.id, body: { sewingRatePerMeter: value } })}
            />
          ))}
        </CardContent>
      </Card>
    </WorkshopShell>
  )
}

export function TailorPaymentPage() {
  const { data } = useGetWorkshopPayrollQuery()
  return (
    <WorkshopShell title="Tailor Payment">
      <Card>
        <CardHeader><CardTitle>Shared workshop payroll pool</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-[13px]">
            <thead><tr className="text-left text-[12px] text-text-muted"><th className="py-3">Fabric</th><th>Meters completed</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>
              {(data?.breakdown ?? []).map((row) => (
                <tr key={row.fabricId} className="border-t border-border">
                  <td className="py-3 font-semibold">{row.fabricName}</td>
                  <td>{row.meters}</td><td>{money(row.rate)}</td><td className="font-semibold">{money(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 rounded-[10px] bg-primary-light p-4 text-right">
            <span className="text-[12px] text-text-secondary">Total accrued </span>
            <span className="text-[20px] font-bold text-primary">{money(data?.total ?? 0)}</span>
          </div>
        </CardContent>
      </Card>
    </WorkshopShell>
  )
}

export function WorkshopProductivityPage() {
  const { data: orders } = useGetWorkshopOrdersQuery()
  return (
    <WorkshopShell title="Workshop Productivity">
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          <table className="min-w-[900px] w-full text-[13px]">
            <thead><tr className="text-left text-[12px] text-text-muted"><th className="py-3">Order</th><th>Product</th><th>Status</th><th>Fabric</th><th>Consumed</th><th>Remaining</th><th>Ready date</th></tr></thead>
            <tbody>
              {(orders ?? []).flatMap((order) => order.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="py-3 font-semibold">#{order.orderNumber}</td>
                  <td>{item.product?.name}</td>
                  <td>{item.workshopStatus === 'ready' ? 'Ready' : 'Not ready'}</td>
                  <td>{item.fabricConsumptions.map((row) => row.fabric?.name).join(', ')}</td>
                  <td>{item.fabricConsumptions.reduce((sum, row) => sum + row.meters, 0)} m</td>
                  <td>{item.fabricConsumptions.map((row) => `${row.fabric?.qty ?? 0} m`).join(', ')}</td>
                  <td>{item.readyAt?.slice(0, 10) ?? '—'}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </WorkshopShell>
  )
}

function WorkshopShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-5"><h1 className="text-[28px] font-bold text-text-primary">{title}</h1>{children}</div>
}

function PricingRow({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => unknown }) {
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    void onSave(Number(event.target.value))
  }
  return <label className="grid grid-cols-[1fr_160px] items-center gap-3 text-[13px]"><span className="font-medium">{label}</span><Input type="number" min={0} defaultValue={value} onBlur={handleBlur} /></label>
}
