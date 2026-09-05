import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toolbarSelectClass } from '@/components/ui/DataToolbar'
import { useGetDashboardOverviewQuery } from '@/features/api/appApi'
import { formatPackages, remainingPackages } from '@/lib/fabricStock'
import { formatCount, formatDate, formatMoney as money, formatShortMonth } from '@/lib/localeFormat'
import { formatOrderStatus, formatOrderType } from '@/lib/displayLabels'
import { DashboardBarChart } from './DashboardBarChart'

type Preset = 'today' | 'week' | 'month' | 'year' | 'custom'

function isoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangeForPreset(preset: Preset): { from: string; to: string } {
  const today = new Date()
  const to = isoDate(today)
  if (preset === 'today') return { from: to, to }
  if (preset === 'week') {
    const start = new Date(today)
    const offset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - offset)
    return { from: isoDate(start), to }
  }
  if (preset === 'year') return { from: `${today.getFullYear()}-01-01`, to }
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  return { from: monthStart, to }
}

function timelineLabel(date: string, grain: 'day' | 'week' | 'month') {
  if (grain === 'month') {
    const [year, month] = date.split('-').map(Number)
    return formatShortMonth(year, month)
  }
  if (grain === 'day') return formatDate(date)
  return date.slice(5)
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','),
    )
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const initial = rangeForPreset('month')
  const [preset, setPreset] = useState<Preset>('month')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const { data, isLoading } = useGetDashboardOverviewQuery({ from, to })

  const stats = data?.stats
  const grainLabel =
    data?.period.grain === 'day'
      ? t('dashboard.grainDay', 'Daily')
      : data?.period.grain === 'week'
        ? t('dashboard.grainWeek', 'Weekly')
        : t('dashboard.grainMonth', 'Monthly')

  const statusChart = useMemo(
    () =>
      (data?.ordersByStatus ?? []).map((row) => ({
        name: t(`dashboard.status.${row.status}`, row.status.replace('_', ' ')),
        value: row.count,
      })),
    [data?.ordersByStatus, t],
  )

  const typeChart = useMemo(
    () =>
      (data?.ordersByType ?? []).map((row) => ({
        name: t(`dashboard.type.${row.type}`, row.type),
        value: row.count,
      })),
    [data?.ordersByType, t],
  )

  const workshopChart = useMemo(
    () =>
      (data?.workshopByStatus ?? []).map((row) => ({
        name: t(`dashboard.status.${row.status}`, row.status.replace('_', ' ')),
        value: row.count,
      })),
    [data?.workshopByStatus, t],
  )

  const timelineBars = useMemo(
    () =>
      (data?.timeline ?? []).map((row) => ({
        name: timelineLabel(row.date, data?.period.grain ?? 'day'),
        value: row.revenue,
      })),
    [data?.timeline, data?.period.grain],
  )

  const fabricBars = useMemo(
    () =>
      (data?.fabrics ?? []).map((fabric) => ({
        name: fabric.name,
        value: Number(remainingPackages(fabric.meters, fabric.packageMeters).toFixed(2)),
      })),
    [data?.fabrics],
  )

  const timelineTotal = timelineBars.reduce((sum, row) => sum + row.value, 0)
  const typeTotal = typeChart.reduce((sum, row) => sum + row.value, 0)
  const statusTotal = statusChart.reduce((sum, row) => sum + row.value, 0)
  const workshopTotal = workshopChart.reduce((sum, row) => sum + row.value, 0)
  const fabricTotal = fabricBars.reduce((sum, row) => sum + row.value, 0)
  const periodChip = `${data?.timeline.length ?? 0} ${grainLabel}`

  const applyPreset = (next: Preset) => {
    setPreset(next)
    if (next === 'custom') return
    const range = rangeForPreset(next)
    setFrom(range.from)
    setTo(range.to)
  }

  const exportData = () => {
    if (!data) return
    const rows: Array<Array<string | number>> = [
      [t('dashboard.export.metric'), t('dashboard.export.value')],
      [t('dashboard.export.periodFrom'), formatDate(data.period.from)],
      [t('dashboard.export.periodTo'), formatDate(data.period.to)],
      [t('dashboard.totalOrders'), stats?.orders ?? 0],
      [t('dashboard.export.customOrders'), stats?.customOrders ?? 0],
      [t('dashboard.export.readyOrders'), stats?.readyOrders ?? 0],
      [t('dashboard.export.fabricOrders'), stats?.fabricOrders ?? 0],
      [t('dashboard.export.revenue'), stats?.revenue ?? 0],
      [t('dashboard.paid'), stats?.paid ?? 0],
      [t('dashboard.remaining'), stats?.remaining ?? 0],
      [t('dashboard.expenses'), stats?.expenses ?? 0],
      [t('dashboard.export.customers'), stats?.customers ?? 0],
      [t('dashboard.export.newCustomers'), stats?.newCustomers ?? 0],
      [t('dashboard.readyStock'), stats?.readyStock ?? 0],
      [t('dashboard.fabricMeters'), stats?.fabricMeters ?? 0],
      [t('dashboard.export.workshopReady'), stats?.workshopReady ?? 0],
      [t('dashboard.export.workshopNotReady'), stats?.workshopNotReady ?? 0],
      [],
      [t('dashboard.export.date'), t('dashboard.ordersVolume'), t('dashboard.export.revenue'), t('dashboard.expenses')],
      ...data.timeline.map((row) => [formatDate(row.date), row.orders, row.revenue, row.expenses]),
    ]
    downloadCsv(`rafique-dashboard-${from}-to-${to}.csv`, rows)
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {t('dashboard.welcomeBack', 'Welcome back')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t('dashboard.subtitle', 'Overview of orders, stock, workshop, and expenses.')}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-secondary">
              {t('dashboard.period', 'Period')}
            </label>
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value as Preset)}
              className={toolbarSelectClass}
            >
              <option value="today">{t('dashboard.today', 'Today')}</option>
              <option value="week">{t('dashboard.thisWeek', 'This week')}</option>
              <option value="month">{t('dashboard.thisMonth', 'This month')}</option>
              <option value="year">{t('dashboard.thisYear', 'This year')}</option>
              <option value="custom">{t('dashboard.custom', 'Custom')}</option>
            </select>
          </div>
          <Input
            type="date"
            label={t('common.fromDate', 'From date')}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPreset('custom')
            }}
          />
          <Input
            type="date"
            label={t('common.toDate', 'To date')}
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPreset('custom')
            }}
          />
          <Button type="button" onClick={exportData} disabled={!data || isLoading}>
            {t('dashboard.exportAll', 'Export all data')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tint="peach" label={t('dashboard.totalOrders', 'Total orders')} value={isLoading ? '—' : stats?.orders ?? 0} hint={t('dashboard.totalOrdersBreakdown', '{{custom}} custom · {{ready}} ready · {{fabric}} fabric · {{days}} working days', { custom: stats?.customOrders ?? 0, ready: stats?.readyOrders ?? 0, fabric: stats?.fabricOrders ?? 0, days: stats?.workingDays ?? 0 })} onClick={() => navigate('/orders')} />
        <StatCard tint="mint" label={t('dashboard.paid', 'Paid')} value={isLoading ? '—' : money(stats?.paid ?? 0)} hint={t('dashboard.revenueHint', 'Collected in this period')} onClick={() => navigate('/orders')} />
        <StatCard tint="lavender" label={t('dashboard.remaining', 'Unpaid remaining')} value={isLoading ? '—' : money(stats?.remaining ?? 0)} hint={t('dashboard.remainingHint', 'Still due from customers')} onClick={() => navigate('/orders')} />
        <StatCard tint="sky" label={t('dashboard.expenses', 'Expenses')} value={isLoading ? '—' : money(stats?.expenses ?? 0)} hint={t('dashboard.expensesHint', 'Shop spending in this period')} onClick={() => navigate('/expenses')} />
        <StatCard tint="peach" label={t('dashboard.activeCustomers', 'Active customers')} value={isLoading ? '—' : stats?.customers ?? 0} hint={t('dashboard.newCustomersHint', '{{count}} new in this period', { count: stats?.newCustomers ?? 0 })} onClick={() => navigate('/customers')} />
        <StatCard tint="mint" label={t('dashboard.readyStock', 'Ready stock')} value={isLoading ? '—' : stats?.readyStock ?? 0} hint={t('dashboard.lowStockHint', '{{count}} low-stock items', { count: stats?.lowStock ?? 0 })} onClick={() => navigate('/ready-products')} />
        <StatCard tint="lavender" label={t('dashboard.fabricMeters', 'Fabric meters left')} value={isLoading ? '—' : `${formatCount(stats?.fabricMeters ?? 0)} ${t('common.metersShort')}`} hint={t('dashboard.fabricHint', 'Current inventory after consumption')} onClick={() => navigate('/inventory')} />
        <StatCard tint="sky" label={t('dashboard.workshop', 'Workshop')} value={isLoading ? '—' : `${stats?.workshopReady ?? 0} / ${stats?.workshopNotReady ?? 0}`} hint={t('dashboard.workshopHint', 'Ready / not ready pieces')} onClick={() => navigate('/workshop/productivity')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <DashboardBarChart
          className="xl:col-span-2"
          title={t('dashboard.timeline', 'Revenue vs expenses')}
          total={money(timelineTotal)}
          badge={grainLabel}
          chip={periodChip}
          data={timelineBars}
          emptyLabel={t('dashboard.noChart', 'No activity in this period.')}
          height={220}
        />
        <DashboardBarChart
          title={t('dashboard.ordersByStatus', 'Orders by status')}
          total={String(statusTotal)}
          badge={grainLabel}
          chip={periodChip}
          data={statusChart}
          emptyLabel={t('dashboard.noChart', 'No activity in this period.')}
          yTickFormatter={(value) => String(value)}
          height={220}
          highlight="max"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardBarChart
          title={t('dashboard.ordersByType', 'Orders by type')}
          total={String(typeTotal)}
          badge={grainLabel}
          chip={periodChip}
          data={typeChart}
          emptyLabel={t('dashboard.noChart', 'No activity in this period.')}
          yTickFormatter={(value) => String(value)}
          height={200}
          highlight="max"
          headerRight={
            <ViewAll onClick={() => navigate('/orders')} label={t('dashboard.viewAllOrders', 'View all')} />
          }
        />
        <DashboardBarChart
          title={t('dashboard.expensesByType', 'Expenses by type')}
          total={money(stats?.expenses ?? 0)}
          badge={grainLabel}
          chip={periodChip}
          data={(data?.expensesByType ?? []).map((row) => ({ name: row.name, value: row.total }))}
          emptyLabel={t('dashboard.noExpenses', 'No expenses in this period.')}
          height={200}
          highlight="max"
          headerRight={
            <ViewAll onClick={() => navigate('/expenses')} label={t('dashboard.viewAllOrders', 'View all')} />
          }
        />
        <DashboardBarChart
          title={t('dashboard.workshopStatus', 'Workshop pieces')}
          total={String(workshopTotal)}
          chip={t('dashboard.workshop', 'Workshop')}
          data={workshopChart}
          emptyLabel={t('dashboard.noChart', 'No activity in this period.')}
          yTickFormatter={(value) => String(value)}
          height={200}
          highlight="max"
          headerRight={
            <ViewAll onClick={() => navigate('/workshop/orders')} label={t('dashboard.viewAllOrders', 'View all')} />
          }
        />
        <DashboardBarChart
          title={t('dashboard.fabricStock', 'Fabric remaining')}
          total={`${formatPackages(fabricTotal)} ${t('common.packagesShort')}`}
          chip={t('dashboard.fabricMeters', 'Fabric meters left')}
          data={fabricBars}
          emptyLabel={t('dashboard.noFabric', 'No fabric stock yet.')}
          height={200}
          highlight="max"
          headerRight={
            <ViewAll onClick={() => navigate('/inventory')} label={t('dashboard.viewAllOrders', 'View all')} />
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>{t('dashboard.recentOrders', 'Recent orders')}</CardTitle>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="cursor-pointer text-[12px] font-medium text-primary hover:underline"
            >
              {t('dashboard.viewAllOrders', 'View all')}
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {(data?.recentOrders ?? []).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => navigate(`/invoices/${order.id}?type=customer`)}
                  className="flex w-full cursor-pointer items-center justify-between py-2.5 text-start text-[13px] hover:bg-[#FAFAFA]"
                >
                  <div>
                    <p className="font-semibold text-text-primary">#{order.orderNumber}</p>
                    <p className="text-[11px] text-text-muted">
                      {order.customer} · {formatOrderType(order.type)} · {formatOrderStatus(order.status)}
                    </p>
                  </div>
                  <p className="font-semibold text-text-primary">{money(order.total)}</p>
                </button>
              ))}
              {!data?.recentOrders.length && (
                <p className="py-3 text-[12px] text-text-muted">
                  {t('dashboard.noOrders', 'No orders in this period.')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{t('dashboard.vipCustomers', 'VIP Customers')}</CardTitle>
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="cursor-pointer text-[12px] font-medium text-primary hover:underline"
              >
                {t('dashboard.viewAllOrders', 'View all')}
              </button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {(data?.topCustomers ?? []).map((customer) => (
                  <button
                    key={customer.customerId}
                    type="button"
                    onClick={() => navigate(`/customers/${customer.customerId}/edit`)}
                    className="flex w-full cursor-pointer items-center justify-between py-2.5 text-start text-[13px] hover:bg-[#FAFAFA]"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">{customer.name}</p>
                      <p className="text-[11px] text-text-muted">{customer.phone || '—'}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-semibold text-text-primary">{money(customer.totalSpent)}</p>
                      <p className="text-[11px] text-success">{customer.ordersCount} {t('dashboard.orders', 'orders')}</p>
                    </div>
                  </button>
                ))}
                {!data?.topCustomers.length && (
                  <p className="py-3 text-[12px] text-text-muted">
                    {t('dashboard.noCustomerActivity', 'No customer activity yet.')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{t('dashboard.topProducts', 'Most Sold Products')}</CardTitle>
              <button
                type="button"
                onClick={() => navigate('/settings/products')}
                className="cursor-pointer text-[12px] font-medium text-primary hover:underline"
              >
                {t('dashboard.viewAllOrders', 'View all')}
              </button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {(data?.topProducts ?? []).map((product) => (
                  <div key={product.name} className="flex items-center justify-between rounded-[10px] bg-[#FAFAFA] px-3 py-2 text-[13px]">
                    <div>
                      <p className="font-semibold text-text-primary">{product.name}</p>
                      <p className="text-[11px] text-text-muted">{product.qty} {t('dashboard.sold', 'sold')}</p>
                    </div>
                    <p className="font-semibold">{money(product.total)}</p>
                  </div>
                ))}
                {!data?.topProducts.length && (
                  <p className="text-[12px] text-text-muted">{t('dashboard.noProducts', 'No product sales in this period.')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ViewAll({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-[12px] font-medium text-white/80 hover:text-white hover:underline"
    >
      {label}
    </button>
  )
}

function StatCard({
  tint,
  label,
  value,
  hint,
  onClick,
}: {
  tint: 'peach' | 'mint' | 'lavender' | 'sky'
  label: string
  value: string | number
  hint: string
  onClick?: () => void
}) {
  const bg = {
    peach: 'bg-[var(--card-peach)]',
    mint: 'bg-[var(--card-mint)]',
    lavender: 'bg-[var(--card-lavender)]',
    sky: 'bg-[var(--card-sky)]',
  }[tint]
  return (
    <Card className={`border-none shadow-none ${bg}`}>
      <button type="button" onClick={onClick} className="w-full cursor-pointer text-start">
        <CardContent className="pt-5">
          <p className="text-[12px] text-text-secondary">{label}</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums text-text-primary">{value}</p>
          <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
        </CardContent>
      </button>
    </Card>
  )
}
