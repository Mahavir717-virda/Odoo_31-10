import axiosClient from '../../api/axiosClient';
import { isMockEnabled } from '../../api/mockHelper';
import * as mockProducts from './mock';

export async function getProducts(params) {
  if (isMockEnabled()) {
    return mockProducts.mockGetProducts(params);
  }
  return axiosClient.get('/products', { params });
}

export async function getProductById(id) {
  if (isMockEnabled()) {
    return mockProducts.mockGetProductById(id);
  }
  return axiosClient.get(`/products/${id}`);
}

export async function createProduct(data) {
  if (isMockEnabled()) {
    return mockProducts.mockCreateProduct(data);
  }
  return axiosClient.post('/products', data);
}

export async function updateProduct(id, data) {
  if (isMockEnabled()) {
    return mockProducts.mockUpdateProduct(id, data);
  }
  return axiosClient.put(`/products/${id}`, data);
}

export async function deleteProduct(id) {
  if (isMockEnabled()) {
    return mockProducts.mockDeleteProduct(id);
  }
  return axiosClient.delete(`/products/${id}`);
}

