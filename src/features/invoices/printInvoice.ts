import type { InvoicePayload, InvoiceType } from './types'
import { money } from './types'

function renderPrintableInvoice(order: InvoicePayload, type: InvoiceType) {
  const isCustomer = type === 'customer'
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${isCustomer ? 'Customer' : 'Workshop'} Invoice #${order.orderNumber}</title>
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
        font-family: "Courier New", Courier, monospace;
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
        margin: 0;
        font-size: 15px;
        font-weight: 700;
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
        text-align: left;
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
        <h1>Rafique Tailors</h1>
        <p class="muted">${isCustomer ? 'CUSTOMER' : 'WORKSHOP'} INVOICE</p>
      </div>
      <div class="sep"></div>
      <p>Order #${order.orderNumber}</p>
      <p>Date: ${order.submittedAt}</p>
      <p>Due: ${order.dueDate}</p>
      ${isCustomer ? `<p>Customer: ${order.customerName}</p><p>Phone: ${order.customerPhone}</p>` : ''}
      <div class="sep"></div>
    ${order.items
      .map(
        (item) => `
      <div class="block">
        <strong>${item.product} (qty: ${item.qty})</strong>
        <table>
          <thead><tr><th>Measurement</th><th>Value</th></tr></thead>
          <tbody>
            ${item.measurements
              .map((m) => `<tr><td>${m.label}</td><td>${m.value || '—'}</td></tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
    `
      )
      .join('')}
    ${
      isCustomer
        ? `<div class="totals">
      <div class="sep"></div>
      <p>Total: ${money(order.total)}</p>
      <p>Paid: ${money(order.paid)}</p>
      <p>Remaining: ${money(order.remaining)}</p>
      <p>Payment Method: ${order.paymentMethod}</p>
      <p>Note: ${order.customerNote || 'Please bring this receipt when collecting.'}</p>
    </div>`
        : `<div class="totals">
      <div class="sep"></div>
      <p>Workshop Note: ${order.workshopNote || 'No workshop note.'}</p>
      <p>No price, no customer contacts.</p>
    </div>`
    }
      <div class="sep"></div>
      <p class="center muted">Thank you</p>
    </div>
  </body>
</html>
`
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

