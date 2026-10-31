const API_DELAY = 600;

const delay = () => new Promise((resolve) => setTimeout(resolve, API_DELAY));

import {
  DASHBOARD_SUMMARY,
  REVENUE_TREND,
  OVERDUE_INVOICES,
} from './mock';

export async function fetchDashboardSummary() {
  await delay();
  return { data: { ...DASHBOARD_SUMMARY } };
}

export async function fetchRevenueTrend(params = {}) {
  await delay();
  const { start_date, end_date } = params;
  let data = [...REVENUE_TREND];
  if (start_date) {
    const start = start_date.slice(0, 7);
    data = data.filter((item) => item.month >= start);
  }
  if (end_date) {
    const end = end_date.slice(0, 7);
    data = data.filter((item) => item.month <= end);
  }
  return { data };
}

export async function fetchOverdueInvoices(params = {}) {
  await delay();
  const { status, start_date, end_date } = params;
  let data = [...OVERDUE_INVOICES];
  if (status) {
    data = data.filter((item) => item.status === status);
  }
  if (start_date) {
    data = data.filter((item) => item.due_date >= start_date);
  }
  if (end_date) {
    data = data.filter((item) => item.due_date <= end_date);
  }
  return { data };
}
