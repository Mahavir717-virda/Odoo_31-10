import axiosClient from '../../api/axiosClient';
import { fetchAllPages, getPayload, normalizeListResponse } from '../../api/featureUtils';

export async function getDiscounts(params) {
  return normalizeListResponse(await axiosClient.get('/discounts', { params }));
}

export async function getDiscountById(id) {
  return getPayload(await axiosClient.get(`/discounts/${id}`));
}

export async function createDiscount(data) {
  return axiosClient.post('/discounts', data);
}

export async function updateDiscount(id, data) {
  return axiosClient.put(`/discounts/${id}`, data);
}

export async function deleteDiscount(id) {
  return axiosClient.delete(`/discounts/${id}`);
}

export async function getDiscountProducts() {
  return fetchAllPages((params) =>
    axiosClient.get('/products', { params: { ...params, is_active: true } })
  );
}
