import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDeleteCustomerMutation, useGetCustomerByIdQuery, useGetCustomersQuery } from '@/features/api/appApi'

const money = (v: number) => `${v.toLocaleString()} SDG`

export function CustomersPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [historyCustomerId, setHistoryCustomerId] = useState<number | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null)
  const searchParams = useMemo(() => {
    const params: { page: number; limit: number; search?: string; phone?: string } = { page: 1, limit: 100 }
    if (search.trim()) params.search = search.trim()
    if (phoneFilter.trim()) params.phone = phoneFilter.trim()
    return params
  }, [search, phoneFilter])
  const { data, isLoading } = useGetCustomersQuery(searchParams)
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()
  const { data: historyCustomer } = useGetCustomerByIdQuery(historyCustomerId ?? 0, { skip: !historyCustomerId })

  const rows = useMemo(() => {
    return (data?.data ?? []).map((customer) => {
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? '',
        ordersCount: customer.ordersCount ?? 0,
        totalSpent: customer.totalSpent ?? 0,
        lastOrderDate: customer.lastOrderDate ?? '—',
      }
    })
  }, [data?.data])

  const confirmDelete = async () => {
    if (!deletingCustomerId) return
    await deleteCustomer(deletingCustomerId)
    setDeletingCustomerId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {t('customersPage.title', 'Customers')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t(
              'customersPage.subtitle',
              'Manage customer profiles, spending, and order history.'
            )}
          </p>
        </div>
        <Button className="gap-1" onClick={() => navigate('/orders/new')}>
          <Plus className="h-4 w-4" />
          {t('customersPage.addCustomer', 'Add Customer')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {t('customersPage.managementTitle', 'Customer Management')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  'customersPage.searchByName',
                  'Search customer by name'
                )}
                className="pl-9"
              />
            </div>
            <Input
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder={t('customersPage.filterByPhone', 'Filter by phone')}
            />
          </div>

          <div className="overflow-hidden rounded-[12px] border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead className="bg-[#FAFAFA]">
                  <tr className="text-left text-[12px] font-medium text-text-muted">
                    <th className="px-4 py-3">
                      {t('customersPage.name', 'Name')}
                    </th>
                    <th className="px-4 py-3">
                      {t('customersPage.phone', 'Phone')}
                    </th>
                    <th className="px-4 py-3">
                      {t('customersPage.ordersCount', 'Orders Count')}
                    </th>
                    <th className="px-4 py-3">
                      {t('customersPage.totalSpent', 'Total Spent')}
                    </th>
                    <th className="px-4 py-3">
                      {t('customersPage.lastOrderDate', 'Last Order Date')}
                    </th>
                    <th className="px-4 py-3">
                      {t('customersPage.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={String(c.id)} className="border-t border-border text-[13px]">
                      <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.phone}</td>
                      <td className="px-4 py-3 text-text-primary">{c.ordersCount}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{money(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.lastOrderDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-text-secondary">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              navigate('/orders/new', {
                                state: { selectedCustomer: { id: c.id, name: c.name, phone: c.phone } },
                              })
                            }
                          >
                            {t('customersPage.createOrder', 'Create Order')}
                          </Button>
                          <button
                            type="button"
                            onClick={() => navigate(`/customers/${String(c.id)}/edit`)}
                            className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                            aria-label="Edit customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryCustomerId(c.id)}
                            className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                            aria-label="View history"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCustomerId(c.id)}
                            className="rounded-md p-1.5 hover:bg-[#F5F5F5]"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-text-muted">
                        {t('customersPage.noCustomers', 'No customers found.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-[rgba(0,0,0,0.28)]">
          <div className="h-full w-full max-w-md bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-text-primary">
                {t('customersPage.orderHistoryTitle', 'Order History')}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setHistoryCustomerId(null)}>
                {t('customersPage.orderHistoryClose', 'Close')}
              </Button>
            </div>
            <p className="mt-1 text-[13px] text-text-secondary">{historyCustomer.name} · {historyCustomer.phone || '—'}</p>
            <div className="mt-4 space-y-2">
              {(historyCustomer.orders ?? []).map((order: any) => (
                <div key={String(order.id)} className="rounded-[10px] border border-border p-3">
                  <p className="text-[13px] font-semibold text-text-primary">Order #{order.id}</p>
                  <p className="text-[12px] text-text-muted">{(order.type ?? 'custom').toUpperCase()} · {(order.status ?? 'pending')}</p>
                  <p className="mt-1 text-[12px] text-text-secondary">{(order.createdAt ?? '').slice(0, 10) || '—'}</p>
                </div>
              ))}
              {!historyCustomer.orders?.length && (
                <p className="text-[13px] text-text-muted">
                  {t(
                    'customersPage.orderHistoryEmpty',
                    'No orders found for this customer.'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {deletingCustomerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-lg">
            <h3 className="text-[18px] font-semibold text-text-primary">
              {t('customersPage.deleteTitle', 'Delete Customer')}
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              {t(
                'customersPage.deleteMessage',
                'Are you sure you want to delete this customer?'
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingCustomerId(null)}>
                {t('customersPage.deleteCancel', 'Cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                {t('customersPage.deleteConfirm', 'Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

