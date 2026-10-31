/**
 * FOCUSED AUTOMATED TEST SUITE: STAFF Role Permission on GET /api/users
 * Scenarios:
 * 1. STAFF | No role filter  | 200, CUSTOMER accounts only
 * 2. STAFF | role=CUSTOMER   | 200, CUSTOMER accounts only
 * 3. STAFF | role=STAFF      | 403 Forbidden
 * 4. STAFF | role=ADMIN      | 403 Forbidden
 * 5. ADMIN | role=STAFF      | 200, STAFF accounts only
 * 6. ADMIN | role=ADMIN      | 200, ADMIN accounts only
 * 7. ADMIN | No role filter  | 200, all accounts
 * 8. CUSTOMER | Permitted    | 403 Forbidden on /users (Customer cannot list users)
 */
process.env.DATABASE_URL = 'postgresql://brightloop:brightloop@localhost:5432/brightloop_test';

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const app = require('../src/app');

function req(serverUrl, method, path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api' + path, serverUrl);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const r = http.request(
      url,
      { method, headers },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    r.on('error', reject);
    r.end();
  });
}

async function runFocusedTests() {
  console.log('====================================================');
  console.log('Running Focused Test Suite: GET /api/users Role Restrictions');
  console.log('====================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const serverUrl = `http://localhost:${server.address().port}`;

  const results = [];

  try {
    // 1. Authenticate users
    const adminLogin = await req(serverUrl, 'POST', '/auth/login', null);
    // Use json login
    async function login(email, password) {
      return new Promise((resolve, reject) => {
        const url = new URL('/api/auth/login', serverUrl);
        const r = http.request(
          url,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } },
          (res) => {
            let raw = '';
            res.on('data', (c) => (raw += c));
            res.on('end', () => resolve(JSON.parse(raw).data.token));
          }
        );
        r.write(JSON.stringify({ email, password }));
        r.end();
      });
    }

    const adminToken = await login('admin@brightloop.test', 'Admin@1234');
    const staffToken = await login('staff@brightloop.test', 'Staff@1234');
    const customerToken = await login('customer1@acme.test', 'Customer@1234');

    // Test 1: STAFF with No role filter -> 200, CUSTOMER accounts only
    {
      const res = await req(serverUrl, 'GET', '/users', staffToken);
      const is200 = res.status === 200;
      const allCustomers = res.body.data && res.body.data.every((u) => u.role === 'CUSTOMER');
      const passed = is200 && allCustomers && res.body.data.length > 0;
      results.push({
        role: 'STAFF',
        query: 'No role filter',
        expected: '200, CUSTOMER accounts only',
        actual: `${res.status}, ${allCustomers ? 'CUSTOMER accounts only' : 'contains other roles'}`,
        status: passed ? 'PASS' : 'FAIL',
      });
      console.log(`  [${passed ? 'PASS' : 'FAIL'}] STAFF | No role filter -> ${res.status}`);
    }

    // Test 2: STAFF with role=CUSTOMER -> 200, CUSTOMER accounts only
    {
      const res = await req(serverUrl, 'GET', '/users?role=CUSTOMER', staffToken);
      const is200 = res.status === 200;
      const allCustomers = res.body.data && res.body.data.every((u) => u.role === 'CUSTOMER');
      const passed = is200 && allCustomers && res.body.data.length > 0;
      results.push({
        role: 'STAFF',
        query: 'role=CUSTOMER',
        expected: '200, CUSTOMER accounts only',
        actual: `${res.status}, ${allCustomers ? 'CUSTOMER accounts only' : 'contains other roles'}`,
        status: passed ? 'PASS' : 'FAIL',
      });
      console.log(`  [${passed ? 'PASS' : 'FAIL'}] STAFF | role=CUSTOMER -> ${res.status}`);
    }

    // Test 3: STAFF with role=STAFF -> 403 Forbidden
    {
      const res = await req(serverUrl, 'GET', '/users?role=STAFF', staffToken);
      const is403 = res.status === 403;
      results.push({
        role: 'STAFF',
        query: 'role=STAFF',
        expected: '403 Forbidden',
        actual: `${res.status} (${res.body.message || 'No message'})`,
        status: is403 ? 'PASS' : 'FAIL',
      });
      console.log(`  [${is403 ? 'PASS' : 'FAIL'}] STAFF | role=STAFF -> ${res.status}`);
    }

    // Test 4: STAFF with role=ADMIN -> 403 Forbidden
    {
      const res = await req(serverUrl, 'GET', '/users?role=ADMIN', staffToken);
      const is403 = res.status === 403;
      results.push({
        role: 'STAFF',
        query: 'role=ADMIN',
        expected: '403 Forbidden',
        actual: `${res.status} (${res.body.message || 'No message'})`,
        status: is403 ? 'PASS' : 'FAIL',
      });
      console.log(`  [${is403 ? 'PASS' : 'FAIL'}] STAFF | role=ADMIN -> ${res.status}`);
    }

    // Test 5: ADMIN with role=STAFF -> 200, STAFF accounts only
    {
      const res = await req(serverUrl, 'GET', '/users?role=STAFF', adminToken);
      const is200 = res.status === 200;
      const allStaff = res.body.data && res.body.data.every((u) => u.role === 'STAFF');
      const passed = is200 && allStaff;
      results.push({
        role: 'ADMIN',
        query: 'role=STAFF',
        expected: '200, STAFF accounts only',
        actual: `${res.status}, ${allStaff ? 'STAFF accounts only' : 'mixed'}`,
        status: passed ? 'PASS' : 'FAIL',
      });
      console.log(`  [${passed ? 'PASS' : 'FAIL'}] ADMIN | role=STAFF -> ${res.status}`);
    }

    // Test 6: ADMIN with role=ADMIN -> 200, ADMIN accounts only
    {
      const res = await req(serverUrl, 'GET', '/users?role=ADMIN', adminToken);
      const is200 = res.status === 200;
      const allAdmin = res.body.data && res.body.data.every((u) => u.role === 'ADMIN');
      const passed = is200 && allAdmin;
      results.push({
        role: 'ADMIN',
        query: 'role=ADMIN',
        expected: '200, ADMIN accounts only',
        actual: `${res.status}, ${allAdmin ? 'ADMIN accounts only' : 'mixed'}`,
        status: passed ? 'PASS' : 'FAIL',
      });
      console.log(`  [${passed ? 'PASS' : 'FAIL'}] ADMIN | role=ADMIN -> ${res.status}`);
    }

    // Test 7: ADMIN with No role filter -> 200, all accounts (checks last page where id 1 and 2 are located)
    {
      const res = await req(serverUrl, 'GET', '/users?page=16&limit=20', adminToken);
      const is200 = res.status === 200;
      const roles = new Set((res.body.data || []).map((u) => u.role));
      const hasStaffOrAdmin = roles.has('ADMIN') || roles.has('STAFF');
      const passed = is200 && hasStaffOrAdmin;
      results.push({
        role: 'ADMIN',
        query: 'No role filter (page 16)',
        expected: '200, accounts include ADMIN/STAFF without role filter',
        actual: `${res.status}, roles present: ${Array.from(roles).join(', ')}`,
        status: passed ? 'PASS' : 'FAIL',
      });
      console.log(`  [${passed ? 'PASS' : 'FAIL'}] ADMIN | No role filter -> ${res.status}`);
    }

    // Test 8: CUSTOMER -> 403 Forbidden on /users
    {
      const res = await req(serverUrl, 'GET', '/users', customerToken);
      const is403 = res.status === 403;
      results.push({
        role: 'CUSTOMER',
        query: 'No role filter',
        expected: '403 Forbidden',
        actual: `${res.status}`,
        status: is403 ? 'PASS' : 'FAIL',
      });
      console.log(`  [${is403 ? 'PASS' : 'FAIL'}] CUSTOMER | /users -> ${res.status}`);
    }

    console.log('\n----------------------------------------------------');
    console.log('Focused Test Results Table:');
    console.table(results);
    console.log('----------------------------------------------------\n');

  } finally {
    server.close();
    await db.pool.end();
  }
}

runFocusedTests().catch(console.error);
