import { mockResponse } from '../../api/mockHelper';

export const MOCK_AUTH_USERS = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@brightloop.test',
    role: 'ADMIN',
    company: 'Brightloop Admin Corp',
    phone: '+1-555-0100',
    is_active: true,
  },
  {
    id: 2,
    name: 'Staff Member',
    email: 'staff@brightloop.test',
    role: 'STAFF',
    company: 'Brightloop Operations',
    phone: '+1-555-0150',
    is_active: true,
  },
  {
    id: 3,
    name: 'Sarah Connor (Support Lead)',
    email: 'sarah.connor@brightloop.test',
    role: 'STAFF',
    company: 'Brightloop Support',
    phone: '+1-555-0151',
    is_active: true,
  },
  {
    id: 4,
    name: 'David Kim (Billing Analyst)',
    email: 'david.kim@brightloop.test',
    role: 'STAFF',
    company: 'Brightloop Finance',
    phone: '+1-555-0152',
    is_active: true,
  },
  {
    id: 5,
    name: 'Acme Corp Contact',
    email: 'customer1@acme.test',
    role: 'CUSTOMER',
    company: 'Acme Corporation',
    phone: '+1-555-0101',
    address: '100 Acme Way, Metropolis',
    is_active: true,
  },
  {
    id: 6,
    name: 'Globex Contact',
    email: 'customer2@globex.test',
    role: 'CUSTOMER',
    company: 'Globex Inc',
    phone: '+1-555-0102',
    address: '200 Globex Blvd, Silicon City',
    is_active: true,
  },
  {
    id: 7,
    name: 'Tony Stark',
    email: 'tony@stark.test',
    role: 'CUSTOMER',
    company: 'Stark Industries',
    phone: '+1-555-0107',
    address: '10880 Malibu Point, CA',
    is_active: true,
  },
  {
    id: 8,
    name: 'Bruce Wayne',
    email: 'bruce@wayne.test',
    role: 'CUSTOMER',
    company: 'Wayne Enterprises',
    phone: '+1-555-0108',
    address: '1007 Mountain Drive, Gotham',
    is_active: true,
  },
];

export async function mockLogin({ email, role }) {
  let matchedUser = null;
  if (email) {
    matchedUser = MOCK_AUTH_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  }
  if (!matchedUser && role) {
    matchedUser = MOCK_AUTH_USERS.find(
      (u) => u.role.toLowerCase() === String(role).toLowerCase()
    );
  }
  if (!matchedUser) {
    matchedUser = MOCK_AUTH_USERS[0]; // fallback to admin
  }

  const token = `mock-token-${matchedUser.role.toLowerCase()}-${Date.now()}`;
  return mockResponse({ user: matchedUser, token }, 200);
}

export async function mockRegister(payload) {
  const newUser = {
    id: Date.now(),
    name: payload?.name || 'New Customer',
    email: payload?.email,
    role: 'CUSTOMER',
    company: payload?.company || '',
    phone: payload?.phone || '',
    address: payload?.address || '',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  const token = `mock-token-customer-${Date.now()}`;
  return mockResponse({ user: newUser, token }, 250);
}

export async function mockForgotPassword(email) {
  return mockResponse(
    { message: `Password reset link sent to ${email}. Please check your inbox.` },
    250
  );
}

export async function mockResetPassword() {
  return mockResponse(
    { message: 'Your password has been successfully updated. You may now sign in.' },
    250
  );
}

export async function mockGetMe() {
  return mockResponse({ user: MOCK_AUTH_USERS[0] }, 100);
}
