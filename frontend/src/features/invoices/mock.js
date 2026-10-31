const CUSTOMERS = [
  { id: 'cust_1', name: 'Acme Corp', email: 'billing@acme.com' },
  { id: 'cust_2', name: 'Globex Corporation', email: 'accounts@globex.com' },
  { id: 'cust_3', name: 'Stark Industries', email: 'finance@stark.com' },
];

const SUBSCRIPTIONS = [
  { id: 'sub_1', customer_id: 'cust_1', customer_name: 'Acme Corp', plan: 'Professional' },
  { id: 'sub_2', customer_id: 'cust_2', customer_name: 'Globex Corporation', plan: 'Starter' },
  { id: 'sub_3', customer_id: 'cust_3', customer_name: 'Stark Industries', plan: 'Enterprise' },
];

const TAX_RATE = 0.18;

function lineTotal(line) {
  const unit = Number(line.unit_price) || 0;
  const qty = Number(line.quantity) || 0;
  const discountPercent = Number(line.discount_percent) || 0;
  const subtotal = unit * qty;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * TAX_RATE;
  const total = taxable + taxAmount;
  return { subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total };
}

function invoiceTotals(lines) {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  let total = 0;
  lines.forEach((line) => {
    const t = lineTotal(line);
    subtotal += t.subtotal;
    discount += t.discount_amount;
    tax += t.tax_amount;
    total += t.total;
  });
  return { subtotal, tax_total: tax, discount_total: discount, total };
}

const now = new Date();
const toISO = (d) => d.toISOString().split('T')[0];
const addDays = (d, days) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return toISO(date);
};

const baseInvoices = [
  {
    id: 'inv_1',
    invoice_number: 'INV-0001',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    subscription_id: 'sub_1',
    subscription_name: 'Professional',
    status: 'open',
    issue_date: toISO(addDays(now, -60)),
    due_date: toISO(addDays(now, -31)),
    paid_amount: 200,
    lines: [
      { id: 'line_1', description: 'Core Module', quantity: 1, unit_price: 500, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-09-01',
    updated_at: '2026-09-01',
  },
  {
    id: 'inv_2',
    invoice_number: 'INV-0002',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    subscription_id: 'sub_2',
    subscription_name: 'Starter',
    status: 'paid',
    issue_date: toISO(addDays(now, -77)),
    due_date: toISO(addDays(now, -46)),
    paid_amount: 300,
    lines: [
      { id: 'line_1', description: 'Support Plan', quantity: 1, unit_price: 300, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-08-15',
    updated_at: '2026-09-10',
  },
  {
    id: 'inv_3',
    invoice_number: 'INV-0003',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    subscription_id: 'sub_3',
    subscription_name: 'Enterprise',
    status: 'confirmed',
    issue_date: toISO(addDays(now, -51)),
    due_date: toISO(addDays(now, -21)),
    paid_amount: 0,
    lines: [
      { id: 'line_1', description: 'Core Module', quantity: 2, unit_price: 300, discount_percent: 10, tax_rate: TAX_RATE },
      { id: 'line_2', description: 'Priority Support', quantity: 1, unit_price: 250, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-09-10',
    updated_at: '2026-09-10',
  },
  {
    id: 'inv_4',
    invoice_number: 'INV-0004',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    subscription_id: 'sub_1',
    subscription_name: 'Professional',
    status: 'draft',
    issue_date: toISO(addDays(now, -6)),
    due_date: toISO(addDays(now, 24)),
    paid_amount: 0,
    lines: [
      { id: 'line_1', description: 'Consulting', quantity: 4, unit_price: 100, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-10-25',
    updated_at: '2026-10-25',
  },
  {
    id: 'inv_5',
    invoice_number: 'INV-0005',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    subscription_id: 'sub_2',
    subscription_name: 'Starter',
    status: 'unpaid',
    issue_date: toISO(addDays(now, -41)),
    due_date: toISO(addDays(now, -11)),
    paid_amount: 100,
    lines: [
      { id: 'line_1', description: 'Hosting', quantity: 1, unit_price: 600, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-09-20',
    updated_at: '2026-09-20',
  },
  {
    id: 'inv_6',
    invoice_number: 'INV-0006',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    subscription_id: 'sub_3',
    subscription_name: 'Enterprise',
    status: 'cancelled',
    issue_date: toISO(addDays(now, -90)),
    due_date: toISO(addDays(now, -59)),
    paid_amount: 0,
    lines: [
      { id: 'line_1', description: 'Migration', quantity: 1, unit_price: 200, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-08-01',
    updated_at: '2026-08-15',
  },
  {
    id: 'inv_7',
    invoice_number: 'INV-0007',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    subscription_id: 'sub_1',
    subscription_name: 'Professional',
    status: 'paid',
    issue_date: toISO(addDays(now, -122)),
    due_date: toISO(addDays(now, -91)),
    paid_amount: 900,
    lines: [
      { id: 'line_1', description: 'License', quantity: 1, unit_price: 900, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-07-01',
    updated_at: '2026-07-20',
  },
  {
    id: 'inv_8',
    invoice_number: 'INV-0008',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    subscription_id: 'sub_2',
    subscription_name: 'Starter',
    status: 'open',
    issue_date: toISO(addDays(now, -30)),
    due_date: toISO(addDays(now, 0)),
    paid_amount: 0,
    lines: [
      { id: 'line_1', description: 'Support Plan', quantity: 1, unit_price: 700, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-10-01',
    updated_at: '2026-10-01',
  },
  {
    id: 'inv_9',
    invoice_number: 'INV-0009',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    subscription_id: 'sub_3',
    subscription_name: 'Enterprise',
    status: 'draft',
    issue_date: toISO(addDays(now, -3)),
    due_date: toISO(addDays(now, 27)),
    paid_amount: 0,
    lines: [
      { id: 'line_1', description: 'Training', quantity: 2, unit_price: 150, discount_percent: 0, tax_rate: TAX_RATE },
      { id: 'line_2', description: 'Material', quantity: 1, unit_price: 50, discount_percent: 20, tax_rate: TAX_RATE },
    ],
    created_at: '2026-10-28',
    updated_at: '2026-10-28',
  },
  {
    id: 'inv_10',
    invoice_number: 'INV-0010',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    subscription_id: 'sub_1',
    subscription_name: 'Professional',
    status: 'confirmed',
    issue_date: toISO(addDays(now, -46)),
    due_date: toISO(addDays(now, -16)),
    paid_amount: 500,
    lines: [
      { id: 'line_1', description: 'Enterprise License', quantity: 1, unit_price: 1200, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-09-15',
    updated_at: '2026-09-15',
  },
  {
    id: 'inv_11',
    invoice_number: 'INV-0011',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    subscription_id: 'sub_2',
    subscription_name: 'Starter',
    status: 'unpaid',
    issue_date: toISO(addDays(now, -26)),
    due_date: toISO(addDays(now, 4)),
    paid_amount: 0,
    lines: [
      { id: 'line_1', description: 'Add-on Module', quantity: 1, unit_price: 450, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-10-05',
    updated_at: '2026-10-05',
  },
  {
    id: 'inv_12',
    invoice_number: 'INV-0012',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    subscription_id: 'sub_3',
    subscription_name: 'Enterprise',
    status: 'open',
    issue_date: toISO(addDays(now, -36)),
    due_date: toISO(addDays(now, -6)),
    paid_amount: 300,
    lines: [
      { id: 'line_1', description: 'Consulting', quantity: 10, unit_price: 100, discount_percent: 0, tax_rate: TAX_RATE },
      { id: 'line_2', description: 'Travel', quantity: 1, unit_price: 100, discount_percent: 0, tax_rate: TAX_RATE },
    ],
    created_at: '2026-09-25',
    updated_at: '2026-09-25',
  },
];

function enrichInvoice(invoice) {
  const enrichedLines = invoice.lines.map((line) => {
    const t = lineTotal(line);
    return {
      ...line,
      subtotal: t.subtotal,
      discount_amount: t.discount_amount,
      tax_amount: t.tax_amount,
      total: t.total,
    };
  });
  const totals = invoiceTotals(enrichedLines);
  return {
    ...invoice,
    lines: enrichedLines,
    subtotal: totals.subtotal,
    tax_total: totals.tax_total,
    discount_total: totals.discount_total,
    total: totals.total,
    balance: Number((totals.total - (invoice.paid_amount || 0)).toFixed(2)),
  };
}

export const MOCK_INVOICES = baseInvoices.map(enrichInvoice);

export function isOverdue(invoice) {
  if (invoice.status !== 'confirmed') {
    return false;
  }
  const due = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const INVOICE_ACTIONS = {
  draft: ['send'],
  open: ['confirm', 'cancel', 'send', 'record_payment'],
  confirmed: ['cancel', 'send', 'record_payment'],
  unpaid: ['cancel', 'record_payment'],
  paid: [],
  cancelled: [],
};

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

export { CUSTOMERS, SUBSCRIPTIONS, TAX_RATE };
