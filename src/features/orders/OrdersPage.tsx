import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye, FileText, Pencil, Printer, Search, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { Button } from '@/components/ui/Button'
import type { InvoicePayload } from '@/features/invoices/types'
import { printInvoiceAndPickup } from '@/features/invoices/printInvoice'
import { fabricStockLabel } from '@/lib/fabricStock'
import { formatDate, formatMoney as money } from '@/lib/localeFormat'
import { translateApiMessage } from '@/lib/apiErrors'
import { formatOrderStatus, formatPaymentMethod, getFieldLabel } from '@/lib/displayLabels'
import {
  useDeleteOrderMutation,
  useDeliverOrderToWorkshopMutation,
  useGetInventoryFabricsQuery,
  useGetOrdersQuery,
  useUndoDeliverOrderToWorkshopMutation,
  useUpdateOrderMutation,
} from '@/features/api/appApi'

type OrderType = 'custom' | 'ready' | 'fabric'
type PaymentMethod = 'cash' | 'mbok'
type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'

const statusClassMap: Record<OrderStatus, string> = {
  pending: 'bg-warningBg text-[#B45309]',
  in_progress: 'bg-warningBg text-[#B45309]',
  ready: 'bg-primary-light text-primary',
  delivered: 'bg-successBg text-[#15803D]',
  cancelled: 'bg-dangerBg text-danger',
}

export function OrdersPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<OrderType>('custom')
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'all' | PaymentMethod>('all')
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const { data } = useGetOrdersQuery({
    page,
    limit: 20,
    type: activeTab,
    status: status === 'all' ? undefined : status,
    from: fromDate || undefined,
    to: toDate || undefined,
  })
  const [deleteOrder] = useDeleteOrderMutation()
  const [updateOrder] = useUpdateOrderMutation()
  const [deliverToWorkshop] = useDeliverOrderToWorkshopMutation()
  const [undoDeliver] = useUndoDeliverOrderToWorkshopMutation()
  const { data: fabricsData } = useGetInventoryFabricsQuery({ page: 1, limit: 100 })
  const [confirmDeliver, setConfirmDeliver] = useState<any | null>(null)
  const [undoToast, setUndoToast] = useState<{ id: number; orderNumber: string; expiresAt: number } | null>(null)
  const [undoSeconds, setUndoSeconds] = useState(30)

  useEffect(() => {
    if (!undoToast) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((undoToast.expiresAt - Date.now()) / 1000))
      setUndoSeconds(left)
      if (left <= 0) setUndoToast(null)
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [undoToast])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.data ?? []).filter((o) => {
      const customerName = o.customer?.name ?? t('orders.walkIn')
      const products = [
        ...(o.items ?? []).map((item) => item.product?.name || t('orders.unnamedItem', { id: item.productId ?? '' })),
        ...(o.fabricSales ?? []).map((item) =>
          t('orders.fabricSaleLine', {
            name: item.fabric?.name ?? t('orders.new.fabric'),
            meters: item.meters,
            unit: t('common.metersShort'),
          })
        ),
      ].join(', ')
      const method = o.paymentMethod ?? 'cash'
      const matchesSearch =
        !q ||
        String(o.id).includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.receiptNumber ?? '').toLowerCase().includes(q) ||
        products.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      const matchesCustomer = !customer || customerName.toLowerCase().includes(customer.toLowerCase())
      const matchesMethod = paymentMethod === 'all' || method === paymentMethod
      return matchesSearch && matchesCustomer && matchesMethod
    })
  }, [customer, data?.data, paymentMethod, search, t])

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? filteredOrders.length) / (data?.meta.limit ?? 20)))

  const toInvoicePayload = (row: any): InvoicePayload => ({
    orderNumber: row.orderNumber,
    receiptNumber: row.receiptNumber,
    submittedAt: (row.createdAt ?? '').slice(0, 10),
    customerName: row.customer?.name ?? t('orders.walkIn'),
    customerPhone: row.customer?.phone ?? '—',
    dueDate: (row.dueDate ?? '').slice(0, 10) || '—',
    customerNote: row.noteCustomer ?? '',
    workshopNote: row.noteWorkshop ?? '',
    paymentMethod: row.paymentMethod ?? 'cash',
    total: row.total,
    paid: row.paid,
    remaining: Math.max(0, row.total - row.paid),
    items: (row.items ?? []).map((item: any) => ({
      product: item.product?.name ?? t('orders.unnamedItem', { id: item.productId ?? '' }),
      qty: item.qty,
      unitPrice: item.unitPrice,
      subtotal: item.qty * item.unitPrice,
      measurements: (item.measurements ?? []).map((m: any) => ({
        label: getFieldLabel(m.field),
        value: m.value ?? '',
      })),
    })),
  })

  return (
    <div className="space-y-5">
      {undoToast && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-warningBg px-4 py-3 text-[13px] text-[#B45309]">
          <p>
            {t('orders.undoToast', { orderNumber: undoToast.orderNumber, seconds: undoSeconds })}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await undoDeliver(undoToast.id).unwrap()
                setUndoToast(null)
              } catch (error) {
                const apiError = error as { data?: { message?: string } }
                window.alert(apiError.data?.message ? translateApiMessage(apiError.data.message) : t('orders.undoExpired'))
                setUndoToast(null)
              }
            }}
          >
            {t('orders.undo')}
          </Button>
        </div>
      )}
      <div>
        <h1 className="text-[28px] font-bold text-text-primary">
          {t('ordersPage.title', 'Orders Report')}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {t('ordersPage.subtitle', 'Track custom and ready orders with filters and actions.')}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex rounded-full bg-[#F5F5F5] p-[3px]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('custom')
                setPage(1)
              }}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                activeTab === 'custom' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('orders.customOrders', 'Custom Orders')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ready')
                setPage(1)
              }}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                activeTab === 'ready' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('orders.readyOrders', 'Ready Orders')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('fabric')
                setPage(1)
              }}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                activeTab === 'fabric' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('orders.fabricOrders', 'Fabric Sales')}
            </button>
          </div>
          <Button variant="secondary" size="sm" className="gap-1">
            <FileText className="h-4 w-4" />
            {t('ordersPage.export', 'Export')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2 min-w-0">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={t('ordersPage.searchPlaceholder', 'Search order #, customer, product')}
                  className="ps-9"
                />
              </div>
            </div>
            <Input
              value={customer}
              onChange={(e) => {
                setCustomer(e.target.value)
                setPage(1)
              }}
              aria-label={t('ordersPage.customerPlaceholder', 'Customer name')}
              placeholder={t('ordersPage.customerPlaceholder', 'Customer name')}
              className="min-w-0"
            />
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value as 'all' | PaymentMethod)
                setPage(1)
              }}
              aria-label={t('orders.method', 'Method')}
              className="h-10 rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            >
              <option value="all">{t('ordersPage.allMethods', 'All methods')}</option>
              <option value="cash">{t('orders.cash', 'Cash')}</option>
              <option value="mbok">{t('orders.mbok', 'MBOK')}</option>
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'all' | OrderStatus)
                setPage(1)
              }}
              aria-label={t('orders.status', 'Status')}
              className="h-10 rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            >
              <option value="all">{t('ordersPage.allStatus', 'All status')}</option>
              <option value="pending">{t('dashboard.status.pending')}</option>
              <option value="in_progress">{t('dashboard.status.in_progress')}</option>
              <option value="ready">{t('dashboard.status.ready')}</option>
              <option value="delivered">{t('dashboard.status.delivered')}</option>
              <option value="cancelled">{t('dashboard.status.cancelled')}</option>
            </select>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <Input
                type="date"
                label={t('common.fromDate', 'From date')}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <Input
                type="date"
                label={t('common.toDate', 'To date')}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-start text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('orders.orderNumber', 'Order #')}</th>
                    <th className="px-4 py-3">{t('orders.receiptNumber', 'Receipt #')}</th>
                    <th className="px-4 py-3">{t('orders.customer', 'Customer')}</th>
                    <th className="px-4 py-3">{t('orders.products', 'Products')}</th>
                    <th className="px-4 py-3">{t('orders.date', 'Date')}</th>
                    <th className="px-4 py-3">{t('orders.dueDate', 'Due Date')}</th>
                    <th className="px-4 py-3">{t('orders.total', 'Total')}</th>
                    <th className="px-4 py-3">{t('orders.paid', 'Paid')}</th>
                    <th className="px-4 py-3">{t('orders.remaining', 'Remaining')}</th>
                    <th className="px-4 py-3">{t('orders.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('orders.method', 'Method')}</th>
                    <th className="px-4 py-3">{t('orders.workshop', 'Workshop')}</th>
                    <th className="px-4 py-3">{t('customersPage.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((row) => {
                    const remaining = row.remaining ?? row.total - row.paid
                    const products = [
                      ...(row.items ?? []).map((item: any) => item.product?.name || t('orders.unnamedItem', { id: item.productId ?? '' })),
                      ...(row.fabricSales ?? []).map((item: any) =>
                        t('orders.fabricSaleLine', {
                          name: item.fabric?.name ?? t('orders.new.fabric'),
                          meters: item.meters,
                          unit: t('common.metersShort'),
                        })
                      ),
                    ].join(', ')
                    const method = formatPaymentMethod(row.paymentMethod)
                    return (
                      <tr key={String(row.id)} className="border-t border-border text-[13px]">
                        <td className="px-4 py-3 font-semibold text-text-primary">#{row.orderNumber}</td>
                        <td className="px-4 py-3 text-text-secondary">{row.receiptNumber ?? '—'}</td>
                        <td className="px-4 py-3 text-text-primary">
                          {row.customer?.name ?? t('orders.walkIn', 'Walk-in')}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{products || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatDate(row.createdAt)}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatDate(row.dueDate)}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{money(row.total)}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{money(row.paid)}</td>
                        <td className={`px-4 py-3 font-semibold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                          {money(remaining)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClassMap[row.status as OrderStatus]}`}>
                            {formatOrderStatus(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-primary">{method}</td>
                        <td className="px-4 py-3">
                          {row.type === 'custom' ? (
                            <div className="flex flex-col gap-1">
                              <label className="inline-flex items-center gap-2 text-[12px] text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={!!row.workshopDeliveredAt}
                                  disabled={!!row.workshopDeliveredAt}
                                  onChange={(event) => {
                                    event.target.checked = false
                                    if (!row.workshopDeliveredAt) setConfirmDeliver(row)
                                  }}
                                />
                                {row.workshopDeliveredAt ? t('orders.inWorkshop') : t('orders.deliver')}
                              </label>
                              {row.status === 'ready' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    await updateOrder({ id: row.id, body: { status: 'delivered' } }).unwrap()
                                  }}
                                >
                                  {t('orders.customerCollected')}
                                </Button>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-text-secondary">
                            <button
                              type="button"
                              onClick={() => navigate(`/invoices/${String(row.id)}?type=customer`, { state: { order: toInvoicePayload(row) } })}
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label={t('orders.view')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingOrder({
                                  ...row,
                                  items: (row.items ?? []).map((item: any) => ({
                                    ...item,
                                    fabricId: item.fabricConsumptions?.[0]?.fabricId ?? '',
                                    fabricMeters: item.fabricConsumptions?.[0]?.meters ?? '',
                                  })),
                                })
                              }
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label={t('orders.edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  t('ordersPage.deleteConfirm', 'Delete order #{{id}}?', {
                                    id: row.id,
                                  })
                                )
                                if (!confirmed) return
                                await deleteOrder(row.id)
                              }}
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label={t('orders.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => printInvoiceAndPickup(toInvoicePayload(row))}
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label={t('orders.printInvoice')}
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t(
                          'ordersPage.noResults',
                          'No orders found for current filters.'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-muted">
              {t('ordersPage.showing', 'Showing {{count}} of {{total}} orders', {
                count: filteredOrders.length,
                total: data?.meta.total ?? filteredOrders.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                {t('ordersPage.previousPage', 'Previous')}
              </Button>
              <span className="text-[12px] text-text-secondary">
                {t('ordersPage.pageOf', 'Page {{page}} / {{total}}', { page, total: totalPages })}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                {t('ordersPage.nextPage', 'Next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('ordersPage.editTitle', 'Edit Order #{{id}}', { id: editingOrder.id })}
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <NumberInput
                label={t('ordersPage.editPaidLabel', 'Paid')}
                format="money"
                min={0}
                value={editingOrder.paid}
                onValueChange={(paid) => setEditingOrder({ ...editingOrder, paid })}
                placeholder={t('common.pricePlaceholder', 'e.g. 700,000')}
              />
              {editingOrder.status === 'ready' && (
                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={async () => {
                      await updateOrder({ id: editingOrder.id, body: { status: 'delivered' } }).unwrap()
                      setEditingOrder(null)
                    }}
                  >
                    {t('orders.customerCollected')}
                  </Button>
                </div>
              )}
            </div>
            {editingOrder.type === 'custom' && !editingOrder.workshopDeliveredAt && (
              <div className="mt-4 space-y-3">
                <p className="text-[12px] font-semibold text-text-secondary">{t('orders.new.steps.fabricAndMeters')}</p>
                {(editingOrder.items ?? []).map((item: any, index: number) => (
                  <div key={item.id ?? index} className="grid gap-2 rounded-[10px] border border-border p-3 md:grid-cols-2">
                    <p className="md:col-span-2 text-[13px] font-semibold">{item.product?.name ?? t('orders.unnamedItem', { id: item.id })}</p>
                    <select
                      value={item.fabricId}
                      onChange={(e) => {
                        const items = [...editingOrder.items]
                        items[index] = { ...items[index], fabricId: Number(e.target.value) }
                        setEditingOrder({ ...editingOrder, items })
                      }}
                      aria-label={t('orders.new.fabric', 'Fabric')}
                      className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                    >
                      <option value="">{t('orders.new.selectFabric', 'Select fabric')}</option>
                      {(fabricsData?.data ?? []).map((fabric) => (
                        <option key={fabric.id} value={fabric.id}>
                          {fabricStockLabel(fabric.name, fabric.qty, fabric.packageMeters)}
                        </option>
                      ))}
                    </select>
                    <NumberInput
                      label={t('orders.new.fabricMeters', 'Total fabric meters')}
                      format="decimal"
                      min={0.01}
                      value={Number(item.fabricMeters) || 0}
                      onValueChange={(fabricMeters) => {
                        const items = [...editingOrder.items]
                        items[index] = { ...items[index], fabricMeters }
                        setEditingOrder({ ...editingOrder, items })
                      }}
                      placeholder={t('common.metersPlaceholder', '0')}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingOrder(null)}>
                {t('ordersPage.editCancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  await updateOrder({
                    id: editingOrder.id,
                    body: {
                      paid: Number(editingOrder.paid),
                      items:
                        editingOrder.type === 'custom' && !editingOrder.workshopDeliveredAt
                          ? (editingOrder.items ?? [])
                              .filter((item: any) => item.id && item.fabricId && Number(item.fabricMeters) > 0)
                              .map((item: any) => ({
                                itemId: item.id,
                                fabricId: Number(item.fabricId),
                                fabricMeters: Number(item.fabricMeters),
                              }))
                          : undefined,
                    },
                  }).unwrap()
                  setEditingOrder(null)
                }}
              >
                {t('ordersPage.editSave', 'Save Changes')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {confirmDeliver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">{t('orders.deliverToWorkshop')}</h3>
            <p className="mt-2 text-[13px] text-text-secondary">
              {t('orders.deliverConfirm', { orderNumber: confirmDeliver.orderNumber })}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeliver(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await deliverToWorkshop(confirmDeliver.id).unwrap()
                    setUndoToast({
                      id: confirmDeliver.id,
                      orderNumber: confirmDeliver.orderNumber,
                      expiresAt: Date.now() + 30_000,
                    })
                    setConfirmDeliver(null)
                  } catch (error) {
                    const apiError = error as { data?: { message?: string | string[] } }
                    const message = apiError.data?.message
                    window.alert(
                      message ? translateApiMessage(message) : t('orders.deliverError')
                    )
                  }
                }}
              >
                {t('orders.confirmDeliver')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

