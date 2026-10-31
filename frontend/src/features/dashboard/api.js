import axiosClient from '../../api/axiosClient';
import { fetchAllPages, getPayload } from '../../api/featureUtils';

const loadPayments = (params = {}) =>
  fetchAllPages((pagination) => axiosClient.get('/payments', { params: { ...pagination, ...params } }));

const loadInvoices = (params = {}) =>
  fetchAllPages((pagination) => axiosClient.get('/invoices', { params: { ...pagination, ...params } }));

const loadSubscriptions = (params = {}) =>
  fetchAllPages((pagination) => axiosClient.get('/subscriptions', { params: { ...pagination, ...params } }));

export async function fetchDashboardSummary(params = {}) {
  const dateParams = { from: params.start_date, to: params.end_date };
  const [activeSubscriptions, payments, invoices, overdueInvoices] = await Promise.all([
    loadSubscriptions({ status: 'ACTIVE' }),
    loadPayments(dateParams),
    loadInvoices(dateParams),
    loadInvoices({ ...dateParams, overdue: true }),
  ]);
  const amountPaid = (invoice) => Number(invoice.amount_paid ?? 0);
  const total = (invoice) => Number(invoice.total ?? 0);

  return getPayload({
    data: {
      active_subscriptions: activeSubscriptions.length,
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
