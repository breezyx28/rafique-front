import i18n from '@/lib/i18n'
import { formatDate, formatMoney } from '@/lib/localeFormat'
import { formatPaymentMethod } from '@/lib/displayLabels'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import type { InvoicePayload, InvoiceType } from './types'

function renderPrintableInvoice(order: InvoicePayload, type: InvoiceType) {
  const isCustomer = type === 'customer'
  const isPickup = type === 'pickup'
  const title = isPickup
    ? i18n.t('invoiceDetailsPage.pickupSlip')
    : isCustomer
      ? i18n.t('invoiceDetailsPage.customerInvoice')
      : i18n.t('invoiceDetailsPage.workshopInvoice')
  const lang = (i18n.language || 'en').split('-')[0]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const paymentMethod = formatPaymentMethod(order.paymentMethod)
  const shop = usePreferenceStore.getState()
  const shopName = shop.workshopName || i18n.t('app.shopName')
  const shopAddress = shop.workshopAddress
  const shopPhone = shop.workshopPhone || i18n.t('app.phone')
  const instagram = i18n.t('app.instagram')
  const logoUrl = new URL('/assets/cedar/logo-transparent-black.png', window.location.origin).href
  return `
<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <title>${title} #${order.orderNumber}</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 4mm;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        width: 72mm;
        margin: 0 auto;
        padding: 0;
        background: #fff;
        color: #111827;
        font-family: ${lang === 'ar' ? 'Cairo, Tahoma, sans-serif' : '"Courier New", Courier, monospace'};
        font-size: 11px;
        line-height: 1.35;
      }

      .receipt {
        width: 72mm;
        padding: 0;
      }

      .center {
        text-align: center;
      }

      h1 {
        margin: 4px 0 0;
        font-size: 15px;
        font-weight: 700;
      }

      .logo {
        display: block;
        height: 28mm;
        width: auto;
        margin: 0 auto 2mm;
        object-fit: contain;
      }

      .muted {
        color: #374151;
        margin: 3px 0;
      }

      .sep {
        border-top: 1px dashed #9ca3af;
        margin: 8px 0;
      }

      .block {
        margin-top: 6px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }

      th, td {
        text-align: start;
        border-bottom: 1px dashed #d1d5db;
        padding: 3px 0;
        font-size: 10px;
        vertical-align: top;
      }

      .totals {
        margin-top: 8px;
      }

      .totals p {
        margin: 3px 0;
      }

      @media print {
        html, body {
          width: 72mm;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        <img class="logo" src="${logoUrl}" alt="${shopName}" />
        <h1>${shopName}</h1>
        <p class="muted">${title}</p>
        ${shopAddress ? `<p class="muted">${shopAddress}</p>` : ''}
      </div>
      <div class="sep"></div>
      ${
        isPickup
          ? `<p><strong>${
              order.receiptNumber
                ? i18n.t('invoiceDetailsPage.receiptNumber', { number: order.receiptNumber })
                : i18n.t('invoiceDetailsPage.receiptNotIssued')
            }</strong></p>`
          : order.receiptNumber
            ? `<p><strong>${i18n.t('invoiceDetailsPage.receiptNumber', { number: order.receiptNumber })}</strong></p>`
            : ''
      }
      <p>${i18n.t('invoiceDetailsPage.orderNumber', { orderNumber: order.orderNumber })}</p>
      <p>${i18n.t('invoiceDetailsPage.dateLabel', { date: formatDate(order.submittedAt) })}</p>
      ${isPickup ? '' : `<p>${i18n.t('invoiceDetailsPage.dueLabel', { dueDate: formatDate(order.dueDate) })}</p>`}
      ${isCustomer || isPickup ? `<p>${i18n.t('invoiceDetailsPage.customerLabel')}: ${order.customerName}</p><p>${i18n.t('invoiceDetailsPage.phoneLabel', { phone: order.customerPhone })}</p>` : ''}
      ${isPickup ? `<p>${i18n.t('invoiceDetailsPage.paymentMethod')}: ${paymentMethod}</p>` : ''}
      <div class="sep"></div>
    ${
      isPickup
        ? order.items.map((item) => `<p><strong>${item.product}</strong></p>`).join('')
        : order.items
            .map(
              (item) => `
      <div class="block">
        <strong>${item.product} ${i18n.t('invoiceDetailsPage.qtyWithCount', { qty: item.qty })}</strong>
        ${
          item.measurements.length
            ? `<table>
          <thead><tr><th>${i18n.t('invoiceDetailsPage.measurement')}</th><th>${i18n.t('invoiceDetailsPage.value')}</th></tr></thead>
          <tbody>
            ${item.measurements
              .map((m) => `<tr><td>${m.label}</td><td>${m.value || '—'}</td></tr>`)
              .join('')}
          </tbody>
        </table>`
            : ''
        }
      </div>
    `
            )
            .join('')
    }
    ${
      isCustomer
        ? `<div class="totals">
      <div class="sep"></div>
      <p>${i18n.t('invoiceDetailsPage.total')}: ${formatMoney(order.total)}</p>
      <p>${i18n.t('invoiceDetailsPage.paid')}: ${formatMoney(order.paid)}</p>
      <p>${i18n.t('invoiceDetailsPage.remaining')}: ${formatMoney(order.remaining)}</p>
      <p>${i18n.t('invoiceDetailsPage.paymentMethod')}: ${paymentMethod}</p>
      <p>${i18n.t('invoiceDetailsPage.noteLabel')}: ${order.customerNote || i18n.t('invoiceDetailsPage.customerNoteDefault')}</p>
    </div>`
        : isPickup
          ? ''
          : `<div class="totals">
      <div class="sep"></div>
      <p>${i18n.t('invoiceDetailsPage.workshopNoteLabel')}: ${order.workshopNote || i18n.t('invoiceDetailsPage.workshopNoteDefault')}</p>
      <p>${i18n.t('invoiceDetailsPage.noPriceContacts')}</p>
    </div>`
    }
      <div class="sep"></div>
      <p class="center" dir="ltr">${shopPhone}</p>
      <p class="center" dir="ltr">@${instagram}</p>
      <p class="center muted">${i18n.t('invoiceDetailsPage.thankYou')}</p>
    </div>
  </body>
</html>
`
}

export function printInvoiceAndPickup(order: InvoicePayload) {
  printInvoice(order, 'customer')
  window.setTimeout(() => printInvoice(order, 'pickup'), 600)
}

export function printInvoice(order: InvoicePayload, type: InvoiceType) {
  const printWindow = window.open('', 'PRINT', 'width=420,height=840')
  if (!printWindow) return
  const html = renderPrintableInvoice(order, type)

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }

  // Some browsers fire onload unreliably for about:blank print windows.
  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 300)
  } else {
    printWindow.onload = () => {
      setTimeout(triggerPrint, 300)
    }
  }
}
