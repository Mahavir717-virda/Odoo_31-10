import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let taxesStore = [
  {
    id: 1,
    name: 'GST 18%',
    rate_percent: 18.0,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'VAT Standard 20%',
    rate_percent: 20.0,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 3,
    name: 'Reduced GST 5%',
    rate_percent: 5.0,
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 4,
    name: 'Zero Rated 0%',
    rate_percent: 0.0,
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 5,
    name: 'Service Tax 12%',
    rate_percent: 12.0,
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 6,
    name: 'State Sales Tax 4.5%',
    rate_percent: 4.5,
    is_active: true,
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 7,
    name: 'Export Exemption 0%',
    rate_percent: 0.0,
    is_active: false,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

export async function mockGetTaxes(params) {
  return mockPaginatedResponse(taxesStore, params, 200);
}

export async function mockGetTaxById(id) {
  const tax = taxesStore.find((t) => t.id === Number(id));
  return mockResponse(tax || null, 150);
}

export async function mockCreateTax(data) {
  const newTax = {
    id: Date.now(),
    name: data.name?.trim(),
    rate_percent: Number(data.rate_percent) || 0,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  taxesStore.unshift(newTax);
  return mockResponse(newTax, 200);
}

export async function mockUpdateTax(id, data) {
  const index = taxesStore.findIndex((t) => t.id === Number(id));
  if (index !== -1) {
    taxesStore[index] = {
      ...taxesStore[index],
      name: data.name !== undefined ? data.name.trim() : taxesStore[index].name,
      rate_percent: data.rate_percent !== undefined ? Number(data.rate_percent) : taxesStore[index].rate_percent,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : taxesStore[index].is_active,
      updated_at: new Date().toISOString(),
    };
    return mockResponse(taxesStore[index], 200);
  }
  return mockResponse(null, 200);
}

export async function mockDeleteTax(id) {
  taxesStore = taxesStore.filter((t) => t.id !== Number(id));
  return mockResponse({ success: true }, 200);
}
