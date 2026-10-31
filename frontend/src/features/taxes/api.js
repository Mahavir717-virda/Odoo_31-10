import axiosClient from '../../api/axiosClient';

export async function getTaxes(params) {
  return axiosClient.get('/taxes', { params });
}

export async function getTaxById(id) {
  return axiosClient.get(`/taxes/${id}`);
}

export async function createTax(data) {
  return axiosClient.post('/taxes', data);
}

export async function updateTax(id, data) {
  return axiosClient.put(`/taxes/${id}`, data);
}

export async function deleteTax(id) {
  return axiosClient.delete(`/taxes/${id}`);
}
