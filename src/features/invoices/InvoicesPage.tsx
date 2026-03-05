import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { money } from './types'
import { useGetOrdersQuery } from '@/features/api/appApi'

export function InvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'mbok'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const { data } = useGetOrdersQuery({ page, limit: 20, from: fromDate || undefined, to: toDate || undefined })

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.data ?? []).filter((o) => {
      const remaining = o.remaining ?? Math.max(0, o.total - o.paid)
      const matchesQuery =
        !q ||
        String(o.id).toLowerCase().includes(q) ||
        (o.customer?.name ?? '').toLowerCase().includes(q) ||
        (o.customer?.phone ?? '').toLowerCase().includes(q)
      const matchesMethod = methodFilter === 'all' || (o.paymentMethod ?? 'cash') === methodFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' ? remaining <= 0 : remaining > 0)
      const createdDate = (o.createdAt ?? '').slice(0, 10)
      const matchesFrom = !fromDate || createdDate >= fromDate
      const matchesTo = !toDate || createdDate <= toDate
      return matchesQuery && matchesMethod && matchesStatus && matchesFrom && matchesTo
    })
  }, [data?.data, fromDate, methodFilter, query, statusFilter, toDate])
  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? filteredOrders.length) / (data?.meta.limit ?? 20)))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">{t('invoicesPage.title', 'Invoices')}</h1>
          <p className="text-[13px] text-text-secondary">{t('invoicesPage.subtitle', 'Orders invoice table with search, filters, and row actions.')}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle>{t('invoicesPage.cardTitle', 'Orders Invoices')}</CardTitle>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder={t('invoicesPage.searchPlaceholder', 'Search by order #, customer, phone')}
                className="pl-9"
              />
            </div>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as 'all' | 'cash' | 'mbok')
                setPage(1)
              }}
              className="h-10 rounded-[6px] border border-border bg-white px-3 text-[13px]"
            >
              <option value="all">{t('invoicesPage.allMethods', 'All Methods')}</option>
              <option value="cash">{t('orders.cash', 'Cash')}</option>
              <option value="mbok">{t('orders.mbok', 'MBOK')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'paid' | 'pending')
                setPage(1)
              }}
              className="h-10 rounded-[6px] border border-border bg-white px-3 text-[13px]"
            >
              <option value="all">{t('invoicesPage.allStatus', 'All Status')}</option>
              <option value="paid">{t('invoicesPage.paid', 'Paid')}</option>
              <option value="pending">{t('invoicesPage.pending', 'Pending')}</option>
            </select>
            <Input type="date" value={fromDate} onChange={(e) => {
              setFromDate(e.target.value)
              setPage(1)
            }} />
            <Input type="date" value={toDate} onChange={(e) => {
              setToDate(e.target.value)
              setPage(1)
            }} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-[12px] border border-border">
            <table className="w-full min-w-[760px]">
              <thead className="bg-[#FAFAFA]">
                <tr className="text-left text-[12px] font-medium text-text-muted">
                  <th className="px-4 py-3">{t('orders.orderNumber', 'Order #')}</th>
                  <th className="px-4 py-3">{t('orders.customer', 'Customer')}</th>
                  <th className="px-4 py-3">{t('orders.date', 'Date')}</th>
                  <th className="px-4 py-3">{t('orders.dueDate', 'Due Date')}</th>
                  <th className="px-4 py-3">{t('orders.total', 'Total')}</th>
                  <th className="px-4 py-3">{t('orders.remaining', 'Remaining')}</th>
                  <th className="px-4 py-3">{t('orders.method', 'Method')}</th>
                  <th className="px-4 py-3">{t('orders.status', 'Status')}</th>
                  <th className="px-4 py-3">{t('customersPage.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((row) => {
                  const remaining = row.remaining ?? Math.max(0, row.total - row.paid)
                  return (
                  <tr
                    key={String(row.id)}
                    className="border-t border-border text-[13px]"
                  >
                    <td className="px-4 py-3 font-semibold text-text-primary">#{row.id}</td>
                    <td className="px-4 py-3 text-text-primary">{row.customer?.name ?? t('orders.walkIn', 'Walk-in')}</td>
                    <td className="px-4 py-3 text-text-secondary">{(row.createdAt ?? '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-text-secondary">{(row.dueDate ?? '').slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{money(row.total)}</td>
                    <td className={`px-4 py-3 font-semibold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                      {money(remaining)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{(row.paymentMethod ?? 'cash').toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          remaining > 0 ? 'bg-warningBg text-[#B45309]' : 'bg-successBg text-success'
                        }`}
                      >
                        {remaining > 0 ? t('invoicesPage.pending', 'Pending') : t('invoicesPage.paid', 'Paid')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => navigate(`/invoices/${String(row.id)}?type=customer`)}
                        >
                          <Eye className="h-4 w-4" />
                          {t('invoicesPage.view', 'View')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[13px] text-text-muted">
                      {t('invoicesPage.noResults', 'No invoices found for current filters.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12px] text-text-muted">
              {t('invoicesPage.showing', 'Showing {{count}} of {{total}} invoices', {
                count: filteredOrders.length,
                total: data?.meta.total ?? filteredOrders.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('invoicesPage.previousPage', 'Previous')}
              </Button>
              <span className="text-[12px] text-text-secondary">
                {t('invoicesPage.pageOf', 'Page {{page}} / {{total}}', { page, total: totalPages })}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('invoicesPage.nextPage', 'Next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

