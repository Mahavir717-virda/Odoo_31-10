import axiosClient from '../../api/axiosClient';
import { getPayload, normalizeListResponse } from '../../api/featureUtils';

export async function fetchPayments(params = {}) {
  return normalizeListResponse(await axiosClient.get('/payments', { params }));
}

export async function recordPayment(payload) {
  return getPayload(await axiosClient.post('/payments', payload));
}

export async function fetchInvoicePayments(invoiceId) {
  return getPayload(await axiosClient.get(`/invoices/${invoiceId}/payments`));
}
