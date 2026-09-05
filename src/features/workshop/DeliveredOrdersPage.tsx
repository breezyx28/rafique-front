import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  FilterToolbar,
  PaginationBar,
  SearchField,
  ToolbarField,
  toolbarSelectClass,
} from '@/components/ui/DataToolbar'
import {
  useGetWorkshopOrdersQuery,
  useSetWorkshopItemReadinessMutation,
} from '@/features/api/appApi'
import { formatDate } from '@/lib/localeFormat'

const PAGE_SIZE = 10

export function DeliveredOrdersPage() {
  const { t } = useTranslation()
  const { data: orders, isLoading } = useGetWorkshopOrdersQuery()
  const [setReadiness, { isLoading: isUpdating }] = useSetWorkshopItemReadinessMutation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'ready' | 'not_ready'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (orders ?? [])
      .flatMap((order) =>
        order.items.map((item) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          receiptNumber: order.receiptNumber,
          customer: order.customer?.name ?? t('workshop.walkIn', 'Walk-in'),
          deliveredAt: (order.workshopDeliveredAt ?? '').slice(0, 10),
          itemId: item.id!,
          product: item.product?.name ?? '—',
          fabric: item.fabricConsumptions
            .map((row) => `${row.fabric?.name ?? t('workshop.fabric', 'Fabric')} (${row.meters}m)`)
            .join(', '),
          ready: item.workshopStatus === 'ready',
        })),
      )
      .filter((row) => {
        const matchesSearch =
          !q ||
          row.orderNumber.toLowerCase().includes(q) ||
          row.customer.toLowerCase().includes(q) ||
          row.product.toLowerCase().includes(q) ||
          row.fabric.toLowerCase().includes(q)
        const matchesStatus = status === 'all' || (status === 'ready' ? row.ready : !row.ready)
        const matchesFrom = !fromDate || row.deliveredAt >= fromDate
        const matchesTo = !toDate || row.deliveredAt <= toDate
        return matchesSearch && matchesStatus && matchesFrom && matchesTo
      })
  }, [fromDate, orders, search, status, t, toDate])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const resetPage = () => setPage(1)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">
          {t('workshop.delivered', 'Delivered Orders')}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {t(
            'workshop.deliveredSubtitle',
            'Workshop queue after delivery. Mark each sewn piece ready for customer pickup.',
          )}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t('workshop.queueTitle', 'Workshop queue')}</CardTitle>
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
              placeholder={t(
                'workshop.searchPlaceholder',
                'Order #, customer, product, fabric',
              )}
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
              label={t('workshop.deliveredFrom', 'Delivered from')}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                resetPage()
              }}
            />
            <Input
              type="date"
              label={t('workshop.deliveredTo', 'Delivered to')}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                resetPage()
              }}
            />
          </FilterToolbar>

          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-start text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('workshop.colOrder', 'Order')}</th>
                    <th className="px-4 py-3">{t('workshop.colCustomer', 'Customer')}</th>
                    <th className="px-4 py-3">{t('workshop.colProduct', 'Product')}</th>
                    <th className="px-4 py-3">{t('workshop.colFabric', 'Fabric consumed')}</th>
                    <th className="px-4 py-3">{t('workshop.colDelivered', 'Delivered')}</th>
                    <th className="px-4 py-3">{t('workshop.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('workshop.ready', 'Ready')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    pageRows.map((row) => (
                      <tr key={row.itemId} className="border-t border-border text-[13px]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text-primary">#{row.orderNumber}</p>
                          <p className="text-[11px] text-text-muted">
                            {row.receiptNumber ?? t('workshop.noReceipt', 'No receipt yet')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-text-primary">{row.customer}</td>
                        <td className="px-4 py-3 text-text-primary">{row.product}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.fabric || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatDate(row.deliveredAt)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              row.ready
                                ? 'bg-successBg text-success'
                                : 'bg-[#FEF3C7] text-[#B45309]'
                            }`}
                          >
                            {row.ready
                              ? t('workshop.ready', 'Ready')
                              : t('workshop.notReady', 'Not ready')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-semibold">
                            <input
                              type="checkbox"
                              checked={row.ready}
                              disabled={isUpdating}
                              onChange={(event) =>
                                setReadiness({ id: row.itemId, ready: event.target.checked })
                              }
                            />
                            {t('workshop.markReady', 'Mark ready')}
                          </label>
                        </td>
                      </tr>
                    ))}
                  {!isLoading && pageRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t(
                          'workshop.deliveredEmpty',
                          'No orders delivered to workshop for these filters.',
                        )}
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
            total={rows.length}
            onPageChange={setPage}
            label={t('workshop.itemsLabel', 'items')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
