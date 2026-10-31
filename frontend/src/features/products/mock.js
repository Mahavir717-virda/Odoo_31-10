import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let productsStore = [
  {
    id: 1,
    name: 'CRM Suite',
    type: 'SERVICE',
    sales_price: 2500.0,
    cost_price: 500.0,
    tax_id: 1,
    tax_name: 'GST 18%',
    tax_rate: 18.0,
    notes: 'Enterprise relationship management system with workflow automation.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    variants: [
      { id: 101, product_id: 1, attribute: 'Brand', value: 'Odoo', extra_price: 560.0 },
      { id: 102, product_id: 1, attribute: 'Team Size', value: '10 Users License', extra_price: 450.0 },
    ],
  },
  {
    id: 2,
    name: 'Helpdesk Add-on',
    type: 'ADDON',
    sales_price: 1200.0,
    cost_price: 200.0,
    tax_id: 1,
    tax_name: 'GST 18%',
    tax_rate: 18.0,
    notes: 'Ticketing and SLA resolution tracking module.',
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
    variants: [
      { id: 201, product_id: 2, attribute: 'Brand', value: 'Odoo', extra_price: 560.0 },
      { id: 202, product_id: 2, attribute: 'Coverage', value: '24/7 Priority SLA', extra_price: 300.0 },
    ],
  },
  {
    id: 3,
    name: 'Analytics Pack',
    type: 'SERVICE',
    sales_price: 1800.0,
    cost_price: 300.0,
    tax_id: 1,
    tax_name: 'GST 18%',
    tax_rate: 18.0,
    notes: 'Real-time telemetry, cohort retention, and revenue dashboards.',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
    variants: [
      { id: 301, product_id: 3, attribute: 'Brand', value: 'Odoo', extra_price: 560.0 },
      { id: 302, product_id: 3, attribute: 'Connector', value: 'BigQuery Sync', extra_price: 250.0 },
    ],
  },
  {
    id: 4,
    name: 'Dedicated Server Hardware',
    type: 'GOODS',
    sales_price: 4500.0,
    cost_price: 3000.0,
    tax_id: 2,
    tax_name: 'VAT Standard 20%',
    tax_rate: 20.0,
    notes: 'Rack-mounted 1U bare metal node with dual power supplies.',
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
    variants: [
      { id: 401, product_id: 4, attribute: 'Memory', value: '64GB DDR5 ECC', extra_price: 600.0 },
      { id: 402, product_id: 4, attribute: 'Storage', value: '2x 2TB NVMe RAID', extra_price: 500.0 },
    ],
  },
  {
    id: 5,
    name: 'Payment Gateway Connector',
    type: 'ADDON',
    sales_price: 650.0,
    cost_price: 80.0,
    tax_id: 1,
    tax_name: 'GST 18%',
    tax_rate: 18.0,
    notes: 'Multi-currency checkout integration plugin.',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
    variants: [
      { id: 501, product_id: 5, attribute: 'Provider', value: 'Stripe Direct', extra_price: 150.0 },
      { id: 502, product_id: 5, attribute: 'Provider', value: 'Adyen Global', extra_price: 200.0 },
    ],
  },
  {
    id: 6,
    name: 'Onboarding & Implementation',
    type: 'SERVICE',
    sales_price: 3200.0,
    cost_price: 1000.0,
    tax_id: 1,
    tax_name: 'GST 18%',
    tax_rate: 18.0,
    notes: 'Guided data migration, staff training, and deployment audit.',
    is_active: true,
    created_at: '2026-02-15T00:00:00Z',
    variants: [
      { id: 601, product_id: 6, attribute: 'Scope', value: '20 Hours Dedicated', extra_price: 1200.0 },
    ],
  },
  {
    id: 7,
    name: 'Wireless Barcode Scanner',
    type: 'GOODS',
    sales_price: 380.0,
    cost_price: 210.0,
    tax_id: 6,
    tax_name: 'State Sales Tax 4.5%',
    tax_rate: 4.5,
    notes: 'Handheld 2D QR and barcode terminal with cradle.',
    is_active: true,
    created_at: '2026-02-28T00:00:00Z',
    variants: [
      { id: 701, product_id: 7, attribute: 'Interface', value: 'Bluetooth 5.2', extra_price: 60.0 },
    ],
  },
];

export async function mockGetProducts(params) {
  return mockPaginatedResponse(productsStore, params, 200);
}

export async function mockGetProductById(id) {
  const item = productsStore.find((p) => p.id === Number(id));
  return mockResponse(item || null, 150);
}

export async function mockCreateProduct(data) {
  const newProduct = {
    id: Date.now(),
    name: data.name?.trim(),
    type: data.type || 'SERVICE',
    sales_price: Number(data.sales_price) || 0,
    cost_price: Number(data.cost_price) || 0,
    tax_id: data.tax_id ? Number(data.tax_id) : null,
    notes: data.notes || '',
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    variants: Array.isArray(data.variants)
      ? data.variants.map((v, i) => ({
          id: v.id || Date.now() + i,
          attribute: v.attribute?.trim(),
          value: v.value?.trim(),
          extra_price: Number(v.extra_price) || 0,
        }))
      : [],
    created_at: new Date().toISOString(),
  };
  productsStore.unshift(newProduct);
  return mockResponse(newProduct, 200);
}

export async function mockUpdateProduct(id, data) {
  const index = productsStore.findIndex((p) => p.id === Number(id));
  if (index !== -1) {
    productsStore[index] = {
      ...productsStore[index],
      name: data.name !== undefined ? data.name.trim() : productsStore[index].name,
      type: data.type !== undefined ? data.type : productsStore[index].type,
      sales_price: data.sales_price !== undefined ? Number(data.sales_price) : productsStore[index].sales_price,
      cost_price: data.cost_price !== undefined ? Number(data.cost_price) : productsStore[index].cost_price,
      tax_id: data.tax_id !== undefined ? (data.tax_id ? Number(data.tax_id) : null) : productsStore[index].tax_id,
      notes: data.notes !== undefined ? data.notes : productsStore[index].notes,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : productsStore[index].is_active,
      variants: Array.isArray(data.variants)
        ? data.variants.map((v, i) => ({
            id: v.id || Date.now() + i,
            attribute: v.attribute?.trim(),
            value: v.value?.trim(),
            extra_price: Number(v.extra_price) || 0,
          }))
        : productsStore[index].variants,
    };
    return mockResponse(productsStore[index], 200);
  }
  return mockResponse(null, 200);
}

export async function mockDeleteProduct(id) {
  productsStore = productsStore.filter((p) => p.id !== Number(id));
  return mockResponse({ success: true }, 200);
}
