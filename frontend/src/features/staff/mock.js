import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let staffMembers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@brightloop.test',
    role: 'ADMIN',
    phone: '+1-555-0100',
    company: 'Brightloop Admin',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Staff Member',
    email: 'staff@brightloop.test',
    role: 'STAFF',
    phone: '+1-555-0150',
    company: 'Brightloop Operations',
    is_active: true,
    created_at: '2026-01-10T09:30:00Z',
  },
  {
    id: 3,
    name: 'Sarah Connor',
    email: 'sarah.connor@brightloop.test',
    role: 'STAFF',
    phone: '+1-555-0151',
    company: 'Brightloop Support',
    is_active: true,
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david.kim@brightloop.test',
    role: 'STAFF',
    phone: '+1-555-0152',
    company: 'Brightloop Finance',
    is_active: true,
    created_at: '2026-02-01T14:15:00Z',
  },
  {
    id: 5,
    name: 'Elena Rostova',
    email: 'elena.rostova@brightloop.test',
    role: 'STAFF',
    phone: '+1-555-0153',
    company: 'Brightloop Customer Success',
    is_active: true,
    created_at: '2026-02-12T10:00:00Z',
  },
  {
    id: 6,
    name: 'Marcus Vance',
    email: 'marcus.vance@brightloop.test',
    role: 'ADMIN',
    phone: '+1-555-0154',
    company: 'Brightloop Security',
    is_active: true,
    created_at: '2026-02-20T16:45:00Z',
  },
  {
    id: 7,
    name: 'Rachel Green',
    email: 'rachel.green@brightloop.test',
    role: 'STAFF',
    phone: '+1-555-0155',
    company: 'Brightloop Billing',
    is_active: false,
    created_at: '2026-03-01T13:20:00Z',
  },
];

export async function mockGetStaffList(params) {
  return mockPaginatedResponse(staffMembers, params, 200);
}

export async function mockGetStaffById(id) {
  const staff = staffMembers.find((s) => s.id === Number(id));
  return mockResponse(staff || null, 150);
}

export async function mockCreateStaff(data) {
  const newStaff = {
    id: Date.now(),
    name: data.name?.trim(),
    email: data.email?.trim(),
    role: String(data.role || 'STAFF').toUpperCase(),
    phone: data.phone?.trim() || '',
    company: data.company?.trim() || 'Brightloop',
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    created_at: new Date().toISOString(),
  };
  staffMembers.unshift(newStaff);
  return mockResponse(newStaff, 200);
}

export async function mockUpdateStaff(id, data) {
  const index = staffMembers.findIndex((s) => s.id === Number(id));
  if (index !== -1) {
    staffMembers[index] = {
      ...staffMembers[index],
      name: data.name !== undefined ? data.name.trim() : staffMembers[index].name,
      email: data.email !== undefined ? data.email.trim() : staffMembers[index].email,
      role: data.role !== undefined ? String(data.role).toUpperCase() : staffMembers[index].role,
      phone: data.phone !== undefined ? data.phone.trim() : staffMembers[index].phone,
      company: data.company !== undefined ? data.company.trim() : staffMembers[index].company,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : staffMembers[index].is_active,
    };
    return mockResponse(staffMembers[index], 200);
  }
  return mockResponse(null, 200);
}

export async function mockDeleteStaff(id) {
  staffMembers = staffMembers.filter((s) => s.id !== Number(id));
  return mockResponse({ success: true }, 200);
}
