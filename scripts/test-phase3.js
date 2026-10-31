const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const db = require('../src/config/db');
const http = require('http');
const app = require('../src/app');

function req(serverUrl, method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    const r = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (_) {}
          resolve({ status: res.statusCode, body: json || data, headers: res.headers });
        });
      }
    );
    r.on('error', reject);
    if (body) {
      r.write(JSON.stringify(body));
    }
    r.end();
  });
}

async function runTests() {
  console.log('=== Starting Phase 3 Validation Test Suite ===\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;

  try {
    // 1. Get tokens
    const adminToken = jwt.sign({ id: 1, email: 'admin@brightloop.test', role: 'ADMIN' }, env.JWT_SECRET);

    // Customer 1 and Customer 2
    const custRes = await db.query("SELECT id, email FROM users WHERE role = 'CUSTOMER' ORDER BY id ASC LIMIT 2");
    const cust1 = custRes.rows[0];
    const cust2 = custRes.rows[1];

    const tokenCust1 = jwt.sign({ id: cust1.id, email: cust1.email, role: 'CUSTOMER' }, env.JWT_SECRET);
    const tokenCust2 = jwt.sign({ id: cust2.id, email: cust2.email, role: 'CUSTOMER' }, env.JWT_SECRET);

    console.log(`Cust1 ID: ${cust1.id}, Cust2 ID: ${cust2.id}`);

    // Find a subscription and invoice belonging to Customer 1
    const sub1Res = await db.query('SELECT * FROM subscriptions WHERE customer_id = $1 LIMIT 1', [cust1.id]);
    const sub1 = sub1Res.rows[0];

    const inv1Res = await db.query('SELECT * FROM invoices WHERE customer_id = $1 LIMIT 1', [cust1.id]);
    const inv1 = inv1Res.rows[0];

    // Find a subscription belonging to Customer 2
    const sub2Res = await db.query('SELECT * FROM subscriptions WHERE customer_id = $1 LIMIT 1', [cust2.id]);
    const sub2 = sub2Res.rows[0];

    // ----------------------------------------------------
    // REPORTS TESTS
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Reports (Admin) ---');
    const summary = await req(serverUrl, 'GET', '/api/reports/summary', adminToken);
    console.log('Summary response status:', summary.status, summary.body.data);
    if (summary.status !== 200) throw new Error('Failed to get summary');

    // Manual SQL comparison
    const manualSub = await db.query("SELECT COUNT(*)::int AS count FROM subscriptions WHERE status = 'ACTIVE'");
    const manualPay = await db.query("SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS total FROM payments");
    const manualOverdueCount = await db.query("SELECT COUNT(*)::int AS count FROM invoices WHERE status = 'CONFIRMED' AND due_date < CURRENT_DATE");

    console.log('Manual check: active_subscriptions =', manualSub.rows[0].count, 'summary =', summary.body.data.active_subscriptions);
    if (manualSub.rows[0].count !== summary.body.data.active_subscriptions) throw new Error('active_subscriptions mismatch');

    console.log('Manual check: revenue_received =', parseFloat(manualPay.rows[0].total), 'summary =', summary.body.data.revenue_received);
    if (parseFloat(manualPay.rows[0].total) !== summary.body.data.revenue_received) throw new Error('revenue_received mismatch');

    console.log('Manual check: overdue_count =', manualOverdueCount.rows[0].count, 'summary =', summary.body.data.overdue_count);
    if (manualOverdueCount.rows[0].count !== summary.body.data.overdue_count) throw new Error('overdue_count mismatch');

    // Reports Overdue
    const overdue = await req(serverUrl, 'GET', '/api/reports/overdue', adminToken);
    console.log('Overdue response status:', overdue.status, 'Total overdue:', overdue.body.meta.total);
    if (overdue.status !== 200) throw new Error('Failed to get overdue report');

    // Reports Revenue
    const revenue = await req(serverUrl, 'GET', '/api/reports/revenue', adminToken);
    console.log('Revenue response status:', revenue.status, 'Months returned:', revenue.body.data.length);
    if (revenue.status !== 200 || revenue.body.data.length !== 12) throw new Error('Expected 12 months in revenue report');

    // Customer should be forbidden from reports
    const custReport = await req(serverUrl, 'GET', '/api/reports/summary', tokenCust1);
    console.log('Customer accessing reports status:', custReport.status);
    if (custReport.status !== 403) throw new Error('Customer should get 403 on reports');
    console.log('PASS: Customer forbidden from reports');

    // ----------------------------------------------------
    // CUSTOMER SELF-SERVICE TESTS
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Customer Self-Service ---');

    // Make sure sub1 is ACTIVE and pausable
    await db.query("UPDATE plans SET pausable = TRUE, closable = TRUE WHERE id = $1", [sub1.plan_id]);
    await db.query("UPDATE subscriptions SET status = 'ACTIVE', is_paused = FALSE WHERE id = $1", [sub1.id]);

    // Customer 2 tries to pause Customer 1's subscription -> 404
    const pauseOther = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/pause`, tokenCust2);
    console.log('Customer 2 pausing Customer 1 subscription status:', pauseOther.status);
    if (pauseOther.status !== 404) throw new Error('Customer 2 should get 404 pausing Customer 1 subscription');
    console.log('PASS: Customer cannot pause another customer subscription (404)');

    // Customer 1 pauses their own subscription -> 200
    const pauseOwn = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/pause`, tokenCust1);
    console.log('Customer 1 pausing own subscription status:', pauseOwn.status);
    if (pauseOwn.status !== 200 || !pauseOwn.body.data.is_paused) throw new Error('Failed to pause own subscription');
    console.log('PASS: Customer can pause own subscription');

    // Customer 1 pauses already paused -> 409
    const pauseAgain = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/pause`, tokenCust1);
    console.log('Customer 1 pausing already paused status:', pauseAgain.status);
    if (pauseAgain.status !== 409) throw new Error('Pause already paused should return 409');
    console.log('PASS: Pause already paused returns 409');

    // Customer 1 resumes own subscription -> 200
    const resumeOwn = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/resume`, tokenCust1);
    console.log('Customer 1 resuming own subscription status:', resumeOwn.status);
    if (resumeOwn.status !== 200 || resumeOwn.body.data.is_paused) throw new Error('Failed to resume own subscription');
    console.log('PASS: Customer can resume own subscription');

    // Customer 1 resumes not paused -> 409
    const resumeAgain = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/resume`, tokenCust1);
    console.log('Customer 1 resuming not paused status:', resumeAgain.status);
    if (resumeAgain.status !== 409) throw new Error('Resume not paused should return 409');
    console.log('PASS: Resume not paused returns 409');

    // Customer 1 closes own subscription -> 200
    const closeOwn = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/close`, tokenCust1);
    console.log('Customer 1 closing own subscription status:', closeOwn.status);
    if (closeOwn.status !== 200 || closeOwn.body.data.status !== 'CLOSED' || closeOwn.body.data.next_billing_date !== null) {
      throw new Error('Failed to close own subscription properly');
    }
    console.log('PASS: Customer can close own subscription (sets CLOSED, clears next_billing_date)');

    // Customer 1 closes already closed -> 409
    const closeAgain = await req(serverUrl, 'PATCH', `/api/subscriptions/${sub1.id}/close`, tokenCust1);
    console.log('Customer 1 closing already closed status:', closeAgain.status);
    if (closeAgain.status !== 409) throw new Error('Close non-active subscription should return 409');
    console.log('PASS: Close non-active subscription returns 409');

    // ----------------------------------------------------
    // SCOPING VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 3. Verifying Scoping Isolation across Endpoints ---');

    // Subscriptions list: Customer 1 passes customer_id=Customer 2
    const subList = await req(serverUrl, 'GET', `/api/subscriptions?customer_id=${cust2.id}`, tokenCust1);
    const subData = subList.body.data;
    const hasOtherSubs = subData.some((s) => s.customer_id !== cust1.id);
    if (hasOtherSubs) throw new Error('Customer 1 list contained subscriptions belonging to another customer');
    console.log('PASS: Customer 1 subscription list is strictly scoped to own records even when passing customer_id');

    // Subscriptions detail: Customer 1 accesses Customer 2's subscription -> 404
    const subDetailOther = await req(serverUrl, 'GET', `/api/subscriptions/${sub2.id}`, tokenCust1);
    if (subDetailOther.status !== 404) throw new Error('Customer 1 should get 404 for Customer 2 subscription');
    console.log("PASS: Customer 1 cannot view Customer 2's subscription (404)");

    // Invoices list: Customer 1 passes customer_id=Customer 2
    const invList = await req(serverUrl, 'GET', `/api/invoices?customer_id=${cust2.id}`, tokenCust1);
    const hasOtherInvs = invList.body.data.some((i) => i.customer_id !== cust1.id);
    if (hasOtherInvs) throw new Error('Customer 1 list contained invoices belonging to another customer');
    console.log('PASS: Customer 1 invoice list is strictly scoped to own records even when passing customer_id');

    // Invoices detail: Customer 2 accesses Customer 1's invoice -> 404
    const invDetailOther = await req(serverUrl, 'GET', `/api/invoices/${inv1.id}`, tokenCust2);
    if (invDetailOther.status !== 404) throw new Error('Customer 2 should get 404 for Customer 1 invoice');
    console.log("PASS: Customer 2 cannot view Customer 1's invoice (404)");

    // Invoices print: Customer 2 accesses Customer 1's invoice print -> 404
    const invPrintOther = await req(serverUrl, 'GET', `/api/invoices/${inv1.id}/print`, tokenCust2);
    if (invPrintOther.status !== 404) throw new Error('Customer 2 should get 404 for Customer 1 print');
    console.log("PASS: Customer 2 cannot print Customer 1's invoice (404)");

    // Invoice payments: Customer 2 accesses Customer 1's invoice payments -> 404
    const invPaymentsOther = await req(serverUrl, 'GET', `/api/invoices/${inv1.id}/payments`, tokenCust2);
    if (invPaymentsOther.status !== 404) throw new Error('Customer 2 should get 404 for Customer 1 invoice payments');
    console.log("PASS: Customer 2 cannot view Customer 1's invoice payments (404)");

    // Payments list: Customer role is blocked from /payments endpoint -> 403
    const payListCust = await req(serverUrl, 'GET', '/api/payments', tokenCust1);
    if (payListCust.status !== 403) throw new Error('Customer should get 403 on GET /payments');
    console.log('PASS: Customer cannot access global payments list (403)');

    console.log('\n=== All Phase 3 Tests Passed Successfully! ===\n');
  } finally {
    server.close();
    await db.pool.end();
  }
}

runTests().catch(console.error);
