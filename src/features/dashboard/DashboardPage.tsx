import { useTranslation } from 'react-i18next'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  useGetDashboardSalesChartQuery,
  useGetDashboardStatsQuery,
  useGetDashboardTopCustomersQuery,
  useGetDashboardTopProductsQuery,
} from '@/features/api/appApi'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useGetDashboardStatsQuery()
  const { data: salesChart } = useGetDashboardSalesChartQuery(undefined)
  const { data: topCustomers } = useGetDashboardTopCustomersQuery({ limit: 5 })
  const { data: topProducts } = useGetDashboardTopProductsQuery({ limit: 20 })

  const spendingData = (salesChart?.data ?? []).map((point, idx, arr) => ({
    day: new Date(2000, point.month - 1, 1).toLocaleString('en-US', { month: 'short' }),
    value: point.total,
    active: idx === arr.length - 1,
  }))

  const currentYearTotal = spendingData.reduce((sum, item) => sum + item.value, 0)
  const sumProductQtyBy = (namePart: string) =>
    (topProducts ?? [])
      .filter((item) => item.name.toLowerCase().includes(namePart))
      .reduce((sum, item) => sum + item.qty, 0)
  const readyOrders = (topProducts ?? [])
    .filter((item) => item.name.toLowerCase().includes('ready'))
    .reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="space-y-7">
      {/* Top welcome + actions */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {t('dashboard.welcomeBack', 'Welcome back')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t('dashboard.subtitle', 'Overview of today\'s orders and revenue.')}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-text-secondary shadow-card hover:bg-gray-50"
        >
          {t('dashboard.exportAll', 'Export all data')}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none bg-[var(--card-peach)] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-text-secondary">
              {t('dashboard.totalOrders', 'Total orders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[24px] font-bold text-text-primary">
              {isLoading ? '—' : stats?.totalOrders ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              {t('dashboard.totalOrdersHint', 'All custom and ready orders')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[var(--card-mint)] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-text-secondary">
              {t('dashboard.totalRevenue', 'Total revenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[24px] font-bold text-text-primary">
              {isLoading ? '—' : (stats?.totalRevenue ?? 0).toLocaleString()} SDG
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              {t('dashboard.totalRevenueHint', 'Paid amounts this period')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[var(--card-lavender)] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-text-secondary">
              {t('dashboard.activeCustomers', 'Active customers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[24px] font-bold text-text-primary">
              {isLoading ? '—' : stats?.activeCustomers ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              {t('dashboard.activeCustomersHint', 'Ordered in the last 90 days')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[var(--card-sky)] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-medium text-text-secondary">
              {t('dashboard.workingDays', 'Working days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[24px] font-bold text-text-primary">
              {isLoading ? '—' : stats?.workingDays ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              {t('dashboard.workingDaysHint', 'Since opening this month')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main grid: sales chart + recent activity */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Teal sales chart card (right in reference, but grid order is responsive) */}
        <Card className="order-2 border-none bg-primary text-white shadow-md lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-[15px] font-semibold text-white">
                {t('dashboard.salesChart', 'Spending')}
              </CardTitle>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-[22px] font-bold text-white">{currentYearTotal.toLocaleString()} SDG</p>
                <span className="rounded-[4px] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {salesChart?.year ?? new Date().getFullYear()}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.2)] px-3 py-1 text-[11px] font-medium">
              {spendingData.length || 12} {t('dashboard.months', 'Months')}
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                  <YAxis
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={16}>
                    {spendingData.map((entry, index) => (
                      <Cell
                        // eslint-disable-next-line react/no-array-index-key
                        key={`bar-${index}`}
                        fill={entry.active ? '#F5F0CC' : 'rgba(255,255,255,0.35)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent orders + spending categories column */}
        <div className="order-1 space-y-5 lg:order-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{t('dashboard.recentOrders', 'Recent orders')}</CardTitle>
              <button
                type="button"
                className="text-[12px] font-medium text-text-muted hover:text-text-secondary"
              >
                {t('dashboard.viewAllOrders', 'View all')}
              </button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-[var(--color-border)]">
                {(topCustomers ?? []).map((c) => (
                  <div
                    key={c.customerId}
                    className="flex items-center justify-between py-2.5 text-[13px]"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">
                        {t('dashboard.topCustomer', 'Top customer')}
                      </p>
                      <p className="text-[11px] text-text-muted">{c.name} · {c.phone || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">+{c.totalSpent.toLocaleString()} SDG</p>
                      <p className="text-[11px] text-[var(--color-success)]">
                        {c.ordersCount} {t('dashboard.orders', 'orders')}
                      </p>
                    </div>
                  </div>
                ))}
                {!topCustomers?.length && (
                  <div className="py-3 text-[12px] text-text-muted">
                    {t('dashboard.noCustomerActivity', 'No customer activity yet.')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('dashboard.spendingByType', 'Orders by type')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-[12px] bg-[var(--card-peach)] p-3">
                  <p className="text-[11px] font-medium text-text-secondary">
                    {t('dashboard.jelabeya', 'Jelabeya')}
                  </p>
                  <p className="mt-1 text-[16px] font-bold text-text-primary">
                    {sumProductQtyBy('jelabeya')}
                  </p>
                </div>
                <div className="rounded-[12px] bg-[var(--card-mint)] p-3">
                  <p className="text-[11px] font-medium text-text-secondary">
                    {t('dashboard.serwal', 'Serwal')}
                  </p>
                  <p className="mt-1 text-[16px] font-bold text-text-primary">
                    {sumProductQtyBy('serwal')}
                  </p>
                </div>
                <div className="rounded-[12px] bg-[var(--card-lavender)] p-3">
                  <p className="text-[11px] font-medium text-text-secondary">
                    {t('dashboard.allala', 'Allala')}
                  </p>
                  <p className="mt-1 text-[16px] font-bold text-text-primary">
                    {sumProductQtyBy('allala')}
                  </p>
                </div>
                <div className="rounded-[12px] bg-[var(--card-sky)] p-3">
                  <p className="text-[11px] font-medium text-text-secondary">
                    {t('dashboard.readyProducts', 'Ready products')}
                  </p>
                  <p className="mt-1 text-[16px] font-bold text-text-primary">
                    {readyOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
