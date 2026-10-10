import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { DashboardBarChart } from '@/features/dashboard/DashboardBarChart'
import {
  useAddOrderReceiptMutation,
  useAttachOrderCustomerMutation,
  useCreateCustomerMutation,
  useGetCustomerListQuery,
  useGetReceivablesQuery,
} from '@/features/api/appApi'
import { translateApiMessage } from '@/lib/apiErrors'
import { formatDate, formatMoney } from '@/lib/localeFormat'

type ReceiptMethod = 'cash' | 'mbok'

function localIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function DebtsPage() {
  const { t } = useTranslation()
  const today = localIso(new Date())
  const monthStart = localIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [status, setStatus] = useState<'open' | 'settled' | 'all'>('open')
  const { data, isLoading } = useGetReceivablesQuery({ from, to, status })
  const [addReceipt, { isLoading: savingReceipt }] = useAddOrderReceiptMutation()
  const [attachCustomer, { isLoading: savingCustomer }] = useAttachOrderCustomerMutation()
  const [createCustomer] = useCreateCustomerMutation()
  const { data: customers } = useGetCustomerListQuery()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<ReceiptMethod>('cash')
  const [paidAt, setPaidAt] = useState(today)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const active = data?.rows.find((row) => row.id === activeId) ?? null
  const matches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return (customers ?? [])
      .filter(
        (customer) =>
          (customer.name ?? '').toLowerCase().includes(query) ||
          (customer.phone ?? '').toLowerCase().includes(query)
      )
      .slice(0, 8)
  }, [customers, search])

  const aging = (data?.aging ?? []).map((bucket) => ({
    name: t(`debtsPage.bucket.${bucket.bucket}`),
    value: bucket.total,
  }))

  const openReceipt = (rowId: number, remaining: number) => {
    setActiveId(rowId)
    setAmount(remaining)
    setMethod('cash')
    setPaidAt(today)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerId(null)
    setSearch('')
    setMessage('')
    setError('')
  }

  const saveCustomer = async () => {
    if (!active) return
    setError('')
    setMessage('')
    try {
      let id = customerId
      if (!id) {
        if (!customerName.trim() || !customerPhone.trim()) {
          setError(t('debtsPage.customerRequired'))
          return
        }
        const created = await createCustomer({
          name: customerName.trim(),
          phone: customerPhone.trim(),
        }).unwrap()
        id = created.id
      }
      await attachCustomer({ id: active.id, customerId: id }).unwrap()
      setMessage(t('debtsPage.customerAttached'))
    } catch (caught) {
      const apiError = caught as { data?: { message?: unknown } }
      setError(translateApiMessage(apiError.data?.message))
    }
  }

  const saveReceipt = async () => {
    if (!active) return
    setError('')
    setMessage('')
    try {
      await addReceipt({
        id: active.id,
        body: { amount, paymentMethod: method, paidAt },
      }).unwrap()
      setMessage(t('debtsPage.receiptSaved'))
      setActiveId(null)
    } catch (caught) {
      const apiError = caught as { data?: { message?: unknown } }
      setError(translateApiMessage(apiError.data?.message))
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">{t('debtsPage.title')}</h1>
        <p className="text-[13px] text-text-secondary">{t('debtsPage.subtitle')}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-[12px] text-text-muted">{t('debtsPage.balanceDue')}</p>
            <p className="text-[22px] font-bold text-text-primary">{formatMoney(data?.stats.balanceDue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[12px] text-text-muted">{t('debtsPage.collected')}</p>
            <p className="text-[22px] font-bold text-text-primary">{formatMoney(data?.stats.collected ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[12px] text-text-muted">{t('debtsPage.openInvoices')}</p>
            <p className="text-[22px] font-bold text-text-primary">{data?.stats.openCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <DashboardBarChart
        title={t('debtsPage.agingTitle')}
        total={formatMoney(data?.stats.balanceDue ?? 0)}
        data={aging}
        emptyLabel={t('debtsPage.agingEmpty')}
        yTickFormatter={(value) => formatMoney(value)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('debtsPage.tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-[12px] text-text-secondary">
              {t('debtsPage.from')}
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="text-[12px] text-text-secondary">
              {t('debtsPage.to')}
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <label className="text-[12px] text-text-secondary">
              {t('debtsPage.status')}
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
              >
                <option value="open">{t('debtsPage.open')}</option>
                <option value="settled">{t('debtsPage.settled')}</option>
                <option value="all">{t('debtsPage.all')}</option>
              </select>
            </label>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-[12px] text-text-muted">
                  <th className="px-3 py-3">{t('debtsPage.customer')}</th>
                  <th className="px-3 py-3">{t('debtsPage.invoice')}</th>
                  <th className="px-3 py-3">{t('debtsPage.dueDate')}</th>
                  <th className="px-3 py-3">{t('debtsPage.total')}</th>
                  <th className="px-3 py-3">{t('debtsPage.paid')}</th>
                  <th className="px-3 py-3">{t('debtsPage.balance')}</th>
                  <th className="px-3 py-3">{t('debtsPage.status')}</th>
                  <th className="px-3 py-3 text-end">{t('debtsPage.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-text-muted">{t('common.loading')}</td>
                  </tr>
                )}
                {(data?.rows ?? []).map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-3">
                      <p className="font-semibold">{row.customerName || t('debtsPage.needsCustomer')}</p>
                      <p className="text-[12px] text-text-muted">{row.customerPhone || '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Link className="font-semibold text-primary" to={`/invoices/${row.id}?type=customer`}>
                        #{row.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{row.dueDate ? formatDate(row.dueDate) : '—'}</td>
                    <td className="px-3 py-3">{formatMoney(row.total)}</td>
                    <td className="px-3 py-3">{formatMoney(row.paid)}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(row.remaining)}</td>
                    <td className="px-3 py-3">{row.remaining > 0 ? t('debtsPage.open') : t('debtsPage.settled')}</td>
                    <td className="px-3 py-3 text-end">
                      {row.remaining > 0 && (
                        <Button variant="outline" size="sm" onClick={() => openReceipt(row.id, row.remaining)}>
                          {row.needsCustomer ? t('debtsPage.attachCustomer') : t('debtsPage.recordReceipt')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {active.needsCustomer
                ? t('debtsPage.attachCustomer')
                : t('debtsPage.recordReceipt')}{' '}
              #{active.orderNumber}
            </h3>
            <div className="mt-4 space-y-3">
            {active.needsCustomer ? (
              <>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('debtsPage.searchCustomer')}
                />
                {matches.length > 0 && (
                  <ul className="rounded-[10px] border border-border">
                    {matches.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-start text-[13px] hover:bg-[#F5F5F5]"
                          onClick={() => {
                            setCustomerId(customer.id)
                            setCustomerName(customer.name ?? '')
                            setCustomerPhone(customer.phone ?? '')
                            setSearch('')
                          }}
                        >
                          {customer.name} · {customer.phone}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={customerName}
                    onChange={(event) => {
                      setCustomerName(event.target.value)
                      setCustomerId(null)
                    }}
                    placeholder={t('debtsPage.customerName')}
                  />
                  <Input
                    value={customerPhone}
                    onChange={(event) => {
                      setCustomerPhone(event.target.value)
                      setCustomerId(null)
                    }}
                    placeholder={t('debtsPage.customerPhone')}
                  />
                </div>
                <Button disabled={savingCustomer} onClick={() => void saveCustomer()}>
                  {t('debtsPage.attachCustomer')}
                </Button>
              </>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <NumberInput
                  format="money"
                  min={0}
                  value={amount}
                  onValueChange={setAmount}
                  aria-label={t('debtsPage.amount')}
                />
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as ReceiptMethod)}
                  className="h-10 rounded-[6px] border border-border bg-white px-3 text-[13px]"
                >
                  <option value="cash">{t('orders.cash')}</option>
                  <option value="mbok">{t('orders.mbok')}</option>
                </select>
                <Input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
                <Button
                  disabled={savingReceipt || amount <= 0 || amount - active.remaining > 0.009}
                  onClick={() => void saveReceipt()}
                >
                  {t('debtsPage.recordReceipt')}
                </Button>
              </div>
            )}
            {message && <p className="text-[12px] font-medium text-success">{message}</p>}
            {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setActiveId(null)}>
                {t('common.close')}
              </Button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
