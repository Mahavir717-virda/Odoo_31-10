import axiosClient from '../../api/axiosClient';

export async function getProducts(params) {
  return axiosClient.get('/products', { params });
}

export async function getProductById(id) {
  return axiosClient.get(`/products/${id}`);
}

export async function createProduct(data) {
  return axiosClient.post('/products', data);
}

export async function updateProduct(id, data) {
  return axiosClient.put(`/products/${id}`, data);
}

export async function deleteProduct(id) {
  return axiosClient.delete(`/products/${id}`);
}
