import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let discountsList = [
  {
    id: 1,
    name: 'WELCOME20',
    type: 'PERCENT',
    value: 20,
    min_purchase: 0,
    min_quantity: 0,
    start_date: '2026-01-01',
    end_date: '2027-12-31',
    usage_limit: 100,
    used_count: 42,
    scope: 'SUBSCRIPTION',
    product_ids: [],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'ENTERPRISE500',
    type: 'FIXED',
    value: 500.0,
    min_purchase: 2500.0,
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: '2027-12-31',
    usage_limit: null,
    used_count: 14,
    scope: 'SUBSCRIPTION',
    product_ids: [],
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 3,
    name: 'CRM_BUNDLE15',
    type: 'PERCENT',
    value: 15,
    min_purchase: 1000.0,
    min_quantity: 2,
    start_date: '2026-02-01',
    end_date: '2026-12-31',
    usage_limit: 50,
    used_count: 18,
    scope: 'PRODUCTS',
    product_ids: [1, 2],
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 4,
    name: 'EARLYBIRD_EXHAUSTED',
    type: 'PERCENT',
    value: 25,
    min_purchase: 0,
    min_quantity: 0,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 30,
    used_count: 30,
    scope: 'SUBSCRIPTION',
    product_ids: [],
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 5,
    name: 'BLACKFRIDAY2024',
    type: 'PERCENT',
    value: 30,
    min_purchase: 500.0,
    min_quantity: 0,
    start_date: '2024-11-20',
    end_date: '2024-11-30',
    usage_limit: 200,
    used_count: 180,
    scope: 'SUBSCRIPTION',
    product_ids: [],
    is_active: false,
    created_at: '2024-11-01T00:00:00Z',
  },
  {
    id: 6,
    name: 'HARDWARE_SAVE50',
    type: 'FIXED',
    value: 50.0,
    min_purchase: 2000.0,
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 75,
    used_count: 8,
    scope: 'PRODUCTS',
    product_ids: [4],
    is_active: true,
    created_at: '2026-01-20T00:00:00Z',
  },
];

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function computeDiscountState(d) {
  const today = getTodayStr();
  const isExpired = Boolean(d.end_date && d.end_date < today);
  const isExhausted = Boolean(
    d.usage_limit !== null &&
    d.usage_limit !== undefined &&
    d.usage_limit > 0 &&
    (d.used_count || 0) >= d.usage_limit
  );

  if (isExpired) return 'expired';
  if (isExhausted) return 'exhausted';
  if (!d.is_active) return 'inactive';
  return 'active';
}

export async function mockGetDiscounts(params = {}) {
  const {
    page = 1,
    page_size = 10,
    search = '',
    scope = '',
    state = '',
    is_active = undefined,
  } = params;

  let filtered = [...discountsList];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((d) => d.name.toLowerCase().includes(q));
  }

  if (scope) {
    filtered = filtered.filter((d) => d.scope === scope);
  }

  if (is_active !== undefined && is_active !== '') {
    const activeBool = is_active === true || is_active === 'true';
    filtered = filtered.filter((d) => Boolean(d.is_active) === activeBool);
  }

  if (state) {
    filtered = filtered.filter((d) => computeDiscountState(d) === state);
  }

  // Sort descending by id
  filtered.sort((a, b) => b.id - a.id);

  return mockPaginatedResponse(filtered, { page, page_size }, 250);
}

export async function mockGetDiscountById(id) {
  const item = discountsList.find((d) => d.id === Number(id));
  return mockResponse(item || null, 200);
}

export async function mockCreateDiscount(data) {
  const newDiscount = {
    id: Date.now(),
    name: (data.name || '').trim().toUpperCase(),
    type: data.type === 'PERCENT' ? 'PERCENT' : 'FIXED',
    value: Number(data.value) || 0,
    min_purchase: Math.max(0, Number(data.min_purchase) || 0),
    min_quantity: Math.max(0, parseInt(data.min_quantity, 10) || 0),
    start_date: data.start_date || getTodayStr(),
    end_date: data.end_date || getTodayStr(),
    usage_limit:
      data.usage_limit === null || data.usage_limit === undefined || data.usage_limit === ''
        ? null
        : Math.max(1, parseInt(data.usage_limit, 10)),
    used_count: 0,
    scope: data.scope === 'PRODUCTS' ? 'PRODUCTS' : 'SUBSCRIPTION',
    product_ids: data.scope === 'PRODUCTS' && Array.isArray(data.product_ids) ? data.product_ids.map(Number) : [],
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    created_at: new Date().toISOString(),
  };

  discountsList.unshift(newDiscount);
  return mockResponse(newDiscount, 250);
}

export async function mockUpdateDiscount(id, data) {
  const idx = discountsList.findIndex((d) => d.id === Number(id));
  if (idx !== -1) {
    const updated = {
      ...discountsList[idx],
      ...data,
      name: data.name !== undefined ? data.name.trim().toUpperCase() : discountsList[idx].name,
      value: data.value !== undefined ? Number(data.value) : discountsList[idx].value,
      min_purchase:
        data.min_purchase !== undefined ? Math.max(0, Number(data.min_purchase)) : discountsList[idx].min_purchase,
      min_quantity:
        data.min_quantity !== undefined ? Math.max(0, parseInt(data.min_quantity, 10)) : discountsList[idx].min_quantity,
      usage_limit:
        data.usage_limit === null || data.usage_limit === '' || data.usage_limit === undefined
          ? (data.usage_limit === null ? null : discountsList[idx].usage_limit)
          : Math.max(1, parseInt(data.usage_limit, 10)),
      product_ids:
        data.product_ids !== undefined ? (Array.isArray(data.product_ids) ? data.product_ids.map(Number) : []) : discountsList[idx].product_ids,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : discountsList[idx].is_active,
    };
    discountsList[idx] = updated;
    return mockResponse(updated, 250);
  }
  return mockResponse(null, 250);
}

export async function mockDeleteDiscount(id) {
  discountsList = discountsList.filter((d) => d.id !== Number(id));
  return mockResponse({ success: true, message: 'Discount deleted successfully' }, 250);
}
