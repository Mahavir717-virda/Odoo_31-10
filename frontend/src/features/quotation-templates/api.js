import axiosClient from '../../api/axiosClient';
import { getPayload, normalizeListResponse } from '../../api/featureUtils';

export async function fetchTemplates(params = {}) {
  const response = await axiosClient.get('/quotation-templates', { params });
  return normalizeListResponse(response);
}

export async function getTemplate(id) {
  return getPayload(await axiosClient.get(`/quotation-templates/${id}`));
}

export async function createTemplate(payload) {
  return getPayload(await axiosClient.post('/quotation-templates', payload));
}

export async function updateTemplate(id, payload) {
  return getPayload(await axiosClient.put(`/quotation-templates/${id}`, payload));
}

export async function deleteTemplate(id) {
  return getPayload(await axiosClient.delete(`/quotation-templates/${id}`));
}
