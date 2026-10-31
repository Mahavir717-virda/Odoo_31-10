const subtractMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};

const now = new Date();

export const MONTHS = [];
for (let i = 11; i >= 0; i--) {
  const d = subtractMonths(now, i);
  MONTHS.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
}

export const DASHBOARD_SUMMARY = {
  active_subscriptions: 124,
  total_revenue: 84250.00,
  total_payments: 78120.00,
  overdue_invoices: 18,
  overdue_amount: 12450.00,
  collected_amount: 71800.00,
};

export const REVENUE_TREND = MONTHS.map((month, index) => ({
  month,
  revenue: Number((42000 + index * 1800 + Math.floor(Math.sin(index) * 2500)).toFixed(2)),
  subscriptions: 90 + index * 2 + Math.floor(Math.cos(index) * 4),
}));

export const OVERDUE_INVOICES = [
  {
    id: 'inv_101',
    invoice_number: 'INV-2026-0101',
    customer_name: 'Acme Corp',
    due_date: '2026-09-10',
    amount: 2450.00,
    status: 'overdue',
    days_overdue: 51,
  },
  {
    id: 'inv_102',
    invoice_number: 'INV-2026-0114',
    customer_name: 'Globex Corporation',
    due_date: '2026-09-22',
    amount: 1890.50,
    status: 'overdue',
    days_overdue: 39,
  },
  {
    id: 'inv_103',
    invoice_number: 'INV-2026-0129',
    customer_name: 'Stark Industries',
    due_date: '2026-10-01',
    amount: 5620.00,
    status: 'overdue',
    days_overdue: 30,
  },
  {
    id: 'inv_104',
    invoice_number: 'INV-2026-0140',
    customer_name: 'Wayne Enterprises',
    due_date: '2026-10-12',
    amount: 3400.00,
    status: 'overdue',
    days_overdue: 19,
  },
  {
    id: 'inv_105',
    invoice_number: 'INV-2026-0155',
    customer_name: 'Oscorp',
    due_date: '2026-10-20',
    amount: 1125.75,
    status: 'overdue',
    days_overdue: 11,
  },
  {
    id: 'inv_106',
    invoice_number: 'INV-2026-0168',
    customer_name: 'Hooli',
    due_date: '2026-10-28',
    amount: 8750.00,
    status: 'overdue',
    days_overdue: 3,
  },
];

export const DASHBOARD_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
];
