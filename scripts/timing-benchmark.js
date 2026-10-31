const http = require('http');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const env = require('../src/config/env');
const app = require('../src/app');

// Generate an admin token for testing
const adminToken = jwt.sign(
  { id: 1, email: 'admin@brightloop.test', role: 'ADMIN' },
  env.JWT_SECRET,
  { expiresIn: '1h' }
);

function makeRequest(serverUrl, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const start = process.hrtime.bigint();
    const req = http.request(
      url,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const duration = Number(process.hrtime.bigint() - start) / 1e6; // ms
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, duration, ok: true });
          } else {
            resolve({ statusCode: res.statusCode, duration, ok: false, error: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function benchmarkEndpoint(serverUrl, endpoint) {
  // 1 concurrent request
  const run1 = await makeRequest(serverUrl, endpoint);

  // 20 concurrent requests
  const startC20 = process.hrtime.bigint();
  const c20Promises = Array.from({ length: 20 }, () => makeRequest(serverUrl, endpoint));
  const resultsC20 = await Promise.all(c20Promises);
  const totalC20Time = Number(process.hrtime.bigint() - startC20) / 1e6;
  const avgC20 = resultsC20.reduce((acc, r) => acc + r.duration, 0) / 20;
  const maxC20 = Math.max(...resultsC20.map((r) => r.duration));

  return {
    endpoint,
    c1_ms: run1.duration.toFixed(2),
    c20_avg_ms: avgC20.toFixed(2),
    c20_max_ms: maxC20.toFixed(2),
    c20_total_ms: totalC20Time.toFixed(2),
    status: run1.statusCode,
  };
}

async function runBenchmark() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;

  console.log(`Test server running on ${serverUrl}\n`);

  const endpoints = [
    '/api/reports/summary',
    '/api/reports/summary?from=2025-01-01&to=2026-12-31',
    '/api/reports/overdue',
    '/api/reports/revenue',
    '/api/subscriptions?page=1&limit=20',
    '/api/subscriptions?status=ACTIVE&search=Customer%2010',
    '/api/invoices?page=1&limit=20',
    '/api/invoices?status=CONFIRMED&search=Customer%2010',
    '/api/payments?page=1&limit=20',
    '/api/payments?from=2025-01-01&to=2026-12-31',
    '/api/users?page=1&limit=20&search=Customer%2010',
    '/api/products?page=1&limit=20',
    '/api/plans?page=1&limit=20',
    '/api/taxes?page=1&limit=20',
    '/api/quotation-templates?page=1&limit=20',
  ];

  console.log('Timing endpoints with concurrency 1 and 20...\n');
  const tableData = [];

  for (const endpoint of endpoints) {
    const res = await benchmarkEndpoint(serverUrl, endpoint);
    tableData.push(res);
  }

  console.log('| Endpoint | Status | Concurrency 1 (ms) | Concurrency 20 Avg (ms) | Concurrency 20 Max (ms) |');
  console.log('| :--- | :---: | :---: | :---: | :---: |');
  for (const row of tableData) {
    console.log(`| \`${row.endpoint}\` | ${row.status} | ${row.c1_ms} ms | ${row.c20_avg_ms} ms | ${row.c20_max_ms} ms |`);
  }

  server.close();
  require('../src/config/db').pool.end();
}

runBenchmark().catch(console.error);
