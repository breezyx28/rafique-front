import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { NumberInput } from '@/components/ui/NumberInput'
import {
  useGetInventoryFabricsQuery,
  useGetWorkshopPayrollQuery,
  useUpdateFabricMutation,
} from '@/features/api/appApi'

export { DeliveredOrdersPage } from './DeliveredOrdersPage'
export { WorkshopProductivityPage } from './ProductivityPage'

const money = (value: number) => `${value.toLocaleString()} SDG`

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

function WorkshopShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-5"><h1 className="text-[28px] font-bold text-text-primary">{title}</h1>{children}</div>
}

function PricingRow({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => unknown }) {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => {
    setLocal(value)
  }, [value])
  return (
    <label className="grid grid-cols-[1fr_160px] items-center gap-3 text-[13px]">
      <span className="font-medium">{label}</span>
      <NumberInput
        format="money"
        min={0}
        value={local}
        onValueChange={setLocal}
        onBlur={() => void onSave(local)}
        aria-label={`${label} sewing rate`}
        placeholder="0"
      />
    </label>
  )
}
