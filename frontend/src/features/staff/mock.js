import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';
import { USER_ROLES } from '../../utils/constants';

let staffMembers = [
  { id: 1, name: 'Alice Walker', email: 'alice@odoo.local', role: USER_ROLES.admin, status: 'active', createdAt: '2026-01-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@odoo.local', role: USER_ROLES.staff, status: 'active', createdAt: '2026-02-10' },
  { id: 3, name: 'Charlie Davis', email: 'charlie@odoo.local', role: USER_ROLES.staff, status: 'inactive', createdAt: '2026-03-01' },
];

export async function mockGetStaffList(params) {
  return mockPaginatedResponse(staffMembers, params, 250);
}

export async function mockCreateStaff(data) {
  const newStaff = {
    id: Date.now(),
    name: data.name,
    email: data.email,
    role: data.role || USER_ROLES.staff,
    status: data.status || 'active',
    createdAt: new Date().toISOString().split('T')[0],
  };
  staffMembers.push(newStaff);
  return mockResponse(newStaff, 250);
}

export async function mockUpdateStaff(id, data) {
  const idx = staffMembers.findIndex((s) => s.id === Number(id));
  if (idx !== -1) {
    staffMembers[idx] = { ...staffMembers[idx], ...data };
    return mockResponse(staffMembers[idx], 250);
  }
  return mockResponse(null, 250);
}

export async function mockDeleteStaff(id) {
  staffMembers = staffMembers.filter((s) => s.id !== Number(id));
  return mockResponse({ success: true }, 250);
}

