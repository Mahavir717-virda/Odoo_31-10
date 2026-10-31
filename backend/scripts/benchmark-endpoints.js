const app = require('../src/app');
const authService = require('../src/modules/auth/auth.service');

async function benchmark() {
  console.log('=== Benchmarking List Endpoints with Large Seed Data ===\n');

  // Authenticate as ADMIN
  const { token } = await authService.login({
    email: 'admin@brightloop.test',
    password: 'Admin@1234',
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  const endpoints = [
    { name: '1. Subscriptions List (search + status)', path: '/subscriptions?status=ACTIVE&search=Customer%2010&page=1&limit=20' },
    { name: '2. Invoices List (overdue + customer filter)', path: '/invoices?overdue=true&customer_id=10&page=1&limit=20' },
    { name: '3. Invoices Search (search by customer name)', path: '/invoices?search=Customer%2010&page=1&limit=20' },
    { name: '4. Payments List (date range)', path: '/payments?from=2026-01-01&to=2026-06-30&page=1&limit=20' },
    { name: '5. Users List (search)', path: '/users?search=Customer%2010&page=1&limit=20' },
    { name: '6. Products List (search)', path: '/products?search=CRM&page=1&limit=20' },
    { name: '7. Subscriptions Default List', path: '/subscriptions?page=1&limit=20' },
    { name: '8. Invoices Default List', path: '/invoices?page=1&limit=20' },
    { name: '9. Payments Default List', path: '/payments?page=1&limit=20' },
    { name: '10. Plans List', path: '/plans?page=1&limit=20' },
  ];

  for (const ep of endpoints) {
    const t0 = performance.now();
    const res = await fetch(baseUrl + ep.path, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const t1 = performance.now();
    const data = await res.json();
    const duration = (t1 - t0).toFixed(2);
    console.log(`${ep.name.padEnd(48)}: ${duration} ms (Status: ${res.status}, Count: ${data.data?.meta?.total ?? 'N/A'})`);
  }

  server.close();
}

benchmark()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

