import { MOCK_TEMPLATES, CUSTOMERS } from './mock';

const API_DELAY = 600;

const delay = () => new Promise((resolve) => setTimeout(resolve, API_DELAY));

let templates = [...MOCK_TEMPLATES];

export async function fetchTemplates(params = {}) {
  await delay();
  const { page = 1, page_size = 10, search = '' } = params;
  const q = String(search).toLowerCase();

  let filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q) ||
      t.payment_terms.toLowerCase().includes(q)
  );

  const total = filtered.length;
  const start = (page - 1) * page_size;
  const data = filtered.slice(start, start + page_size);

  return { data, total, page, page_size };
}

export async function getTemplate(id) {
  await delay();
  const template = templates.find((t) => t.id === id);
  if (!template) {
    throw new Error('Template not found');
  }
  return { data: template };
}

export async function createTemplate(payload) {
  await delay();
  const existing = templates.find((t) => t.name === payload.name);
  if (existing) {
    throw new Error('A template with this name already exists');
  }
  const now = new Date().toISOString().split('T')[0];
  const customer = CUSTOMERS.find((c) => c.id === payload.customer_id);
  const newTemplate = {
    id: `qt_${templates.length + 1}`,
    ...payload,
    customer_name: customer ? customer.name : '',
    created_at: now,
    updated_at: now,
  };
  templates.push(newTemplate);
  return { data: newTemplate };
}

export async function updateTemplate(id, payload) {
  await delay();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Template not found');
  }
  const now = new Date().toISOString().split('T')[0];
  const customer = CUSTOMERS.find((c) => c.id === payload.customer_id);
  const updated = {
    ...templates[index],
    ...payload,
    customer_name: customer ? customer.name : templates[index].customer_name,
    updated_at: now,
  };
  templates[index] = updated;
  return { data: updated };
}

export async function deleteTemplate(id) {
  await delay();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Template not found');
  }
  templates.splice(index, 1);
  return { data: { id } };
}
