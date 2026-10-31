const API_DELAY = 600;

const delay = () => new Promise((resolve) => setTimeout(resolve, API_DELAY));

import { CURRENT_CUSTOMER_ID, MY_INVOICES, MY_SUBSCRIPTIONS } from './mock';

let subscriptions = [...MY_SUBSCRIPTIONS];
let invoices = [...MY_INVOICES];

// Customer data is scoped by the backend. The frontend never sends a customer_id;
let currentCustomerId = CURRENT_CUSTOMER_ID;

export async function fetchMySubscriptions() {
  await delay();
  return { data: subscriptions.filter((subscription) => subscription.customer_id === currentCustomerId) };
}

export async function fetchMyInvoices() {
  await delay();
  return { data: invoices.filter((invoice) => {
    const subscription = subscriptions.find((s) => s.id === invoice.subscription_id);
    return subscription && subscription.customer_id === currentCustomerId;
  }) };
}

export async function pauseSubscription(id) {
  await delay();
  const subscription = subscriptions.find((s) => s.id === id);
  if (!subscription) {
    throw new Error('Subscription not found.');
  }
  if (subscription.customer_id !== currentCustomerId) {
    throw new Error('Not authorized to modify this subscription.');
  }
  if (subscription.status !== 'active') {
    throw new Error('Only active subscriptions can be paused.');
  }
  if (!subscription.actions || !subscription.actions.can_pause) {
    throw new Error('Pausing is not permitted for this subscription.');
  }

  const now = new Date().toISOString().split('T')[0];
  const updated = {
    ...subscription,
    status: 'paused',
    updated_at: now,
  };
  const index = subscriptions.findIndex((s) => s.id === id);
  subscriptions[index] = updated;
  return { data: updated };
}

export async function closeSubscription(id) {
  await delay();
  const subscription = subscriptions.find((s) => s.id === id);
  if (!subscription) {
    throw new Error('Subscription not found.');
  }
  if (subscription.customer_id !== currentCustomerId) {
    throw new Error('Not authorized to modify this subscription.');
  }
  if (subscription.status !== 'active') {
    throw new Error('Only active subscriptions can be closed.');
  }
  if (!subscription.actions || !subscription.actions.can_close) {
    throw new Error('Closing is not permitted for this subscription.');
  }

  const now = new Date().toISOString().split('T')[0];
  const updated = {
    ...subscription,
    status: 'closed',
    updated_at: now,
  };
  const index = subscriptions.findIndex((s) => s.id === id);
  subscriptions[index] = updated;
  return { data: updated };
}

export { CURRENT_CUSTOMER_ID };
