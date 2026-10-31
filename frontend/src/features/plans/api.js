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

