import {
  MOCK_INVOICES,
  INVOICE_ACTIONS,
  isOverdue,
  TAX_RATE,
} from './mock';
import { MOCK_PAYMENTS } from '../payments/mock';

const API_DELAY = 600;

const delay = () => new Promise((resolve) => setTimeout(resolve, API_DELAY));

let invoices = [...MOCK_INVOICES];

let generateDueInFlight = false;

export async function fetchInvoices(params = {}) {
  await delay();
  const { page = 1, page_size = 10, search = '', status, overdue, subscription, customer, from_date, to_date } = params;
  const q = String(search).toLowerCase();

  let filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      inv.subscription_name.toLowerCase().includes(q);
    const matchesStatus = status ? inv.status === status : true;
    const matchesSubscription = subscription ? inv.subscription_id === subscription : true;
    const matchesCustomer = customer ? inv.customer_id === customer : true;
    const matchesFrom = from_date ? inv.issue_date >= from_date : true;
    const matchesTo = to_date ? inv.issue_date <= to_date : true;
    let matchesOverdue = true;
    if (overdue === 'true') {
      matchesOverdue = isOverdue(inv);
    } else if (overdue === 'false') {
      matchesOverdue = !isOverdue(inv);
    }
    return matchesSearch && matchesStatus && matchesSubscription && matchesCustomer && matchesOverdue && matchesFrom && matchesTo;
  });

  const total = filtered.length;
  const start = (page - 1) * page_size;
  const data = filtered.slice(start, start + page_size);

  return { data, total, page, page_size };
}

export async function getInvoice(id) {
  await delay();
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  return { data: invoice };
}

export async function generateDueInvoices() {
  if (generateDueInFlight) {
    return { created: [], skipped: [], message: 'Generate due invoices already in progress.' };
  }
  generateDueInFlight = true;
  try {
    await delay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const created = [];
    const skipped = [];

    for (const sub of SUBSCRIPTIONS_REF) {
      const existing = invoices.find((inv) => inv.subscription_id === sub.id && inv.status !== 'cancelled');
      if (existing) {
        skipped.push({ subscription_id: sub.id, subscription_name: sub.subscription_name, reason: 'Existing non-cancelled invoice' });
        continue;
      }
      const now = new Date();
      const issueDate = toISO(now);
      const dueDate = toISO(addDays(now, 30));
      const lines = [
        { id: `line_${Date.now()}`, description: `${sub.plan} Subscription`, quantity: 1, unit_price: sub.base_price || 100, discount_percent: 0, tax_rate: TAX_RATE },
      ];
      const enriched = enrichInvoiceMock({
        id: `inv_${invoices.length + 1}`,
        invoice_number: `INV-${String(invoices.length + 1).padStart(4, '0')}`,
        customer_id: sub.customer_id,
        customer_name: sub.customer_name,
        subscription_id: sub.id,
        subscription_name: sub.subscription_name || sub.plan,
        status: 'draft',
        issue_date: issueDate,
        due_date: dueDate,
        paid_amount: 0,
        lines,
        created_at: issueDate,
        updated_at: issueDate,
      });
      invoices.push(enriched);
      created.push(enriched);
    }

    return { created, skipped, message: `Generated ${created.length} invoice(s), skipped ${skipped.length}.` };
  } finally {
    generateDueInFlight = false;
  }
}

export async function confirmInvoice(id) {
  await delay();
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }
  const updated = { ...invoices[index], status: 'confirmed', updated_at: new Date().toISOString().split('T')[0] };
  invoices[index] = updated;
  return { data: updated };
}

export async function cancelInvoice(id) {
  await delay();
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }
  const updated = { ...invoices[index], status: 'cancelled', updated_at: new Date().toISOString().split('T')[0] };
  invoices[index] = updated;
  return { data: updated };
}

export async function sendInvoice(id) {
  await delay();
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }
  const updated = { ...invoices[index], updated_at: new Date().toISOString().split('T')[0] };
  invoices[index] = updated;
  return { data: updated };
}

export async function getInvoicePayments(id) {
  await delay();
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  const invoicePayments = MOCK_PAYMENTS.filter((p) => p.invoice_id === id);
  return { data: invoicePayments };
}

export function getInvoiceActions(status) {
  return INVOICE_ACTIONS[status] ?? [];
}

export { isOverdue, INVOICE_ACTIONS };

function toISO(d) {
  return d.toISOString().split('T')[0];
}

function addDays(d, days) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

const SUBSCRIPTIONS_REF = [
  { id: 'sub_1', customer_id: 'cust_1', customer_name: 'Acme Corp', subscription_name: 'Professional', plan: 'Professional', base_price: 174.64 },
  { id: 'sub_2', customer_id: 'cust_2', customer_name: 'Globex Corporation', subscription_name: 'Starter', plan: 'Starter', base_price: 57.82 },
  { id: 'sub_3', customer_id: 'cust_3', customer_name: 'Stark Industries', subscription_name: 'Enterprise', plan: 'Enterprise', base_price: 627.12 },
];

function enrichInvoiceMock(invoice) {
  const enrichedLines = invoice.lines.map((line) => {
    const unit = Number(line.unit_price) || 0;
    const qty = Number(line.quantity) || 0;
    const discountPercent = Number(line.discount_percent) || 0;
    const subtotal = unit * qty;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxable = subtotal - discountAmount;
    const taxAmount = taxable * TAX_RATE;
    const total = taxable + taxAmount;
    return { ...line, subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total };
  });
  let subtotal = 0, tax = 0, discount = 0, total = 0;
  enrichedLines.forEach((l) => { subtotal += l.subtotal; discount += l.discount_amount; tax += l.tax_amount; total += l.total; });
  return { ...invoice, lines: enrichedLines, subtotal, tax_total: tax, discount_total: discount, total, balance: total };
}
