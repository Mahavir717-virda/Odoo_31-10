import {
  MOCK_PAYMENTS,
  findInvoiceById,
  updateInvoiceBalance,
} from './mock';

const API_DELAY = 600;

const delay = () => new Promise((resolve) => setTimeout(resolve, API_DELAY));

let payments = MOCK_PAYMENTS;

export async function fetchPayments(params = {}) {
  await delay();
  const { page = 1, page_size = 10, search = '', invoice_id } = params;
  const q = String(search).toLowerCase();

  let filtered = payments.filter((p) => {
    const matchesSearch = (p.note || '').toLowerCase().includes(q) || (p.invoice_id || '').toLowerCase().includes(q);
    const matchesInvoice = invoice_id ? p.invoice_id === invoice_id : true;
    return matchesSearch && matchesInvoice;
  });

  const total = filtered.length;
  const start = (page - 1) * page_size;
  const data = filtered.slice(start, start + page_size);

  return { data, total, page, page_size };
}

export async function recordPayment(payload) {
  await delay();
  const { invoice_id, amount, method, date, note } = payload;
  const invoice = findInvoiceById(invoice_id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  const paid = Number(amount);
  if (!paid || paid <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  if (paid > invoice.balance) {
    throw new Error('Amount cannot exceed outstanding balance');
  }
  const updated = updateInvoiceBalance(invoice_id, paid);
  if (!updated) {
    throw new Error('Failed to update invoice balance');
  }
  const newPayment = {
    id: `pay_${payments.length + 1}`,
    invoice_id,
    amount: paid,
    method,
    date: date || new Date().toISOString().split('T')[0],
    note: note || '',
    created_at: new Date().toISOString(),
  };
  payments.push(newPayment);
  return { data: newPayment };
}

export { MOCK_PAYMENTS };
