import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  FilterToolbar,
  PaginationBar,
  SearchField,
  ToolbarField,
  toolbarSelectClass,
} from '@/components/ui/DataToolbar'
import { remainingPackages, formatPackages } from '@/lib/fabricStock'
import {
  useGetInventoryFabricsQuery,
  useGetWorkshopOrdersQuery,
} from '@/features/api/appApi'
import { formatCount, formatDate } from '@/lib/localeFormat'

const PAGE_SIZE = 10
const STATUS_COLORS = { ready: '#0B9E8E', notReady: '#F59E0B' }

export function WorkshopProductivityPage() {
  const { t } = useTranslation()
  const { data: orders } = useGetWorkshopOrdersQuery()
  const { data: fabricsData } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'ready' | 'not_ready'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const items = useMemo(
    () =>
      (orders ?? []).flatMap((order) =>
        order.items.map((item) => ({
          itemId: item.id!,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer?.name ?? t('workshop.walkIn', 'Walk-in'),
          product: item.product?.name ?? '—',
          ready: item.workshopStatus === 'ready',
          readyAt: (item.readyAt ?? '').slice(0, 10),
          deliveredAt: (order.workshopDeliveredAt ?? '').slice(0, 10),
          fabrics: item.fabricConsumptions.map((row) => row.fabric?.name).filter(Boolean).join(', '),
          consumed: item.fabricConsumptions.reduce((sum, row) => sum + Number(row.meters), 0),
          remainingStock: item.fabricConsumptions
            .map((row) => `${formatCount(Number(row.fabric?.qty ?? 0))} ${t('common.metersShort')}`)
            .join(', '),
        })),
      ),
    [orders, t],
  )

  const stats = useMemo(() => {
    const readyItems = items.filter((row) => row.ready)
    const consumedMeters = items.reduce((sum, row) => sum + row.consumed, 0)
    const processedMeters = readyItems.reduce((sum, row) => sum + row.consumed, 0)
    const remainingMeters = (fabricsData?.data ?? []).reduce((sum, fabric) => sum + Number(fabric.qty), 0)
    const remainingPkg = (fabricsData?.data ?? []).reduce(
      (sum, fabric) => sum + remainingPackages(fabric.qty, fabric.packageMeters),
      0,
    )
    return {
      orders: new Set(items.map((row) => row.orderId)).size,
      items: items.length,
      ready: readyItems.length,
      notReady: items.length - readyItems.length,
      consumedMeters,
      processedMeters,
      remainingMeters,
      remainingPkg,
    }
  }, [fabricsData?.data, items])

  const timeline = useMemo(() => {
    const map = new Map<string, { ready: number; notReady: number; consumed: number }>()
    for (const row of items) {
      const day = row.readyAt || row.deliveredAt || t('workshop.unscheduled', 'Unscheduled')
      const current = map.get(day) ?? { ready: 0, notReady: 0, consumed: 0 }
      if (row.ready) current.ready += 1
      else current.notReady += 1
      current.consumed += row.consumed
      map.set(day, current)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, value]) => ({ day, ...value }))
  }, [items, t])

  const fabricBars = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of orders ?? []) {
      for (const item of order.items) {
        for (const row of item.fabricConsumptions) {
          const name = row.fabric?.name ?? t('workshop.fabric', 'Fabric')
          map.set(name, (map.get(name) ?? 0) + Number(row.meters))
        }
      }
    }
    return [...map.entries()]
      .map(([name, meters]) => ({ name, meters }))
      .sort((a, b) => b.meters - a.meters)
      .slice(0, 6)
  }, [orders, t])

  const statusChart = [
    { name: t('workshop.ready', 'Ready'), value: stats.ready, fill: STATUS_COLORS.ready },
    { name: t('workshop.notReady', 'Not ready'), value: stats.notReady, fill: STATUS_COLORS.notReady },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((row) => {
      const matchesSearch =
        !q ||
        row.orderNumber.toLowerCase().includes(q) ||
        row.customer.toLowerCase().includes(q) ||
        row.product.toLowerCase().includes(q) ||
        row.fabrics.toLowerCase().includes(q)
      const matchesStatus = status === 'all' || (status === 'ready' ? row.ready : !row.ready)
      const date = row.readyAt || row.deliveredAt
      const matchesFrom = !fromDate || date >= fromDate
      const matchesTo = !toDate || date <= toDate
      return matchesSearch && matchesStatus && matchesFrom && matchesTo
    })
  }, [fromDate, items, search, status, toDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const resetPage = () => setPage(1)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">
          {t('nav.productivity', 'Workshop Productivity')}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {t(
            'workshop.productivitySubtitle',
            'Throughput, fabric consumption, remaining packages, and ready vs not-ready status.',
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          tint="peach"
          label={t('workshop.statOrders', 'Workshop orders')}
          value={stats.orders}
          hint={t('workshop.statOrdersHint', { count: stats.items, defaultValue: '{{count}} pieces in queue' })}
        />
        <StatCard
          tint="mint"
          label={t('workshop.statReady', 'Ready pieces')}
          value={stats.ready}
          hint={t('workshop.statReadyHint', { count: stats.notReady, defaultValue: '{{count}} still not ready' })}
        />
        <StatCard
          tint="lavender"
          label={t('workshop.statNotReady', 'Not ready')}
          value={stats.notReady}
          hint={t('workshop.statNotReadyHint', { count: stats.notReady, defaultValue: '{{count}} pieces waiting' })}
        />
        <StatCard
          tint="sky"
          label={t('workshop.statConsumed', 'Consumed fabric')}
          value={`${formatCount(stats.consumedMeters)} ${t('common.metersShort')}`}
          hint={t('workshop.statConsumedHint', {
            meters: formatCount(stats.processedMeters),
            defaultValue: '{{meters}} m sewn on ready pieces',
          })}
        />
        <StatCard
          tint="peach"
          label={t('workshop.statProcessed', 'Processed fabric')}
          value={`${formatCount(stats.processedMeters)} ${t('common.metersShort')}`}
          hint={t('workshop.statProcessedHint', 'Meters on pieces marked ready')}
        />
        <StatCard
          tint="mint"
          label={t('workshop.statRemaining', 'Stock remaining')}
          value={`${formatCount(stats.remainingMeters)} ${t('common.metersShort')}`}
          hint={t('workshop.statRemainingHint', {
            packages: formatPackages(stats.remainingPkg),
            defaultValue: '{{packages}} packages left',
          })}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>{t('workshop.timelineTitle', 'Ready vs not ready over time')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {timeline.length === 0 ? (
              <EmptyChart label={t('workshop.noData', 'No workshop data yet.')} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#EBEBEB" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ready"
                    name={t('workshop.ready', 'Ready')}
                    stroke="#0B9E8E"
                    fill="#E6F7F5"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="notReady"
                    name={t('workshop.notReady', 'Not ready')}
                    stroke="#F59E0B"
                    fill="#FEF3C7"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('workshop.pieceStatus', 'Piece status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {stats.items === 0 ? (
              <EmptyChart label={t('workshop.noData', 'No workshop data yet.')} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChart} layout="vertical" margin={{ left: 16, right: 16 }}>
                  <CartesianGrid stroke="#EBEBEB" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#1A1A2E' }} width={88} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                    {statusChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('workshop.fabricConsumed', 'Fabric consumed')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {fabricBars.length === 0 ? (
              <EmptyChart label={t('workshop.noData', 'No workshop data yet.')} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fabricBars}>
                  <CartesianGrid stroke="#EBEBEB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip />
                  <Bar dataKey="meters" name={t('workshop.meters', 'Meters')} fill="#0B9E8E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('workshop.remainingPackages', 'Remaining packages')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[228px] space-y-2 overflow-auto pe-1">
              {(fabricsData?.data ?? []).map((fabric) => {
                const packages = remainingPackages(fabric.qty, fabric.packageMeters)
                return (
                  <div
                    key={fabric.id}
                    className="flex items-center justify-between rounded-[10px] bg-[#FAFAFA] px-3 py-2"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary">{fabric.name}</p>
                      <p className="text-[11px] text-text-muted">
                        {fabric.packageMeters} {t('workshop.metersPerPackage', 'm / package')}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[13px] font-semibold tabular-nums">
                        {formatPackages(packages)} {t('workshop.pkg', 'pkg')}
                      </p>
                      <p className="text-[11px] text-text-muted tabular-nums">
                        {formatCount(Number(fabric.qty))} {t('workshop.metersLeft', 'm left')}
                      </p>
                    </div>
                  </div>
                )
              })}
              {!fabricsData?.data?.length && (
                <p className="text-[13px] text-text-muted">
                  {t('workshop.noFabricStock', 'No fabric stock yet.')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t('workshop.ledgerTitle', 'Piece ledger')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterToolbar>
            <SearchField
              label={t('common.search', 'Search')}
              value={search}
              onChange={(value) => {
                setSearch(value)
                resetPage()
              }}
              placeholder={t('workshop.searchPlaceholder', 'Order, customer, product, fabric')}
            />
            <ToolbarField label={t('workshop.status', 'Status')}>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as typeof status)
                  resetPage()
                }}
                className={toolbarSelectClass}
              >
                <option value="all">{t('workshop.allStatuses', 'All statuses')}</option>
                <option value="ready">{t('workshop.ready', 'Ready')}</option>
                <option value="not_ready">{t('workshop.notReady', 'Not ready')}</option>
              </select>
            </ToolbarField>
            <Input
              type="date"
              label={t('common.fromDate', 'From date')}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                resetPage()
              }}
            />
            <Input
              type="date"
              label={t('common.toDate', 'To date')}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                resetPage()
              }}
            />
          </FilterToolbar>
          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-start text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('workshop.colOrder', 'Order')}</th>
                    <th className="px-4 py-3">{t('workshop.colProduct', 'Product')}</th>
                    <th className="px-4 py-3">{t('workshop.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('workshop.colFabric', 'Fabric')}</th>
                    <th className="px-4 py-3">{t('workshop.consumed', 'Consumed')}</th>
                    <th className="px-4 py-3">{t('workshop.stockLeft', 'Stock left')}</th>
                    <th className="px-4 py-3">{t('workshop.readyDate', 'Ready date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.itemId} className="border-t border-border text-[13px]">
                      <td className="px-4 py-3 font-semibold">#{row.orderNumber}</td>
                      <td className="px-4 py-3">{row.product}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            row.ready ? 'bg-successBg text-success' : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {row.ready ? t('workshop.ready', 'Ready') : t('workshop.notReady', 'Not ready')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{row.fabrics || '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{row.consumed} {t('common.metersShort')}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.remainingStock || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(row.readyAt)}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('workshop.ledgerEmpty', 'No workshop pieces for these filters.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            onPageChange={setPage}
            label={t('workshop.piecesLabel', 'pieces')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  tint,
  label,
  value,
  hint,
}: {
  tint: 'peach' | 'mint' | 'lavender' | 'sky'
  label: string
  value: string | number
  hint: string
}) {
  const bg = {
    peach: 'bg-[var(--card-peach)]',
    mint: 'bg-[var(--card-mint)]',
    lavender: 'bg-[var(--card-lavender)]',
    sky: 'bg-[var(--card-sky)]',
  }[tint]
  return (
    <Card className={`border-none shadow-none ${bg}`}>
      <CardContent className="pt-5">
        <p className="text-[12px] text-text-secondary">{label}</p>
        <p className="mt-1 text-[22px] font-bold tabular-nums text-text-primary">{value}</p>
        <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
      </CardContent>
    </Card>
  )
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-[13px] text-text-muted">{label}</div>
}
