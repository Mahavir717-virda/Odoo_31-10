import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let taxesList = [
  { id: 1, name: 'VAT Standard', rate: 18.0, type: 'percent', is_default: true, status: 'active' },
  { id: 2, name: 'GST Reduced', rate: 5.0, type: 'percent', is_default: false, status: 'active' },
  { id: 3, name: 'Zero Rated Export', rate: 0.0, type: 'percent', is_default: false, status: 'active' },
];

export async function mockGetTaxes(params) {
  return mockPaginatedResponse(taxesList, params, 250);
}

export async function mockCreateTax(data) {
  const newTax = {
    id: Date.now(),
    name: data.name,
    rate: Number(data.rate) || 0,
    type: data.type || 'percent',
    is_default: Boolean(data.is_default),
    status: data.status || 'active',
  };
  taxesList.push(newTax);
  return mockResponse(newTax, 250);
}

export async function mockUpdateTax(id, data) {
  const idx = taxesList.findIndex((t) => t.id === Number(id));
  if (idx !== -1) {
    taxesList[idx] = { ...taxesList[idx], ...data };
    return mockResponse(taxesList[idx], 250);
  }
  return mockResponse(null, 250);
}

export async function mockDeleteTax(id) {
  taxesList = taxesList.filter((t) => t.id !== Number(id));
  return mockResponse({ success: true }, 250);
}

