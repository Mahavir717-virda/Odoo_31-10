import axiosClient from '../../api/axiosClient';
import { isMockEnabled } from '../../api/mockHelper';
import * as mockPlans from './mock';

export async function getPlans(params) {
  if (isMockEnabled()) {
    return mockPlans.mockGetPlans(params);
  }
  return axiosClient.get('/plans', { params });
}

export async function getPlanById(id) {
  if (isMockEnabled()) {
    return mockPlans.mockGetPlanById(id);
  }
  return axiosClient.get(`/plans/${id}`);
}

export async function createPlan(data) {
  if (isMockEnabled()) {
    return mockPlans.mockCreatePlan(data);
  }
  return axiosClient.post('/plans', data);
}

export async function updatePlan(id, data) {
  if (isMockEnabled()) {
    return mockPlans.mockUpdatePlan(id, data);
  }
  return axiosClient.put(`/plans/${id}`, data);
}

export async function deletePlan(id) {
  if (isMockEnabled()) {
    return mockPlans.mockDeletePlan(id);
  }
  return axiosClient.delete(`/plans/${id}`);
}

export async function closePlan(id) {
  if (isMockEnabled()) {
    return mockPlans.mockClosePlan(id);
  }
  return axiosClient.post(`/plans/${id}/close`);
}

export async function togglePausePlan(id) {
  if (isMockEnabled()) {
    return mockPlans.mockTogglePausePlan(id);
  }
  return axiosClient.post(`/plans/${id}/toggle-pause`);
}

export async function renewPlan(id, newEndDate = null) {
  if (isMockEnabled()) {
    return mockPlans.mockRenewPlan(id, newEndDate);
  }
  return axiosClient.post(`/plans/${id}/renew`, { end_date: newEndDate });
}
