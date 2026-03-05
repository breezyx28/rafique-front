import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye, FileText, Pencil, Printer, Search, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { InvoicePayload } from '@/features/invoices/types'
import { printInvoice } from '@/features/invoices/printInvoice'
import { useDeleteOrderMutation, useGetOrdersQuery, useUpdateOrderMutation } from '@/features/api/appApi'

type OrderType = 'custom' | 'ready'
type PaymentMethod = 'cash' | 'mbok'
type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'

const statusClassMap: Record<OrderStatus, string> = {
  pending: 'bg-warningBg text-[#B45309]',
  in_progress: 'bg-warningBg text-[#B45309]',
  ready: 'bg-primary-light text-primary',
  delivered: 'bg-successBg text-[#15803D]',
  cancelled: 'bg-dangerBg text-danger',
}

const money = (v: number) => `${v.toLocaleString()} SDG`

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

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.data ?? []).filter((o) => {
      const customerName = o.customer?.name ?? 'Walk-in'
      const products = (o.items ?? []).map((item) => item.product?.name || `Item ${item.productId ?? ''}`).join(', ')
      const method = o.paymentMethod ?? 'cash'
      const matchesSearch = !q || String(o.id).includes(q) || products.toLowerCase().includes(q) || customerName.toLowerCase().includes(q)
      const matchesCustomer = !customer || customerName.toLowerCase().includes(customer.toLowerCase())
      const matchesMethod = paymentMethod === 'all' || method === paymentMethod
      return matchesSearch && matchesCustomer && matchesMethod
    })
  }, [customer, data?.data, paymentMethod, search])

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? filteredOrders.length) / (data?.meta.limit ?? 20)))

  const toInvoicePayload = (row: any): InvoicePayload => ({
    orderNumber: String(row.id),
    submittedAt: (row.createdAt ?? '').slice(0, 10),
    customerName: row.customer?.name ?? 'Walk-in',
    customerPhone: row.customer?.phone ?? '—',
    dueDate: (row.dueDate ?? '').slice(0, 10) || '—',
    customerNote: row.noteCustomer ?? '',
    workshopNote: row.noteWorkshop ?? '',
    paymentMethod: (row.paymentMethod ?? 'cash').toUpperCase() as 'Cash' | 'MBOK',
    total: row.total,
    paid: row.paid,
    remaining: Math.max(0, row.total - row.paid),
    items: (row.items ?? []).map((item: any) => ({
      product: item.product?.name ?? `Product ${item.productId ?? ''}`,
      qty: item.qty,
      unitPrice: item.unitPrice,
      subtotal: item.qty * item.unitPrice,
      measurements: (item.measurements ?? []).map((m: any) => ({ label: m.field?.fieldKey ?? 'Measurement', value: m.value ?? '' })),
    })),
  })

  return (
    <div className="space-y-5">
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
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={t('ordersPage.searchPlaceholder', 'Search order #, customer, product')}
                  className="pl-9"
                />
              </div>
            </div>
            <Input
              value={customer}
              onChange={(e) => {
                setCustomer(e.target.value)
                setPage(1)
              }}
              placeholder={t('ordersPage.customerPlaceholder', 'Customer name')}
              className="min-w-0"
            />
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value as 'all' | PaymentMethod)
                setPage(1)
              }}
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
              className="h-10 rounded-[6px] border border-border bg-surface px-3 text-[13px] text-text-primary"
            >
              <option value="all">{t('ordersPage.allStatus', 'All status')}</option>
              <option value="pending">{t('ordersPage.statusPending', 'pending')}</option>
              <option value="in_progress">
                {t('ordersPage.statusInProgress', 'in_progress')}
              </option>
              <option value="ready">{t('ordersPage.statusReady', 'ready')}</option>
              <option value="delivered">{t('ordersPage.statusDelivered', 'delivered')}</option>
              <option value="cancelled">{t('ordersPage.statusCancelled', 'cancelled')}</option>
            </select>
            <div className="flex min-w-0 items-center gap-2">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-left text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">{t('orders.orderNumber', 'Order #')}</th>
                    <th className="px-4 py-3">{t('orders.customer', 'Customer')}</th>
                    <th className="px-4 py-3">{t('orders.products', 'Products')}</th>
                    <th className="px-4 py-3">{t('orders.date', 'Date')}</th>
                    <th className="px-4 py-3">{t('orders.dueDate', 'Due Date')}</th>
                    <th className="px-4 py-3">{t('orders.total', 'Total')}</th>
                    <th className="px-4 py-3">{t('orders.paid', 'Paid')}</th>
                    <th className="px-4 py-3">{t('orders.remaining', 'Remaining')}</th>
                    <th className="px-4 py-3">{t('orders.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('orders.method', 'Method')}</th>
                    <th className="px-4 py-3">{t('customersPage.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((row) => {
                    const remaining = row.remaining ?? row.total - row.paid
                    const products = (row.items ?? []).map((item: any) => item.product?.name || `Item ${item.productId ?? ''}`).join(', ')
                    const method = (row.paymentMethod ?? 'cash').toUpperCase()
                    return (
                      <tr key={String(row.id)} className="border-t border-border text-[13px]">
                        <td className="px-4 py-3 font-semibold text-text-primary">#{row.id}</td>
                        <td className="px-4 py-3 text-text-primary">
                          {row.customer?.name ?? t('orders.walkIn', 'Walk-in')}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{products || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{(row.createdAt ?? '').slice(0, 10) || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{(row.dueDate ?? '').slice(0, 10) || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{money(row.total)}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{money(row.paid)}</td>
                        <td className={`px-4 py-3 font-semibold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                          {money(remaining)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClassMap[row.status as OrderStatus]}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-primary">{method}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-text-secondary">
                            <button
                              type="button"
                              onClick={() => navigate(`/invoices/${String(row.id)}?type=customer`, { state: { order: toInvoicePayload(row) } })}
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOrder({ ...row })}
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label="Edit"
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
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => printInvoice(toInvoicePayload(row), 'customer')}
                              className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                              aria-label="Print"
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
                      <td colSpan={11} className="px-4 py-8 text-center text-[13px] text-text-muted">
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
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('ordersPage.editStatusLabel', 'Status')}
                </label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as OrderStatus })}
                  className="h-10 w-full rounded-[6px] border border-border bg-white px-3 text-[13px]"
                >
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="ready">ready</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-secondary">
                  {t('ordersPage.editPaidLabel', 'Paid')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editingOrder.paid}
                  onChange={(e) => setEditingOrder({ ...editingOrder, paid: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingOrder(null)}>
                {t('ordersPage.editCancel', 'Cancel')}
              </Button>
              <Button
                onClick={async () => {
                  await updateOrder({ id: editingOrder.id, body: { status: editingOrder.status, paid: Number(editingOrder.paid) } })
                  setEditingOrder(null)
                }}
              >
                {t('ordersPage.editSave', 'Save Changes')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

