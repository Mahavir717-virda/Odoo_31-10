/**
 * Renders print-friendly HTML for an invoice
 * @param {object} invoice
 * @returns {string} HTML content
 */
const renderInvoicePrintHtml = (invoice) => {
  const linesRows = (invoice.lines || [])
    .map(
      (l) => `
      <tr>
        <td>${l.description || l.product_name || 'Item'}</td>
        <td style="text-align: center;">${l.quantity}</td>
        <td style="text-align: right;">$${Number(l.unit_price).toFixed(2)}</td>
        <td style="text-align: right;">${Number(l.tax_rate)}%</td>
        <td style="text-align: right;">$${Number(l.tax_amount).toFixed(2)}</td>
        <td style="text-align: right;">$${Number(l.amount).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const discountsSection =
    invoice.discounts && invoice.discounts.length > 0
      ? `
      <div style="margin-top: 15px;">
        <h4 style="margin-bottom: 5px; color: #4b5563;">Discounts Applied</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid #e5e7eb; text-align: left;">
              <th style="padding: 4px 0;">Discount</th>
              <th style="padding: 4px 0; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.discounts
              .map(
                (d) => `
              <tr>
                <td style="padding: 4px 0;">${d.discount_name}</td>
                <td style="padding: 4px 0; text-align: right; color: #16a34a;">-$${Number(d.amount).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.number}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1f2937;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company h1 {
      margin: 0 0 5px 0;
      font-size: 26px;
      color: #111827;
    }
    .company p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      margin: 0;
      font-size: 24px;
      color: #2563eb;
    }
    .badge {
      display: inline-block;
      margin-top: 5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-DRAFT { background: #f3f4f6; color: #4b5563; }
    .badge-CONFIRMED { background: #dbeafe; color: #1e40af; }
    .badge-PAID { background: #dcfce7; color: #15803d; }
    .badge-CANCELLED { background: #fee2e2; color: #b91c1c; }
    .details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .details h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .details p {
      margin: 2px 0;
    }
    table.lines {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 14px;
    }
    table.lines th {
      background-color: #f9fafb;
      padding: 10px;
      border-bottom: 2px solid #e5e7eb;
      text-align: left;
    }
    table.lines td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
      font-size: 14px;
    }
    .totals-table td {
      padding: 6px 0;
    }
    .totals-table td:last-child {
      text-align: right;
    }
    .totals-table tr.grand-total td {
      font-size: 16px;
      font-weight: bold;
      border-top: 2px solid #e5e7eb;
      padding-top: 8px;
    }
    .totals-table tr.balance-due td {
      font-size: 16px;
      font-weight: bold;
      color: #b91c1c;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>Brightloop</h1>
      <p>Subscription & Billing Management</p>
      <p>support@brightloop.test</p>
    </div>
    <div class="invoice-title">
      <h2>${invoice.number}</h2>
      <div><span class="badge badge-${invoice.status}">${invoice.status}</span></div>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Subscription: ${invoice.subscription_number || '-'}</p>
    </div>
  </div>

  <div class="details">
    <div>
      <h3>Billed To</h3>
      <p><strong>${invoice.customer_name || 'Customer'}</strong></p>
      ${invoice.customer_company ? `<p>${invoice.customer_company}</p>` : ''}
      ${invoice.customer_address ? `<p>${invoice.customer_address}</p>` : ''}
      ${invoice.customer_phone ? `<p>${invoice.customer_phone}</p>` : ''}
      <p>${invoice.customer_email || ''}</p>
    </div>
    <div style="text-align: right;">
      <h3>Invoice Details</h3>
      <p><strong>Invoice Date:</strong> ${invoice.invoice_date}</p>
      <p><strong>Due Date:</strong> ${invoice.due_date}</p>
      <p><strong>Billing Period:</strong> ${invoice.period_start} &ndash; ${invoice.period_end}</p>
    </div>
  </div>

  <table class="lines">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Tax Rate</th>
        <th style="text-align: right;">Tax Amount</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${linesRows}
    </tbody>
  </table>

  <div class="totals-container">
    <div>
      ${discountsSection}
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td>$${Number(invoice.subtotal).toFixed(2)}</td>
        </tr>
        ${
          invoice.discount_total > 0
            ? `<tr><td>Discounts:</td><td style="color: #16a34a;">-$${Number(invoice.discount_total).toFixed(2)}</td></tr>`
            : ''
        }
        <tr>
          <td>Tax:</td>
          <td>$${Number(invoice.tax_total).toFixed(2)}</td>
        </tr>
        <tr class="grand-total">
          <td>Total:</td>
          <td>$${Number(invoice.total).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Amount Paid:</td>
          <td>$${Number(invoice.amount_paid).toFixed(2)}</td>
        </tr>
        <tr class="balance-due">
          <td>Balance Due:</td>
          <td>$${Number(invoice.balance).toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  renderInvoicePrintHtml,
};

