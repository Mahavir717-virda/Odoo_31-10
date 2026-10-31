export const CUSTOMERS = [
  { id: 'cust_1', name: 'Acme Corp', email: 'billing@acme.com' },
  { id: 'cust_2', name: 'Globex Corporation', email: 'accounts@globex.com' },
  { id: 'cust_3', name: 'Stark Industries', email: 'finance@stark.com' },
];

export const PLANS = [
  { value: 'starter', label: 'Starter Plan', base_price: 49.00 },
  { value: 'professional', label: 'Professional Plan', base_price: 99.00 },
  { value: 'enterprise', label: 'Enterprise Plan', base_price: 199.00 },
];

export const VARIANTS = {
  starter: [
    { value: 'basic', label: 'Basic', price_adjustment: 0 },
    { value: 'plus', label: 'Plus', price_adjustment: 20 },
  ],
  professional: [
    { value: 'standard', label: 'Standard', price_adjustment: 0 },
    { value: 'premium', label: 'Premium', price_adjustment: 50 },
  ],
  enterprise: [
    { value: 'standard', label: 'Standard', price_adjustment: 0 },
    { value: 'advanced', label: 'Advanced', price_adjustment: 100 },
  ],
};

const TAX_RATE = 0.18;

function lineTotal(line) {
  const unit = line.unit_price || 0;
  const qty = line.quantity || 0;
  const subtotal = unit * qty;
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}

function subscriptionTotals(lines) {
  let subtotal = 0;
  let tax = 0;
  let total = 0;
  lines.forEach((line) => {
    const t = lineTotal(line);
    subtotal += t.subtotal;
    tax += t.tax;
    total += t.total;
  });
  return { subtotal, tax_total: tax, total };
}

export function calculateSubscription(lines) {
  const enriched = lines.map((line) => {
    const t = lineTotal(line);
    return {
      ...line,
      subtotal: t.subtotal,
      tax_amount: t.tax,
      total: t.total,
    };
  });
  return { lines: enriched, ...subscriptionTotals(enriched) };
}

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const now = new Date();
const toISO = (d) => d.toISOString().split('T')[0];

const baseSubscriptions = [
  {
    id: 'sub_1',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    plan: 'professional',
    status: 'draft',
    start_date: toISO(now),
    end_date: addMonths(now, 12),
    next_billing_date: addMonths(now, 1),
    amount: 174.64,
    payment_status: 'unpaid',
    template_id: null,
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Standard', quantity: 1, unit_price: 99.00, tax_rate: TAX_RATE },
      { id: 'line_2', product: 'Support', variant: 'Business', quantity: 1, unit_price: 49.00, tax_rate: TAX_RATE },
    ],
    created_at: '2026-01-10',
    updated_at: '2026-01-10',
  },
  {
    id: 'sub_2',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    plan: 'starter',
    status: 'quotation',
    start_date: toISO(now),
    end_date: addMonths(now, 1),
    next_billing_date: addMonths(now, 1),
    amount: 57.82,
    payment_status: 'unpaid',
    template_id: 'qt_2',
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Basic', quantity: 1, unit_price: 49.00, tax_rate: TAX_RATE },
    ],
    created_at: '2026-02-01',
    updated_at: '2026-02-05',
  },
  {
    id: 'sub_3',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    plan: 'enterprise',
    status: 'confirmed',
    start_date: addMonths(now, 1),
    end_date: addMonths(now, 13),
    next_billing_date: addMonths(now, 1),
    amount: 627.12,
    payment_status: 'partial',
    template_id: 'qt_3',
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Advanced', quantity: 2, unit_price: 199.00, tax_rate: TAX_RATE },
      { id: 'line_2', product: 'Priority Support', variant: '24x7', quantity: 1, unit_price: 149.00, tax_rate: TAX_RATE },
    ],
    created_at: '2026-02-15',
    updated_at: '2026-02-20',
  },
  {
    id: 'sub_4',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    plan: 'professional',
    status: 'active',
    start_date: addMonths(now, -6),
    end_date: addMonths(now, 6),
    next_billing_date: addMonths(now, 1),
    amount: 174.64,
    payment_status: 'paid',
    template_id: 'qt_1',
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Standard', quantity: 1, unit_price: 99.00, tax_rate: TAX_RATE },
      { id: 'line_2', product: 'Support', variant: 'Business', quantity: 1, unit_price: 49.00, tax_rate: TAX_RATE },
    ],
    created_at: '2026-01-10',
    updated_at: '2026-06-15',
  },
  {
    id: 'sub_5',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    plan: 'starter',
    status: 'paused',
    start_date: addMonths(now, -3),
    end_date: addMonths(now, 9),
    next_billing_date: addMonths(now, 2),
    amount: 57.82,
    payment_status: 'paid',
    template_id: null,
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Basic', quantity: 1, unit_price: 49.00, tax_rate: TAX_RATE },
    ],
    created_at: '2026-03-01',
    updated_at: '2026-08-01',
  },
  {
    id: 'sub_6',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    plan: 'enterprise',
    status: 'closed',
    start_date: addMonths(now, -18),
    end_date: addMonths(now, -6),
    next_billing_date: null,
    amount: 627.12,
    payment_status: 'paid',
    template_id: 'qt_3',
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Advanced', quantity: 2, unit_price: 199.00, tax_rate: TAX_RATE },
      { id: 'line_2', product: 'Priority Support', variant: '24x7', quantity: 1, unit_price: 149.00, tax_rate: TAX_RATE },
    ],
    created_at: '2025-04-01',
    updated_at: '2026-04-01',
  },
  {
    id: 'sub_7',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    plan: 'professional',
    status: 'expired',
    start_date: addMonths(now, -12),
    end_date: addMonths(now, 0),
    next_billing_date: null,
    amount: 174.64,
    payment_status: 'unpaid',
    template_id: null,
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Standard', quantity: 1, unit_price: 99.00, tax_rate: TAX_RATE },
      { id: 'line_2', product: 'Support', variant: 'Business', quantity: 1, unit_price: 49.00, tax_rate: TAX_RATE },
    ],
    created_at: '2025-10-01',
    updated_at: '2026-10-01',
  },
  {
    id: 'sub_8',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    plan: 'starter',
    status: 'cancelled',
    start_date: addMonths(now, -9),
    end_date: addMonths(now, -3),
    next_billing_date: null,
    amount: 57.82,
    payment_status: 'refunded',
    template_id: null,
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Basic', quantity: 1, unit_price: 49.00, tax_rate: TAX_RATE },
    ],
    created_at: '2026-01-15',
    updated_at: '2026-07-15',
  },
];

export const MOCK_SUBSCRIPTIONS = baseSubscriptions.map((sub) => {
  const calc = calculateSubscription(sub.lines);
  return {
    ...sub,
    lines: calc.lines,
    subtotal: calc.subtotal,
    tax_total: calc.tax_total,
    total: calc.total,
  };
});

export const SUBSCRIPTION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const NEXT_STATUS_ACTION = {
  draft: { to: 'quotation', label: 'Send Quotation' },
  quotation: { to: 'confirmed', label: 'Confirm' },
  confirmed: { to: 'active', label: 'Activate' },
  active: { to: 'closed', label: 'Close' },
  closed: null,
  paused: null,
  expired: null,
  cancelled: null,
};
