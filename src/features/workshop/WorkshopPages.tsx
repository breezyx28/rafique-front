import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { History, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { NumberInput } from '@/components/ui/NumberInput'
import {
  useCreateWorkshopWagePayoutMutation,
  useGetProductsQuery,
  useGetWorkshopPayrollQuery,
  useGetWorkshopWagePayoutsQuery,
  useUpdateProductMutation,
} from '@/features/api/appApi'
import { formatDateTime, formatMoney } from '@/lib/localeFormat'
import { translateApiMessage } from '@/lib/apiErrors'

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
  const [fromDate, setFromDate] = React.useState('')
  const [toDate, setToDate] = React.useState('')
  const [productId, setProductId] = React.useState('')
  const [payoutOpen, setPayoutOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [payoutAmount, setPayoutAmount] = React.useState(0)
  const [payoutNote, setPayoutNote] = React.useState('')
  const [payoutError, setPayoutError] = React.useState('')
  const [historyFrom, setHistoryFrom] = React.useState('')
  const [historyTo, setHistoryTo] = React.useState('')

  const { data: products } = useGetProductsQuery({ type: 'custom' })
  const { data, isFetching } = useGetWorkshopPayrollQuery({
    from: fromDate || undefined,
    to: toDate || undefined,
    productId: productId ? Number(productId) : undefined,
  })
  const { data: payouts = [], isFetching: historyLoading } = useGetWorkshopWagePayoutsQuery(
    {
      from: historyFrom || undefined,
      to: historyTo || undefined,
    },
    { skip: !historyOpen },
  )
  const [createPayout, { isLoading: payoutSaving }] = useCreateWorkshopWagePayoutMutation()

  const outstanding = data?.outstandingBalance ?? 0
  const amountInvalid = payoutAmount <= 0 || payoutAmount > outstanding

  const openPayout = () => {
    setPayoutAmount(0)
    setPayoutNote('')
    setPayoutError('')
    setPayoutOpen(true)
  }

  const submitPayout = async () => {
    setPayoutError('')
    if (amountInvalid) {
      setPayoutError(t('workshop.payoutAmountInvalid'))
      return
    }
    const confirmed = window.confirm(
      t('workshop.payoutConfirm', {
        amount: formatMoney(payoutAmount),
        balance: formatMoney(outstanding),
      }),
    )
    if (!confirmed) return
    try {
      await createPayout({
        amount: payoutAmount,
        note: payoutNote.trim() || undefined,
      }).unwrap()
      setPayoutOpen(false)
      setPayoutAmount(0)
      setPayoutNote('')
    } catch (error) {
      const raw =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: unknown } }).data?.message
          : undefined
      setPayoutError(translateApiMessage(raw) || t('workshop.payoutFailed'))
    }
  }

  return (
    <WorkshopShell title={t('workshop.paymentTitle')}>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>{t('workshop.outstandingBalance')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPayout}
              disabled={outstanding <= 0}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              {t('workshop.recordPayout')}
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-[13px] font-semibold text-text-primary hover:bg-muted"
            >
              <History className="h-4 w-4" />
              {t('workshop.payoutHistory')}
            </button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[12px] bg-primary-light p-4">
            <p className="text-[12px] text-text-secondary">{t('workshop.outstandingBalance')}</p>
            <p className="mt-1 text-[28px] font-bold text-primary">{formatMoney(outstanding)}</p>
          </div>
          <div className="rounded-[12px] border border-border bg-muted p-4">
            <p className="text-[12px] text-text-secondary">{t('workshop.totalAccruedAllTime')}</p>
            <p className="mt-1 text-[20px] font-semibold text-text-primary">{formatMoney(data?.totalAccrued ?? 0)}</p>
          </div>
          <div className="rounded-[12px] border border-border bg-muted p-4">
            <p className="text-[12px] text-text-secondary">{t('workshop.totalPaidAllTime')}</p>
            <p className="mt-1 text-[20px] font-semibold text-text-primary">{formatMoney(data?.totalPaid ?? 0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('workshop.payrollFiltersTitle')}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-[12px] font-medium text-text-secondary">
            <span>{t('common.fromDate', 'From date')}</span>
            <input
              type="date"
              dir="ltr"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            />
          </label>
          <label className="space-y-1 text-[12px] font-medium text-text-secondary">
            <span>{t('common.toDate', 'To date')}</span>
            <input
              type="date"
              dir="ltr"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            />
          </label>
          <label className="space-y-1 text-[12px] font-medium text-text-secondary">
            <span>{t('workshop.product')}</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            >
              <option value="">{t('workshop.allProducts')}</option>
              {(products ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('workshop.payrollTitle')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[12px] text-text-muted">
                  <th className="px-3 py-3">{t('workshop.product')}</th>
                  <th className="px-3 py-3">{t('workshop.pieces')}</th>
                  <th className="px-3 py-3">{t('workshop.metersCompleted')}</th>
                  <th className="px-3 py-3">{t('workshop.rate')}</th>
                  <th className="px-3 py-3">{t('workshop.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.breakdown ?? []).map((row) => (
                  <tr key={`${row.productId}-${row.rate}`} className="border-t border-border">
                    <td className="px-3 py-3 font-semibold">{row.productName}</td>
                    <td className="px-3 py-3">{row.pieces}</td>
                    <td className="px-3 py-3 text-text-secondary">{row.meters}</td>
                    <td className="px-3 py-3">{formatMoney(row.rate)}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(row.amount)}</td>
                  </tr>
                ))}
                {(data?.breakdown ?? []).length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                      {isFetching ? t('common.loading', 'Loading…') : t('workshop.payrollEmpty')}
                    </td>
                  </tr>
                )}
              </tbody>
              {(data?.breakdown ?? []).length > 0 && (
                <tfoot>
                  <tr className="border-t border-border bg-muted/60">
                    <td className="px-3 py-3 font-semibold">{t('workshop.periodTotals')}</td>
                    <td className="px-3 py-3 font-semibold">{data?.periodTotals.pieces ?? 0}</td>
                    <td className="px-3 py-3 font-semibold">{data?.periodTotals.meters ?? 0}</td>
                    <td className="px-3 py-3 text-text-muted">—</td>
                    <td className="px-3 py-3 font-bold text-primary">{formatMoney(data?.periodTotals.amount ?? 0)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="mt-3 text-[12px] text-text-muted">{t('workshop.metersNote')}</p>
          <div className="mt-4 rounded-[10px] bg-primary-light p-4 text-end">
            <span className="text-[12px] text-text-secondary">{t('workshop.accruedThisPeriod')} </span>
            <span className="text-[20px] font-bold text-primary">{formatMoney(data?.periodTotals.amount ?? 0)}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workshop.recordPayout')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px]">
            <span className="text-text-secondary">{t('workshop.outstandingBalance')}: </span>
            <span className="font-semibold text-text-primary">{formatMoney(outstanding)}</span>
          </div>
          <label className="block space-y-1 text-[12px] font-medium text-text-secondary">
            <span>{t('workshop.payoutAmount')}</span>
            <NumberInput
              format="money"
              value={payoutAmount}
              onValueChange={setPayoutAmount}
              min={0}
              max={outstanding}
              className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            />
          </label>
          <label className="block space-y-1 text-[12px] font-medium text-text-secondary">
            <span>{t('workshop.payoutNote')}</span>
            <textarea
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              rows={3}
              className="w-full rounded-[6px] border border-border bg-surface px-3 py-2 text-[13px] text-text-primary"
              placeholder={t('workshop.payoutNotePlaceholder')}
            />
          </label>
          {payoutError && <p className="text-[12px] text-danger">{payoutError}</p>}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setPayoutOpen(false)}
            className="h-10 rounded-[10px] border border-border px-4 text-[13px] font-medium text-text-secondary"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={payoutSaving || amountInvalid}
            onClick={() => void submitPayout()}
            className="h-10 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {payoutSaving ? t('common.loading', 'Saving…') : t('workshop.submitPayout')}
          </button>
        </DialogFooter>
      </Dialog>

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[20px] font-bold text-text-primary">{t('workshop.payoutHistory')}</h2>
              <p className="text-[13px] text-text-secondary">{t('workshop.payoutHistoryHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="h-10 rounded-[10px] border border-border px-4 text-[13px] font-medium text-text-secondary hover:bg-muted"
            >
              {t('common.close', 'Close')}
            </button>
          </div>
          <div className="border-b border-border px-5 py-3">
            <div className="grid max-w-xl gap-3 md:grid-cols-2">
              <label className="space-y-1 text-[12px] font-medium text-text-secondary">
                <span>{t('common.fromDate', 'From date')}</span>
                <input
                  type="date"
                  dir="ltr"
                  value={historyFrom}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
                />
              </label>
              <label className="space-y-1 text-[12px] font-medium text-text-secondary">
                <span>{t('common.toDate', 'To date')}</span>
                <input
                  type="date"
                  dir="ltr"
                  value={historyTo}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
                />
              </label>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-5 py-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[12px] text-text-muted">
                  <th className="px-3 py-3 text-start">{t('workshop.payoutDate')}</th>
                  <th className="px-3 py-3 text-start">{t('workshop.payoutAmount')}</th>
                  <th className="px-3 py-3 text-start">{t('workshop.balanceBefore')}</th>
                  <th className="px-3 py-3 text-start">{t('workshop.balanceAfter')}</th>
                  <th className="px-3 py-3 text-start">{t('workshop.payoutNote')}</th>
                  <th className="px-3 py-3 text-start">{t('workshop.recordedBy')}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(row.amount)}</td>
                    <td className="px-3 py-3">{formatMoney(row.balanceBefore)}</td>
                    <td className="px-3 py-3">{formatMoney(row.balanceAfter)}</td>
                    <td className="px-3 py-3 text-text-secondary">{row.note || '—'}</td>
                    <td className="px-3 py-3">{row.createdByUsername || '—'}</td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-3 py-10 text-center text-text-muted">
                      {historyLoading ? t('common.loading', 'Loading…') : t('workshop.payoutHistoryEmpty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
