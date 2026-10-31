import axiosClient from '../../api/axiosClient';
import { isMockEnabled } from '../../api/mockHelper';
import * as mockAuth from './mock';

export async function login(credentials) {
  if (isMockEnabled()) {
    return mockAuth.mockLogin(credentials);
  }
  return axiosClient.post('/auth/login', credentials);
}

export async function register(data) {
  if (isMockEnabled()) {
    return mockAuth.mockRegister(data);
  }
  return axiosClient.post('/auth/register', data);
}

export async function getMe() {
  if (isMockEnabled()) {
    return mockAuth.mockGetMe();
  }
  return axiosClient.get('/auth/me');
}

export async function forgotPassword(email) {
  if (isMockEnabled()) {
    return mockAuth.mockForgotPassword(email);
  }
  return axiosClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(payload) {
  if (isMockEnabled()) {
    return mockAuth.mockResetPassword(payload);
  }
  return axiosClient.post('/auth/reset-password', payload);
}

