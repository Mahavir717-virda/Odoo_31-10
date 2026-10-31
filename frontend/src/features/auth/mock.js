import { mockResponse } from '../../api/mockHelper';
import { MOCK_USERS } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';

export async function mockLogin({ email, role }) {
  let userRole = role || USER_ROLES.admin;
  if (email) {
    const lower = email.toLowerCase();
    if (lower.includes('customer')) userRole = USER_ROLES.customer;
    else if (lower.includes('staff')) userRole = USER_ROLES.staff;
    else if (lower.includes('admin')) userRole = USER_ROLES.admin;
  }

  const user = {
    ...(MOCK_USERS[userRole] || MOCK_USERS[USER_ROLES.admin]),
    email: email || MOCK_USERS[userRole]?.email,
  };
  const token = `mock-token-${user.role}-${Date.now()}`;

  return mockResponse({ user, token }, 300);
}

export async function mockRegister(payload) {
  const user = {
    id: Date.now(),
    name: payload?.name || 'New Customer',
    email: payload?.email,
    role: payload?.role || USER_ROLES.customer,
  };
  const token = `mock-token-${user.role}-${Date.now()}`;
  return mockResponse({ user, token }, 300);
}

export async function mockForgotPassword(email) {
  return mockResponse({ message: `Password reset link sent to ${email}` }, 300);
}

export async function mockResetPassword() {
  return mockResponse({ message: 'Password has been successfully updated' }, 300);
}

export async function mockGetMe() {
  return mockResponse({ user: MOCK_USERS[USER_ROLES.admin] }, 150);
}

