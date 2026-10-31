import axiosClient from '../../api/axiosClient';
import { getPayload, normalizeListResponse } from '../../api/featureUtils';

export async function fetchInvoices(params = {}) {
  const response = await axiosClient.get('/invoices', { params });
  return normalizeListResponse(response);
}

export async function getInvoice(id) {
  return getPayload(await axiosClient.get(`/invoices/${id}`));
}

export async function generateDueInvoices() {
  return getPayload(await axiosClient.post('/invoices/generate-due'));
}

export async function confirmInvoice(id) {
  return getPayload(await axiosClient.patch(`/invoices/${id}/confirm`));
}

export async function cancelInvoice(id) {
  return getPayload(await axiosClient.patch(`/invoices/${id}/cancel`));
}

export async function sendInvoice(id) {
  return getPayload(await axiosClient.patch(`/invoices/${id}/send`));
}

export async function getInvoicePayments(id) {
  return getPayload(await axiosClient.get(`/invoices/${id}/payments`));
}

export async function printInvoice(id) {
  return getPayload(await axiosClient.get(`/invoices/${id}/print`, {
    headers: { Accept: 'text/html' },
    responseType: 'text',
  }));
}

export function getInvoiceActions(status, balance = 0, amountPaid = 0) {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'DRAFT') return ['confirm', ...(Number(amountPaid) === 0 ? ['cancel'] : [])];
  if (normalized === 'CONFIRMED') return ['send', ...(Number(balance) > 0 ? ['record_payment'] : []), ...(Number(amountPaid) === 0 ? ['cancel'] : [])];
  return [];
}

export function isOverdue(invoice) {
  return String(invoice?.status ?? '').toUpperCase() === 'CONFIRMED' &&
    Boolean(invoice?.due_date) &&
    new Date(`${invoice.due_date}T00:00:00`) < new Date(new Date().toDateString());
}
