import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { InvoicePayload, InvoiceType } from './types'
import { money } from './types'
import { printInvoice } from './printInvoice'
import { useGetOrderByIdQuery } from '@/features/api/appApi'

function getFieldLabelForLang(
  field: { fieldKey: string; i18n?: Array<{ lang: string; label: string }> } | undefined,
  lang: string
): string {
  if (!field) return 'Measurement'
  const current = (lang || 'en').slice(0, 2)
  const entry =
    field.i18n?.find((i) => i.lang === current) ??
    field.i18n?.find((i) => i.lang === 'en') ??
    field.i18n?.[0]
  return entry?.label ?? field.fieldKey ?? 'Measurement'
}

export function InvoiceDetailsPage() {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'en').slice(0, 2)
  const { orderNumber = '' } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const incomingOrder = (location.state as { order?: InvoicePayload } | null)?.order
  const typeParam = searchParams.get('type')
  const type: InvoiceType = typeParam === 'workshop' ? 'workshop' : 'customer'
  const orderId = Number(orderNumber)
  const { data: apiOrder } = useGetOrderByIdQuery(orderId, { skip: Number.isNaN(orderId) })

  const order: InvoicePayload | undefined = apiOrder
    ? {
        orderNumber: String(apiOrder.id),
        submittedAt: (apiOrder.createdAt ?? '').slice(0, 10),
        customerName: apiOrder.customer?.name ?? 'Walk-in',
        customerPhone: apiOrder.customer?.phone ?? '—',
        dueDate: (apiOrder.dueDate ?? '').slice(0, 10) || '—',
        customerNote: apiOrder.noteCustomer ?? '',
        workshopNote: apiOrder.noteWorkshop ?? '',
        paymentMethod: (apiOrder.paymentMethod ?? 'cash').toUpperCase() as 'Cash' | 'MBOK',
        total: apiOrder.total,
        paid: apiOrder.paid,
        remaining: apiOrder.remaining ?? Math.max(0, apiOrder.total - apiOrder.paid),
        items: (apiOrder.items ?? []).map((item) => ({
          product: item.product?.name ?? `Product ${item.productId ?? ''}`,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal ?? item.qty * item.unitPrice,
          measurements: (item.measurements ?? []).map((m) => ({
            label: getFieldLabelForLang(m.field, currentLang),
            value: m.value ?? '',
          })),
        })),
      }
    : incomingOrder

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('invoiceDetailsPage.notFoundTitle', 'Invoice not found')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[13px] text-text-secondary">
            {t('invoiceDetailsPage.notFoundMessage', 'No invoice record found for order #{{orderNumber}}.', { orderNumber })}
          </p>
          <Button asChild variant="outline">
            <Link to="/invoices">
              <ArrowLeft className="h-4 w-4" />
              {t('invoiceDetailsPage.backToInvoices', 'Back to invoices')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">
            {type === 'customer' ? t('invoiceDetailsPage.customerInvoice', 'Customer Invoice') : t('invoiceDetailsPage.workshopInvoice', 'Workshop Invoice')}
          </h1>
          <p className="text-[13px] text-text-secondary">
            {t('invoiceDetailsPage.orderDue', 'Order #{{orderNumber}} · Due: {{dueDate}}', { orderNumber: order.orderNumber, dueDate: order.dueDate })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/invoices">
              <ArrowLeft className="h-4 w-4" />
              {t('invoiceDetailsPage.back', 'Back')}
            </Link>
          </Button>
          <Button className="gap-1" onClick={() => printInvoice(order, type)}>
            <Printer className="h-4 w-4" />
            {type === 'customer' ? t('invoiceDetailsPage.printCustomer', 'Print Customer') : t('invoiceDetailsPage.printWorkshop', 'Print Workshop')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="inline-flex rounded-full bg-[#F5F5F5] p-[3px]">
            <Link
              to={`/invoices/${order.orderNumber}?type=customer`}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                type === 'customer' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('invoiceDetailsPage.customerInvoice', 'Customer Invoice')}
            </Link>
            <Link
              to={`/invoices/${order.orderNumber}?type=workshop`}
              className={`rounded-full px-4 py-1 text-[12px] font-medium ${
                type === 'workshop' ? 'bg-[#1A1A2E] text-white' : 'text-text-muted'
              }`}
            >
              {t('invoiceDetailsPage.workshopInvoice', 'Workshop Invoice')}
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-[18px]">
            {type === 'customer' ? t('invoiceDetailsPage.customerInvoice', 'Customer Invoice') : t('invoiceDetailsPage.workshopInvoice', 'Workshop Invoice')}
          </CardTitle>
          <p className="text-[12px] text-text-secondary">
            {t('invoiceDetailsPage.orderDateDue', 'Order #{{orderNumber}} · Date: {{date}} · Due: {{dueDate}}', {
              orderNumber: order.orderNumber,
              date: order.submittedAt,
              dueDate: order.dueDate,
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {type === 'customer' ? (
            <>
              <div className="text-[13px]">
                <p className="font-semibold text-text-primary">{t('app.shopName', 'Rafique Tailors')}</p>
                <p className="text-text-secondary">Khartoum, Sudan · 0912345678</p>
                <p className="mt-2 text-text-secondary">
                  {t('invoiceDetailsPage.customerLabel', 'Customer')}: {order.customerName} · {order.customerPhone}
                </p>
              </div>
              {order.items.map((item) => (
                <div key={`${item.product}-${item.qty}`} className="space-y-2">
                  <p className="text-[13px] font-semibold text-text-primary">
                    {item.product} ({t('invoiceDetailsPage.qty', 'qty')}: {item.qty})
                  </p>
                  <div className="overflow-hidden rounded-[10px] border border-border">
                    <table className="w-full">
                      <thead className="bg-[#FAFAFA]">
                        <tr className="text-left text-[12px] font-medium text-text-muted">
                          <th className="px-4 py-2">{t('invoiceDetailsPage.measurement', 'Measurement')}</th>
                          <th className="px-4 py-2">{t('invoiceDetailsPage.value', 'Value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.measurements.map((m) => (
                          <tr key={`${item.product}-${m.label}`} className="border-t border-border text-[13px]">
                            <td className="px-4 py-2 text-text-primary">{m.label}</td>
                            <td className="px-4 py-2 text-text-secondary">{m.value || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 text-[13px] sm:grid-cols-2">
                <p><span className="text-text-muted">{t('invoiceDetailsPage.total', 'Total')}:</span> {money(order.total)}</p>
                <p><span className="text-text-muted">{t('invoiceDetailsPage.paid', 'Paid')}:</span> {money(order.paid)}</p>
                <p><span className="text-text-muted">{t('invoiceDetailsPage.remaining', 'Remaining')}:</span> {money(order.remaining)}</p>
                <p><span className="text-text-muted">{t('invoiceDetailsPage.paymentMethod', 'Payment Method')}:</span> {order.paymentMethod}</p>
              </div>
              <p className="text-[12px] text-text-secondary">
                {t('invoiceDetailsPage.noteLabel', 'Note')}: {order.customerNote || t('invoiceDetailsPage.customerNoteDefault', 'Please bring this receipt when collecting.')}
              </p>
            </>
          ) : (
            <>
              <div className="text-[13px] text-text-secondary">
                <p>
                  {t('invoiceDetailsPage.orderDueLabel', 'ORDER #{{orderNumber}} · DUE: {{dueDate}}', { orderNumber: order.orderNumber, dueDate: order.dueDate })}
                </p>
              </div>
              {order.items.map((item) => (
                <div key={`${item.product}-workshop-${item.qty}`} className="rounded-[10px] border border-border p-3 text-[13px]">
                  <p className="font-semibold text-text-primary">
                    {item.product.toUpperCase()} ({t('invoiceDetailsPage.qty', 'qty')}: {item.qty})
                  </p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {item.measurements.map((m) => (
                      <p key={`${item.product}-m-${m.label}`} className="text-text-secondary">
                        {m.label}: {m.value || '—'}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[12px] text-text-secondary">
                {t('invoiceDetailsPage.workshopNoteLabel', 'Workshop Note')}: {order.workshopNote || t('invoiceDetailsPage.workshopNoteDefault', 'No workshop note.')}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

