import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { NumberInput } from '@/components/ui/NumberInput'
import {
  useGetProductsQuery,
  useGetWorkshopPayrollQuery,
  useUpdateProductMutation,
} from '@/features/api/appApi'
import { formatMoney } from '@/lib/localeFormat'

export { DeliveredOrdersPage } from './DeliveredOrdersPage'
export { WorkshopProductivityPage } from './ProductivityPage'

export function SewingPricingPage() {
  const { t } = useTranslation()
  const { data: products } = useGetProductsQuery({ type: 'custom' })
  const [updateProduct] = useUpdateProductMutation()

  return (
    <WorkshopShell title={t('workshop.pricingTitle')}>
      <Card>
        <CardHeader>
          <CardTitle>{t('workshop.pricingCardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[13px] text-text-secondary">
            {t('workshop.pricingHint')}
          </p>
          {(products ?? []).map((product) => (
            <PricingRow
              key={product.id}
              label={product.name}
              value={product.sewingPrice}
              onSave={(value) => updateProduct({ id: product.id, body: { sewingPrice: value } })}
            />
          ))}
        </CardContent>
      </Card>
    </WorkshopShell>
  )
}

export function TailorPaymentPage() {
  const { t } = useTranslation()
  const { data } = useGetWorkshopPayrollQuery()
  return (
    <WorkshopShell title={t('workshop.paymentTitle')}>
      <Card>
        <CardHeader><CardTitle>{t('workshop.payrollTitle')}</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-[13px]">
            <thead><tr className="text-start text-[12px] text-text-muted"><th className="py-3">{t('workshop.product')}</th><th>{t('workshop.metersCompleted')}</th><th>{t('workshop.rate')}</th><th>{t('workshop.amount')}</th></tr></thead>
            <tbody>
              {(data?.breakdown ?? []).map((row) => (
                <tr key={`${row.productId}-${row.rate}`} className="border-t border-border">
                  <td className="py-3 font-semibold">{row.productName}</td>
                  <td>{row.meters}</td><td>{formatMoney(row.rate)}</td><td className="font-semibold">{formatMoney(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 rounded-[10px] bg-primary-light p-4 text-end">
            <span className="text-[12px] text-text-secondary">{t('workshop.totalAccrued')} </span>
            <span className="text-[20px] font-bold text-primary">{formatMoney(data?.total ?? 0)}</span>
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
  const { t } = useTranslation()
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
        aria-label={t('workshop.sewingRateAria', { product: label })}
        placeholder="0"
      />
    </label>
  )
}
