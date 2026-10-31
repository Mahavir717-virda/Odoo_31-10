import axiosClient from '../../api/axiosClient';
import { fetchAllPages, getPayload } from '../../api/featureUtils';

export async function fetchMySubscriptions(params = {}) {
  return fetchAllPages((pagination) => axiosClient.get('/subscriptions', { params: { ...pagination, ...params } }));
}

export async function getMySubscription(id) {
  return getPayload(await axiosClient.get(`/subscriptions/${id}`));
}

export async function fetchMyInvoices(params = {}) {
  return fetchAllPages((pagination) => axiosClient.get('/invoices', { params: { ...pagination, ...params } }));
}

export async function getMyInvoice(id) {
  return getPayload(await axiosClient.get(`/invoices/${id}`));
}

export async function fetchMyInvoicePayments(id) {
  return getPayload(await axiosClient.get(`/invoices/${id}/payments`));
}
