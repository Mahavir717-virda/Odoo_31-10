import axiosClient from '../../api/axiosClient';
import { isMockEnabled } from '../../api/mockHelper';
import * as mockTaxes from './mock';

export async function getTaxes(params) {
  if (isMockEnabled()) {
    return mockTaxes.mockGetTaxes(params);
  }
  return axiosClient.get('/taxes', { params });
}

export async function createTax(data) {
  if (isMockEnabled()) {
    return mockTaxes.mockCreateTax(data);
  }
  return axiosClient.post('/taxes', data);
}

export async function updateTax(id, data) {
  if (isMockEnabled()) {
    return mockTaxes.mockUpdateTax(id, data);
  }
  return axiosClient.put(`/taxes/${id}`, data);
}

export async function deleteTax(id) {
  if (isMockEnabled()) {
    return mockTaxes.mockDeleteTax(id);
  }
  return axiosClient.delete(`/taxes/${id}`);
}

