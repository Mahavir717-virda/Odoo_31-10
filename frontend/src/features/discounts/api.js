import axiosClient from '../../api/axiosClient';
import { isMockEnabled } from '../../api/mockHelper';
import * as mockDiscounts from './mock';

export async function getDiscounts(params) {
  if (isMockEnabled()) {
    return mockDiscounts.mockGetDiscounts(params);
  }
  return axiosClient.get('/discounts', { params });
}

export async function getDiscountById(id) {
  if (isMockEnabled()) {
    return mockDiscounts.mockGetDiscountById(id);
  }
  return axiosClient.get(`/discounts/${id}`);
}

export async function createDiscount(data) {
  if (isMockEnabled()) {
    return mockDiscounts.mockCreateDiscount(data);
  }
  return axiosClient.post('/discounts', data);
}

export async function updateDiscount(id, data) {
  if (isMockEnabled()) {
    return mockDiscounts.mockUpdateDiscount(id, data);
  }
  return axiosClient.put(`/discounts/${id}`, data);
}

export async function deleteDiscount(id) {
  if (isMockEnabled()) {
    return mockDiscounts.mockDeleteDiscount(id);
  }
  return axiosClient.delete(`/discounts/${id}`);
}

