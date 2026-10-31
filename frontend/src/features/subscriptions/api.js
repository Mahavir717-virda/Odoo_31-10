import axiosClient from '../../api/axiosClient';
import { getPayload, normalizeListResponse } from '../../api/featureUtils';

export async function fetchSubscriptions(params = {}) {
  const response = await axiosClient.get('/subscriptions', { params });
  return normalizeListResponse(response);
}

export async function getSubscription(id) {
  return getPayload(await axiosClient.get(`/subscriptions/${id}`));
}

export async function createSubscription(payload) {
  return getPayload(await axiosClient.post('/subscriptions', payload));
}

export async function updateSubscription(id, payload) {
  return getPayload(await axiosClient.put(`/subscriptions/${id}`, payload));
}

export async function createSubscriptionFromTemplate(templateId, payload) {
  return getPayload(await axiosClient.post(`/subscriptions/from-template/${templateId}`, payload));
}

export async function updateSubscriptionStatus(id, status) {
  return getPayload(await axiosClient.patch(`/subscriptions/${id}/status`, { status }));
}
