import axiosClient from '../../api/axiosClient';
import { fetchAllPages, getPayload } from '../../api/featureUtils';
import { fetchInvoices } from '../invoices/api';
import { fetchPayments } from '../payments/api';
import { fetchSubscriptions } from '../subscriptions/api';

const loadPayments = (params = {}) =>
  fetchAllPages((pagination) => axiosClient.get('/payments', { params: { ...pagination, ...params } }));

const loadInvoices = (params = {}) =>
  fetchAllPages((pagination) => axiosClient.get('/invoices', { params: { ...pagination, ...params } }));

export async function fetchDashboardSummary(params = {}) {
  const dateParams = { from: params.start_date, to: params.end_date };
  const [subscriptionCount, invoiceCount, paymentCount, activeSubscriptions, payments, invoices, overdueInvoices] = await Promise.all([
    fetchSubscriptions({ page: 1, limit: 1 }),
    fetchInvoices({ page: 1, limit: 1 }),
    fetchPayments({ page: 1, limit: 1 }),
    fetchSubscriptions({ page: 1, limit: 1, status: 'ACTIVE' }),
    loadPayments(dateParams),
    loadInvoices(dateParams),
    loadInvoices({ ...dateParams, overdue: true }),
  ]);
  const amountPaid = (invoice) => Number(invoice.amount_paid ?? 0);
  const total = (invoice) => Number(invoice.total ?? 0);

  return getPayload({
    data: {
      total_subscriptions: subscriptionCount.total,
      total_invoices: invoiceCount.total,
      total_payments: paymentCount.total,
      active_subscriptions: activeSubscriptions.total,
      revenue_received: payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
      outstanding: invoices.reduce(
        (sum, invoice) => sum + (String(invoice.status).toUpperCase() === 'CONFIRMED' ? Math.max(0, total(invoice) - amountPaid(invoice)) : 0),
        0
      ),
      overdue_amount: overdueInvoices.reduce(
        (sum, invoice) => sum + Math.max(0, total(invoice) - amountPaid(invoice)),
        0
      ),
      overdue_count: overdueInvoices.length,
    },
  });
}

export async function fetchDashboardActivity() {
  const [subscriptions, invoices] = await Promise.all([
    fetchSubscriptions({ page: 1, limit: 5 }),
    fetchInvoices({ page: 1, limit: 5 }),
  ]);
  return { subscriptions: subscriptions.data, invoices: invoices.data };
}

export async function fetchRevenueTrend(params = {}) {
  const payments = await loadPayments({ from: params.start_date, to: params.end_date });
  const monthly = new Map();

  payments.forEach((payment) => {
    const date = payment.payment_date ?? payment.date;
    if (!date) return;
    const month = String(date).slice(0, 7);
    monthly.set(month, (monthly.get(month) ?? 0) + Number(payment.amount ?? 0));
  });

  return Array.from(monthly, ([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function fetchOverdueInvoices(params = {}) {
  const { start_date, end_date, ...rest } = params;
  const pagination = {
    page: 1,
    limit: 10,
    ...rest,
    from: start_date,
    to: end_date,
    overdue: true,
  };
  const response = await axiosClient.get('/invoices', { params: pagination });
  return getPayload(response);
}
