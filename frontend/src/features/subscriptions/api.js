import { MOCK_SUBSCRIPTIONS, NEXT_STATUS_ACTION } from './mock';

const API_DELAY = 600;

const delay = () => new Promise((resolve) => setTimeout(resolve, API_DELAY));

let subscriptions = [...MOCK_SUBSCRIPTIONS];

export async function fetchSubscriptions(params = {}) {
  await delay();
  const { page = 1, page_size = 10, search = '', status, start_date, end_date } = params;
  const q = String(search).toLowerCase();

  let filtered = subscriptions.filter((s) => {
    const matchesSearch =
      s.customer_name.toLowerCase().includes(q) ||
      s.plan.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      (s.payment_status && s.payment_status.toLowerCase().includes(q));
    const matchesStatus = status ? s.status === status : true;
    const matchesStart = start_date ? s.start_date >= start_date : true;
    const matchesEnd = end_date ? s.end_date <= end_date : true;
    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  const total = filtered.length;
  const start = (page - 1) * page_size;
  const data = filtered.slice(start, start + page_size);

  return { data, total, page, page_size };
}

export async function getSubscription(id) {
  await delay();
  const subscription = subscriptions.find((s) => s.id === id);
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  return { data: subscription };
}

export async function createSubscription(payload) {
  await delay();
  const now = new Date().toISOString().split('T')[0];
  const newSubscription = {
    id: `sub_${subscriptions.length + 1}`,
    ...payload,
    created_at: now,
    updated_at: now,
  };
  subscriptions.push(newSubscription);
  return { data: newSubscription };
}

export async function updateSubscription(id, payload) {
  await delay();
  const index = subscriptions.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Subscription not found');
  }
  const now = new Date().toISOString().split('T')[0];
  const updated = {
    ...subscriptions[index],
    ...payload,
    updated_at: now,
  };
  subscriptions[index] = updated;
  return { data: updated };
}

export async function updateSubscriptionStatus(id, status) {
  await delay();
  const index = subscriptions.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Subscription not found');
  }
  const now = new Date().toISOString().split('T')[0];
  const updated = {
    ...subscriptions[index],
    status,
    updated_at: now,
  };
  subscriptions[index] = updated;
  return { data: updated };
}

export async function getSubscriptionFromTemplate(templateId) {
  await delay();
  // Simulate fetching a quotation template by ID
  const template = {
    id: templateId,
    name: 'Template ' + templateId,
    plan: 'professional',
    customer_id: 'cust_1',
    customer_name: 'Acme Corp',
    notes: 'Created from template',
    lines: [
      { id: 'line_1', product: 'Core Module', variant: 'Standard', quantity: 1, unit_price: 99.00, tax_rate: 0.18 },
    ],
  };
  return { data: template };
}

export { NEXT_STATUS_ACTION };
