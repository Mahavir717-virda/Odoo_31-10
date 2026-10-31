import { mockPaginatedResponse, mockResponse } from '../../api/mockHelper';

let productsList = [
  {
    id: 1,
    name: 'Cloud Hosting Basic',
    sku: 'CLOUD-BASIC',
    price: 29.0,
    status: 'active',
    category: 'Hosting',
    variants: [{ id: 101, name: 'Standard (1 CPU / 2GB RAM)', price: 29.0 }],
  },
  {
    id: 2,
    name: 'Cloud Hosting Enterprise',
    sku: 'CLOUD-ENT',
    price: 99.0,
    status: 'active',
    category: 'Hosting',
    variants: [
      { id: 201, name: 'Pro (4 CPU / 8GB RAM)', price: 99.0 },
      { id: 202, name: 'Dedicated (8 CPU / 16GB RAM)', price: 199.0 },
    ],
  },
  {
    id: 3,
    name: 'SSL Wildcard Certificate',
    sku: 'SSL-WILD',
    price: 49.0,
    status: 'active',
    category: 'Security',
    variants: [],
  },
];

export async function mockGetProducts(params) {
  return mockPaginatedResponse(productsList, params, 250);
}

export async function mockGetProductById(id) {
  const item = productsList.find((p) => p.id === Number(id));
  return mockResponse(item || null, 200);
}

export async function mockCreateProduct(data) {
  const newProduct = {
    id: Date.now(),
    name: data.name,
    sku: data.sku,
    price: Number(data.price) || 0,
    status: data.status || 'active',
    category: data.category || 'General',
    variants: data.variants || [],
  };
  productsList.push(newProduct);
  return mockResponse(newProduct, 250);
}

export async function mockUpdateProduct(id, data) {
  const idx = productsList.findIndex((p) => p.id === Number(id));
  if (idx !== -1) {
    productsList[idx] = { ...productsList[idx], ...data };
    return mockResponse(productsList[idx], 250);
  }
  return mockResponse(null, 250);
}

export async function mockDeleteProduct(id) {
  productsList = productsList.filter((p) => p.id !== Number(id));
  return mockResponse({ success: true }, 250);
}

