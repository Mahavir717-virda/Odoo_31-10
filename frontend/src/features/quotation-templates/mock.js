export const CUSTOMERS = [
  { id: 'cust_1', name: 'Acme Corp', email: 'billing@acme.com', phone: '+1-555-0101' },
  { id: 'cust_2', name: 'Globex Corporation', email: 'accounts@globex.com', phone: '+1-555-0202' },
  { id: 'cust_3', name: 'Stark Industries', email: 'finance@stark.com', phone: '+1-555-0303' },
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

function templateTotals(lines) {
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

export function calculateTemplate(lines) {
  const enriched = lines.map((line) => {
    const t = lineTotal(line);
    return {
      ...line,
      subtotal: t.subtotal,
      tax_amount: t.tax,
      total: t.total,
    };
  });
  return { lines: enriched, ...templateTotals(enriched) };
}

const baseTemplates = [
  {
    id: 'qt_1',
    name: 'Standard Annual Plan',
    plan: 'professional',
    variant: 'standard',
    validity_days: 365,
    payment_terms: 'Net 30',
    notes: 'Standard template for annual professional subscriptions',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    lines: [
      {
        id: 'line_1',
        product: 'Core Module',
        variant: 'Standard',
        quantity: 1,
        unit_price: 99.00,
        tax_rate: TAX_RATE,
      },
      {
        id: 'line_2',
        product: 'Support',
        variant: 'Business',
        quantity: 1,
        unit_price: 49.00,
        tax_rate: TAX_RATE,
      },
    ],
    created_at: '2026-01-10',
    updated_at: '2026-01-10',
  },
  {
    id: 'qt_2',
    name: 'Starter Monthly Plan',
    plan: 'starter',
    variant: 'basic',
    validity_days: 30,
    payment_terms: 'Due on receipt',
    notes: 'Entry-level monthly template for small teams',
    customer_id: 'cust_2',
    customer_name: 'Globex Corporation',
    lines: [
      {
        id: 'line_1',
        product: 'Core Module',
        variant: 'Basic',
        quantity: 1,
        unit_price: 49.00,
        tax_rate: TAX_RATE,
      },
    ],
    created_at: '2026-02-01',
    updated_at: '2026-02-01',
  },
  {
    id: 'qt_3',
    name: 'Enterprise Quarterly Plan',
    plan: 'enterprise',
    variant: 'advanced',
    validity_days: 90,
    payment_terms: 'Net 15',
    notes: 'Quarterly enterprise template with advanced features',
    customer_id: 'cust_3',
    customer_name: 'Stark Industries',
    lines: [
      {
        id: 'line_1',
        product: 'Core Module',
        variant: 'Advanced',
        quantity: 2,
        unit_price: 199.00,
        tax_rate: TAX_RATE,
      },
      {
        id: 'line_2',
        product: 'Priority Support',
        variant: '24x7',
        quantity: 1,
        unit_price: 149.00,
        tax_rate: TAX_RATE,
      },
    ],
    created_at: '2026-02-15',
    updated_at: '2026-02-15',
  },
];

export const MOCK_TEMPLATES = baseTemplates.map((tmpl) => {
  const calc = calculateTemplate(tmpl.lines);
  return {
    ...tmpl,
    lines: calc.lines,
    subtotal: calc.subtotal,
    tax_total: calc.tax_total,
    total: calc.total,
  };
});
