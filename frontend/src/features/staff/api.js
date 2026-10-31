import axiosClient from '../../api/axiosClient';
import { isMockEnabled } from '../../api/mockHelper';
import * as mockStaff from './mock';

export async function getStaffList(params) {
  if (isMockEnabled()) {
    return mockStaff.mockGetStaffList(params);
  }
  return axiosClient.get('/staff', { params });
}

export async function getStaffById(id) {
  if (isMockEnabled()) {
    return mockStaff.mockGetStaffById(id);
  }
  return axiosClient.get(`/staff/${id}`);
}

export async function createStaff(data) {
  if (isMockEnabled()) {
    return mockStaff.mockCreateStaff(data);
  }
  return axiosClient.post('/staff', data);
}

export async function updateStaff(id, data) {
  if (isMockEnabled()) {
    return mockStaff.mockUpdateStaff(id, data);
  }
  return axiosClient.put(`/staff/${id}`, data);
}

export async function deleteStaff(id) {
  if (isMockEnabled()) {
    return mockStaff.mockDeleteStaff(id);
  }
  return axiosClient.delete(`/staff/${id}`);
}
