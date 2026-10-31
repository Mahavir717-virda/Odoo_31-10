const CUSTOMERS = [
  { id: 'cust_1', name: 'Acme Corp', email: 'billing@acme.com' },
  { id: 'cust_2', name: 'Globex Corporation', email: 'accounts@globex.com' },
  { id: 'cust_3', name: 'Stark Industries', email: 'finance@stark.com' },
];

const INVOICES = [
  { id: 'inv_1', invoice_number: 'INV-0001', customer_name: 'Acme Corp', total: 590, paid_amount: 200, balance: 390, status: 'open' },
  { id: 'inv_2', invoice_number: 'INV-0002', customer_name: 'Globex Corporation', total: 354, paid_amount: 300, balance: 54, status: 'paid' },
  { id: 'inv_3', invoice_number: 'INV-0003', customer_name: 'Stark Industries', total: 944, paid_amount: 0, balance: 944, status: 'confirmed' },
  { id: 'inv_4', invoice_number: 'INV-0004', customer_name: 'Acme Corp', total: 472, paid_amount: 0, balance: 472, status: 'draft' },
  { id: 'inv_5', invoice_number: 'INV-0005', customer_name: 'Globex Corporation', total: 708, paid_amount: 100, balance: 608, status: 'unpaid' },
  { id: 'inv_6', invoice_number: 'INV-0006', customer_name: 'Stark Industries', total: 236, paid_amount: 0, balance: 236, status: 'cancelled' },
  { id: 'inv_7', invoice_number: 'INV-0007', customer_name: 'Acme Corp', total: 1062, paid_amount: 900, balance: 162, status: 'paid' },
  { id: 'inv_8', invoice_number: 'INV-0008', customer_name: 'Globex Corporation', total: 826, paid_amount: 0, balance: 826, status: 'open' },
  { id: 'inv_9', invoice_number: 'INV-0009', customer_name: 'Stark Industries', total: 413, paid_amount: 0, balance: 413, status: 'draft' },
  { id: 'inv_10', invoice_number: 'INV-0010', customer_name: 'Acme Corp', total: 1416, paid_amount: 500, balance: 916, status: 'confirmed' },
  { id: 'inv_11', invoice_number: 'INV-0011', customer_name: 'Globex Corporation', total: 531, paid_amount: 0, balance: 531, status: 'unpaid' },
  { id: 'inv_12', invoice_number: 'INV-0012', customer_name: 'Stark Industries', total: 1298, paid_amount: 300, balance: 998, status: 'open' },
];

const toISO = (d) => d.toISOString().split('T')[0];

const basePayments = [
  { id: 'pay_1', invoice_id: 'inv_2', amount: 300, method: 'bank_transfer', date: '2026-09-10', note: 'Full payment for INV-0002', created_at: '2026-09-10' },
  { id: 'pay_2', invoice_id: 'inv_5', amount: 100, method: 'credit_card', date: '2026-09-22', note: 'Partial payment', created_at: '2026-09-22' },
  { id: 'pay_3', invoice_id: 'inv_7', amount: 900, method: 'bank_transfer', date: '2026-07-15', note: 'Full payment', created_at: '2026-07-15' },
  { id: 'pay_4', invoice_id: 'inv_10', amount: 500, method: 'check', date: '2026-09-20', note: 'Partial payment', created_at: '2026-09-20' },
  { id: 'pay_5', invoice_id: 'inv_12', amount: 300, method: 'bank_transfer', date: '2026-10-01', note: 'Partial payment', created_at: '2026-10-01' },
];

export const MOCK_PAYMENTS = [...basePayments];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

export function findInvoiceById(invoiceId) {
  return INVOICES.find((inv) => inv.id === invoiceId) ?? null;
}

export function getInvoiceBalance(invoiceId) {
  const invoice = findInvoiceById(invoiceId);
  return invoice ? invoice.balance : 0;
}

export function updateInvoiceBalance(invoiceId, amount) {
  const invoice = findInvoiceById(invoiceId);
  if (invoice) {
    invoice.paid_amount = Number((invoice.paid_amount + amount).toFixed(2));
    invoice.balance = Number((invoice.balance - amount).toFixed(2));
    invoice.status = invoice.balance <= 0 ? 'paid' : invoice.status;
    return invoice;
  }
  return null;
}

export { CUSTOMERS, INVOICES, toISO };
