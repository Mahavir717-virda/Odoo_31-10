import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let plansStore = [
  {
    id: 1,
    name: 'Monthly Basic',
    price: 999.0,
    billing_period: 'MONTHLY',
    min_quantity: 1,
    start_date: '2025-01-01',
    end_date: null,
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    status: 'ACTIVE',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Yearly Pro',
    price: 9999.0,
    billing_period: 'YEARLY',
    min_quantity: 1,
    start_date: '2025-01-01',
    end_date: null,
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    status: 'ACTIVE',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Quarterly Growth',
    price: 2799.0,
    billing_period: 'MONTHLY',
    min_quantity: 3,
    start_date: '2025-06-01',
    end_date: '2027-06-01',
    auto_close: true,
    closable: true,
    pausable: false,
    renewable: true,
    status: 'ACTIVE',
    created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Legacy Daily Trial',
    price: 49.0,
    billing_period: 'DAILY',
    min_quantity: 1,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    auto_close: true,
    closable: false,
    pausable: false,
    renewable: false,
    status: 'CLOSED',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Enterprise Dedicated SLA',
    price: 15000.0,
    billing_period: 'MONTHLY',
    min_quantity: 1,
    start_date: '2025-01-01',
    end_date: null,
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    status: 'ACTIVE',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 6,
    name: 'Weekly Sprint Pack',
    price: 299.0,
    billing_period: 'WEEKLY',
    min_quantity: 1,
    start_date: '2025-03-01',
    end_date: '2026-12-31',
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: false,
    status: 'PAUSED',
    created_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 7,
    name: 'Annual Startup Accelerator',
    price: 4999.0,
    billing_period: 'YEARLY',
    min_quantity: 2,
    start_date: '2025-02-01',
    end_date: '2027-12-31',
    auto_close: true,
    closable: true,
    pausable: false,
    renewable: true,
    status: 'ACTIVE',
    created_at: '2025-02-01T00:00:00Z',
  },
];

export async function mockGetPlans(params) {
  return mockPaginatedResponse(plansStore, params, 200);
}

export async function mockGetPlanById(id) {
  const plan = plansStore.find((p) => p.id === Number(id));
  return mockResponse(plan || null, 150);
}

export async function mockCreatePlan(data) {
  const newPlan = {
    id: Date.now(),
    name: data.name?.trim(),
    price: Number(data.price) || 0,
    billing_period: data.billing_period || 'MONTHLY',
    min_quantity: Number(data.min_quantity) || 1,
    start_date: data.start_date || new Date().toISOString().split('T')[0],
    end_date: data.end_date || null,
    auto_close: Boolean(data.auto_close),
    closable: data.closable !== undefined ? Boolean(data.closable) : true,
    pausable: Boolean(data.pausable),
    renewable: data.renewable !== undefined ? Boolean(data.renewable) : true,
    status: data.status || 'ACTIVE',
    created_at: new Date().toISOString(),
  };
  plansStore.unshift(newPlan);
  return mockResponse(newPlan, 200);
}

export async function mockUpdatePlan(id, data) {
  const index = plansStore.findIndex((p) => p.id === Number(id));
  if (index !== -1) {
    plansStore[index] = {
      ...plansStore[index],
      name: data.name !== undefined ? data.name.trim() : plansStore[index].name,
      price: data.price !== undefined ? Number(data.price) : plansStore[index].price,
      billing_period: data.billing_period || plansStore[index].billing_period,
      min_quantity: data.min_quantity !== undefined ? Number(data.min_quantity) : plansStore[index].min_quantity,
      start_date: data.start_date !== undefined ? data.start_date : plansStore[index].start_date,
      end_date: data.end_date !== undefined ? data.end_date : plansStore[index].end_date,
      auto_close: data.auto_close !== undefined ? Boolean(data.auto_close) : plansStore[index].auto_close,
      closable: data.closable !== undefined ? Boolean(data.closable) : plansStore[index].closable,
      pausable: data.pausable !== undefined ? Boolean(data.pausable) : plansStore[index].pausable,
      renewable: data.renewable !== undefined ? Boolean(data.renewable) : plansStore[index].renewable,
      status: data.status || plansStore[index].status,
    };
    return mockResponse(plansStore[index], 200);
  }
  return mockResponse(null, 200);
}

export async function mockDeletePlan(id) {
  plansStore = plansStore.filter((p) => p.id !== Number(id));
  return mockResponse({ success: true }, 200);
}

// Lifecycle action: Close Plan
export async function mockClosePlan(id) {
  const plan = plansStore.find((p) => p.id === Number(id));
  if (plan) {
    if (!plan.closable) {
      const err = new Error('This plan is not flagged as closable.');
      err.status = 400;
      throw err;
    }
    plan.status = 'CLOSED';
    return mockResponse(plan, 200);
  }
  return mockResponse(null, 200);
}

// Lifecycle action: Pause / Resume Plan
export async function mockTogglePausePlan(id) {
  const plan = plansStore.find((p) => p.id === Number(id));
  if (plan) {
    if (!plan.pausable) {
      const err = new Error('This plan is not flagged as pausable.');
      err.status = 400;
      throw err;
    }
    plan.status = plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    return mockResponse(plan, 200);
  }
  return mockResponse(null, 200);
}

// Lifecycle action: Renew Plan
export async function mockRenewPlan(id, newEndDate = null) {
  const plan = plansStore.find((p) => p.id === Number(id));
  if (plan) {
    if (!plan.renewable) {
      const err = new Error('This plan is not flagged as renewable.');
      err.status = 400;
      throw err;
    }
    plan.status = 'ACTIVE';
    if (newEndDate) {
      plan.end_date = newEndDate;
    } else if (plan.end_date) {
      // Extend end date by 1 year automatically
      const currentEnd = new Date(plan.end_date);
      currentEnd.setFullYear(currentEnd.getFullYear() + 1);
      plan.end_date = currentEnd.toISOString().split('T')[0];
    }
    return mockResponse(plan, 200);
  }
  return mockResponse(null, 200);
}
