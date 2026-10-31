import axiosClient from '../../api/axiosClient';

export async function login(credentials) {
  return axiosClient.post('/auth/login', credentials);
}

export async function register(data) {
  return axiosClient.post('/auth/register', data);
}

export async function getMe() {
  return axiosClient.get('/auth/me');
}

export async function forgotPassword(email) {
  return axiosClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(payload) {
  return axiosClient.post('/auth/reset-password', payload);
}
