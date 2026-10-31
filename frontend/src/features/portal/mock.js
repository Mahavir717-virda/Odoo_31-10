const toISO = (d) => d.toISOString().split('T')[0];
const subtractMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const now = new Date();

export const CURRENT_CUSTOMER_ID = 'cust_1';

export const CURRENT_CUSTOMER = {
  id: 'cust_1',
  name: 'Acme Corp',
  email: 'billing@acme.com',
  member_since: '2025-10-15',
  plan: 'Professional',
};

export const MY_SUBSCRIPTIONS = [
  {
    id: 'sub_4',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    plan: 'professional',
    status: 'active',
    start_date: toISO(subtractMonths(now, 6)),
    end_date: toISO(addMonths(now, 6)),
    next_billing_date: toISO(addMonths(now, 1)),
    amount: 174.64,
    payment_status: 'paid',
    actions: { can_pause: true, can_close: true },
    created_at: '2026-01-10',
    updated_at: '2026-06-15',
  },
  {
    id: 'sub_1',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    plan: 'professional',
    status: 'draft',
    start_date: toISO(now),
    end_date: toISO(addMonths(now, 12)),
    next_billing_date: null,
    amount: 174.64,
    payment_status: 'unpaid',
    actions: { can_pause: false, can_close: false },
    created_at: '2026-01-10',
    updated_at: '2026-01-10',
  },
  {
    id: 'sub_7',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    plan: 'professional',
    status: 'expired',
    start_date: toISO(subtractMonths(now, 12)),
    end_date: toISO(now),
    next_billing_date: null,
    amount: 174.64,
    payment_status: 'unpaid',
    actions: { can_pause: false, can_close: false },
    created_at: '2025-10-01',
    updated_at: '2026-10-01',
  },
];

export const MY_INVOICES = [
  {
    id: 'inv_1',
    invoice_number: 'INV-2026-0401',
    subscription_id: 'sub_4',
    status: 'paid',
    issue_date: '2026-09-01',
    due_date: '2026-09-15',
    amount: 174.64,
  },
  {
    id: 'inv_2',
    invoice_number: 'INV-2026-0412',
    subscription_id: 'sub_4',
    status: 'paid',
    issue_date: '2026-08-01',
    due_date: '2026-08-15',
    amount: 174.64,
  },
  {
    id: 'inv_3',
    invoice_number: 'INV-2026-0423',
    subscription_id: 'sub_4',
    status: 'open',
    issue_date: '2026-10-01',
    due_date: '2026-10-15',
    amount: 174.64,
  },
  {
    id: 'inv_4',
    invoice_number: 'INV-2026-0434',
    subscription_id: 'sub_1',
    status: 'unpaid',
    issue_date: '2026-10-10',
    due_date: '2026-10-25',
    amount: 174.64,
  },
  {
    id: 'inv_5',
    invoice_number: 'INV-2026-0445',
    subscription_id: 'sub_7',
    status: 'unpaid',
    issue_date: '2026-09-10',
    due_date: '2026-09-25',
    amount: 174.64,
  },
];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'cancelled', label: 'Cancelled' },
];
