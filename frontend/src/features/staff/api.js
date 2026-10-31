import axiosClient from '../../api/axiosClient';
import { getPayload } from '../../api/featureUtils';

export async function getStaffList(params = {}) {
  const response = await axiosClient.get('/users', { params: { ...params, role: 'STAFF' } });
  const payload = getPayload(response);
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.users)
    ? payload.users
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const meta = response?.meta ?? payload?.meta ?? {};
  return { data, meta, total: Number(meta.total ?? data.length) };
}

export async function createStaff(data) {
  return axiosClient.post('/users/staff', data);
}
