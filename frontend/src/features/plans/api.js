import axiosClient from '../../api/axiosClient';
import { getPayload } from '../../api/featureUtils';

export async function getPlans(params) {
  return axiosClient.get('/plans', { params });
}

export async function getPlanById(id) {
  return getPayload(await axiosClient.get(`/plans/${id}`));
}

export async function createPlan(data) {
  return axiosClient.post('/plans', data);
}

export async function updatePlan(id, data) {
  return axiosClient.put(`/plans/${id}`, data);
}

export async function deletePlan(id) {
  return axiosClient.delete(`/plans/${id}`);
}

export async function closePlan(id) {
  return axiosClient.patch(`/plans/${id}/close`);
}

export async function togglePausePlan(id) {
  return axiosClient.patch(`/plans/${id}/pause`);
}

export async function renewPlan(id) {
  return axiosClient.patch(`/plans/${id}/renew`);
}
