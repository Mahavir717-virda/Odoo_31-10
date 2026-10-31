import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let plansList = [
  {
    id: 1,
    name: 'Starter Monthly',
    code: 'PLAN-START-M',
    billing_interval: 'month',
    interval_count: 1,
    price: 19.0,
    trial_days: 14,
    status: 'active',
    description: 'Perfect for small teams and solo entrepreneurs.',
  },
  {
    id: 2,
    name: 'Professional Yearly',
    code: 'PLAN-PRO-Y',
    billing_interval: 'year',
    interval_count: 1,
    price: 190.0,
    trial_days: 30,
    status: 'active',
    description: 'Advanced capabilities with 2 months free.',
  },
  {
    id: 3,
    name: 'Enterprise Custom',
    code: 'PLAN-ENT',
    billing_interval: 'month',
    interval_count: 1,
    price: 499.0,
    trial_days: 0,
    status: 'active',
    description: 'Full bespoke infrastructure with priority 24/7 SLA.',
  },
];

export async function mockGetPlans(params) {
  return mockPaginatedResponse(plansList, params, 250);
}

export async function mockGetPlanById(id) {
  const plan = plansList.find((p) => p.id === Number(id));
  return mockResponse(plan || null, 200);
}

export async function mockCreatePlan(data) {
  const newPlan = {
    id: Date.now(),
    name: data.name,
    code: data.code,
    billing_interval: data.billing_interval || 'month',
    interval_count: Number(data.interval_count) || 1,
    price: Number(data.price) || 0,
    trial_days: Number(data.trial_days) || 0,
    status: data.status || 'active',
    description: data.description || '',
  };
  plansList.push(newPlan);
  return mockResponse(newPlan, 250);
}

export async function mockUpdatePlan(id, data) {
  const idx = plansList.findIndex((p) => p.id === Number(id));
  if (idx !== -1) {
    plansList[idx] = { ...plansList[idx], ...data };
    return mockResponse(plansList[idx], 250);
  }
  return mockResponse(null, 250);
}

export async function mockDeletePlan(id) {
  plansList = plansList.filter((p) => p.id !== Number(id));
  return mockResponse({ success: true }, 250);
}

