import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let discountsList = [
  {
    id: 1,
    name: 'Early Adopter 20% Off',
    code: 'EARLYBIRD20',
    discount_type: 'percentage',
    value: 20.0,
    max_uses: 100,
    current_uses: 45,
    valid_until: '2027-12-31',
    status: 'active',
  },
  {
    id: 2,
    name: 'New Year $50 Credit',
    code: 'WELCOME50',
    discount_type: 'fixed',
    value: 50.0,
    max_uses: 500,
    current_uses: 210,
    valid_until: '2027-06-30',
    status: 'active',
  },
  {
    id: 3,
    name: 'Black Friday Super Promo',
    code: 'BFPROMO',
    discount_type: 'percentage',
    value: 30.0,
    max_uses: 50,
    current_uses: 50,
    valid_until: '2025-11-30',
    status: 'expired',
  },
];

export async function mockGetDiscounts(params) {
  return mockPaginatedResponse(discountsList, params, 250);
}

export async function mockGetDiscountById(id) {
  const item = discountsList.find((d) => d.id === Number(id));
  return mockResponse(item || null, 200);
}

export async function mockCreateDiscount(data) {
  const newDiscount = {
    id: Date.now(),
    name: data.name,
    code: data.code?.toUpperCase(),
    discount_type: data.discount_type || 'percentage',
    value: Number(data.value) || 0,
    max_uses: Number(data.max_uses) || 0,
    current_uses: 0,
    valid_until: data.valid_until || null,
    status: data.status || 'active',
  };
  discountsList.push(newDiscount);
  return mockResponse(newDiscount, 250);
}

export async function mockUpdateDiscount(id, data) {
  const idx = discountsList.findIndex((d) => d.id === Number(id));
  if (idx !== -1) {
    discountsList[idx] = { ...discountsList[idx], ...data };
    return mockResponse(discountsList[idx], 250);
  }
  return mockResponse(null, 250);
}

export async function mockDeleteDiscount(id) {
  discountsList = discountsList.filter((d) => d.id !== Number(id));
  return mockResponse({ success: true }, 250);
}
