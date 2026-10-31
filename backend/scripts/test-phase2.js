const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const db = require('../src/config/db');
const { generateDue, generateForSubscription, getInvoiceById, confirmInvoice, cancelInvoice, sendInvoice, listInvoices } = require('../src/modules/invoices/invoices.service');
const { recordPayment, listPayments, listInvoicePayments } = require('../src/modules/payments/payments.service');
const { createDiscount } = require('../src/modules/discounts/discounts.service');
const { renderInvoicePrintHtml } = require('../src/modules/invoices/invoices.print');
const { todayDate } = require('../src/utils/dates');

async function testPhase2() {
  console.log('=== Starting Phase 2 Comprehensive Test Suite ===\n');

  const today = todayDate();
  console.log('Current system date:', today);

  const client = await db.getClient();
  try {
    // Clean up previous test subscriptions & invoices
    await client.query("DELETE FROM payments WHERE note = 'TEST_PAYMENT'");
    await client.query("DELETE FROM discount_usages WHERE discount_id IN (SELECT id FROM discounts WHERE name LIKE 'TEST_%')");
    await client.query("DELETE FROM discounts WHERE name LIKE 'TEST_%'");
    await client.query("DELETE FROM invoices WHERE subscription_id IN (SELECT id FROM subscriptions WHERE number LIKE 'SUB-P2-%')");
    await client.query("DELETE FROM subscription_lines WHERE subscription_id IN (SELECT id FROM subscriptions WHERE number LIKE 'SUB-P2-%')");
    await client.query("DELETE FROM subscriptions WHERE number LIKE 'SUB-P2-%'");

    console.log('1. Setting up test subscription and discount...');

    // Create a test discount from BE1
    const discountRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, used_count, scope, is_active)
      VALUES ('TEST_P2_DISCOUNT', 'PERCENT', 10, 0, 0, '2026-01-01', '2026-12-31', 5, 0, 'SUBSCRIPTION', true)
      RETURNING *
    `);
    const testDiscount = discountRes.rows[0];

    // Find product and tax
    const prodRes = await client.query('SELECT * FROM products LIMIT 1');
    const prod = prodRes.rows[0];

    const planRes = await client.query("SELECT * FROM plans WHERE status = 'ACTIVE' LIMIT 1");
    const plan = planRes.rows[0];

    const customerRes = await client.query("SELECT * FROM users WHERE role = 'CUSTOMER' LIMIT 2");
    const customer = customerRes.rows[0];
    const customer2 = customerRes.rows[1];

    // Create active subscription with next_billing_date = today
    const subRes = await client.query(`
      INSERT INTO subscriptions (
        number, customer_id, plan_id, status, is_paused,
        start_date, next_billing_date, payment_terms_days, subtotal, tax_total, total
      ) VALUES (
        'SUB-P2-001', $1, $2, 'ACTIVE', false,
        $3, $3, 15, 200, 20, 220
      ) RETURNING id
    `, [customer.id, plan.id, today]);
    const subId = subRes.rows[0].id;

    // Insert lines
    await client.query(`
      INSERT INTO subscription_lines (
        subscription_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, amount
      ) VALUES (
        $1, $2, 'Test Product', 2, 100, 10, 20, 200
      )
    `, [subId, prod.id]);

    client.release();

    console.log('2. Testing generateDue (first run)...');
    const run1 = await generateDue();
    console.log('Run 1 result:', run1);
    if (run1.created !== 1) throw new Error(`Expected 1 invoice created in Run 1, got ${run1.created}`);

    console.log('3. Testing generateDue (second run immediately after)...');
    const run2 = await generateDue();
    console.log('Run 2 result:', run2);
    if (run2.created !== 0) throw new Error(`Expected 0 invoices created in Run 2, got ${run2.created}`);
    console.log('PASS: Double run creates 0 duplicates');

    const checkSub = await db.query('SELECT next_billing_date FROM subscriptions WHERE id = $1', [subId]);
    console.log('Advanced next_billing_date:', checkSub.rows[0].next_billing_date);

    // Let's find the generated invoice
    const invListRes = await db.query('SELECT * FROM invoices WHERE subscription_id = $1', [subId]);
    if (invListRes.rows.length !== 1) throw new Error(`Expected 1 invoice, found ${invListRes.rows.length}`);
    const inv = invListRes.rows[0];
    console.log('Generated invoice:', { id: inv.id, number: inv.number, status: inv.status, total: inv.total, subtotal: inv.subtotal, discount_total: inv.discount_total, tax_total: inv.tax_total });

    // Verify discount applied
    const invFull = await getInvoiceById(inv.id, { id: customer.id, role: 'CUSTOMER' });
    console.log('Invoice discounts applied:', invFull.discounts);
    if (invFull.discounts.length === 0) throw new Error('Expected discount to be applied');
    if (Number(invFull.discount_total) !== 20) throw new Error(`Expected discount total 20, got ${invFull.discount_total}`);
    if (Number(invFull.total) !== 200) throw new Error(`Expected total (200 - 20 + 20) = 200, got ${invFull.total}`);

    // Verify discount used_count incremented to 1
    const discCheck = await db.query('SELECT used_count FROM discounts WHERE id = $1', [testDiscount.id]);
    if (discCheck.rows[0].used_count !== 1) throw new Error(`Expected discount used_count 1, got ${discCheck.rows[0].used_count}`);
    console.log('PASS: Discount usage recorded and used_count incremented to 1');

    // Test print HTML
    const printHtml = renderInvoicePrintHtml(invFull);
    if (!printHtml.includes(inv.number) || !printHtml.includes('Brightloop')) {
      throw new Error('Print HTML missing expected elements');
    }
    console.log('PASS: Print HTML rendered properly');

    // Customer scoping test: customer2 cannot access customer1's invoice
    let customer2Blocked = false;
    try {
      await getInvoiceById(inv.id, { id: customer2.id, role: 'CUSTOMER' });
    } catch (e) {
      if (e.statusCode === 404) customer2Blocked = true;
    }
    if (!customer2Blocked) throw new Error('Customer 2 should have received 404 for Customer 1 invoice');
    console.log("PASS: Customer 2 cannot access Customer 1's invoice (404)");

    // Test confirm invoice
    console.log('4. Testing invoice confirmation...');
    const confirmed = await confirmInvoice(inv.id);
    console.log('Confirmed status:', confirmed.status);

    // Test double confirmation should 409
    let doubleConfirmBlocked = false;
    try {
      await confirmInvoice(inv.id);
    } catch (e) {
      if (e.statusCode === 409) doubleConfirmBlocked = true;
    }
    if (!doubleConfirmBlocked) throw new Error('Double confirm should throw 409');
    console.log('PASS: Double confirm rejected with 409');

    // Test payment recording
    console.log('5. Testing payment recording...');
    // Overpayment test
    let overpaymentBlocked = false;
    try {
      await recordPayment({
        invoice_id: inv.id,
        method: 'CARD',
        amount: 250, // total is 200
        payment_date: today,
        note: 'TEST_PAYMENT',
      }, 1);
    } catch (e) {
      if (e.statusCode === 400 && e.message.includes('exceeds')) {
        overpaymentBlocked = true;
      }
    }
    if (!overpaymentBlocked) throw new Error('Overpayment should have returned 400');
    console.log('PASS: Overpayment returned 400');

    // Partial payment
    const partialPay = await recordPayment({
      invoice_id: inv.id,
      method: 'CARD',
      amount: 100,
      payment_date: today,
      note: 'TEST_PAYMENT',
    }, 1);
    console.log('Partial payment result:', partialPay.invoice);
    if (partialPay.invoice.status !== 'CONFIRMED' || partialPay.invoice.balance !== 100) {
      throw new Error('Partial payment failed status or balance check');
    }
    console.log('PASS: Partial payment keeps CONFIRMED status and updates balance');

    // Cancel with payment must fail with 409
    let cancelWithPayBlocked = false;
    try {
      await cancelInvoice(inv.id);
    } catch (e) {
      if (e.statusCode === 409) cancelWithPayBlocked = true;
    }
    if (!cancelWithPayBlocked) throw new Error('Cancel invoice with payments must fail with 409');
    console.log('PASS: Cancel invoice with payment refused with 409');

    // Remaining payment -> status PAID
    const fullPay = await recordPayment({
      invoice_id: inv.id,
      method: 'CARD',
      amount: 100,
      payment_date: today,
      note: 'TEST_PAYMENT',
    }, 1);
    console.log('Full payment result:', fullPay.invoice);
    if (fullPay.invoice.status !== 'PAID' || fullPay.invoice.balance !== 0) {
      throw new Error('Full payment failed status or balance check');
    }
    console.log('PASS: Full payment flipped invoice to PAID with balance 0');

    // Check payment list & invoice payments list
    const invPays = await listInvoicePayments(inv.id, { id: customer.id, role: 'CUSTOMER' });
    if (invPays.length !== 2) throw new Error('Expected 2 payments for invoice');
    console.log('PASS: listInvoicePayments returned 2 payments');

    // Cleanup
    await db.query('DELETE FROM payments WHERE invoice_id = $1', [inv.id]);
    await db.query('DELETE FROM discount_usages WHERE invoice_id = $1', [inv.id]);
    await db.query('DELETE FROM invoice_lines WHERE invoice_id = $1', [inv.id]);
    await db.query('DELETE FROM invoices WHERE id = $1', [inv.id]);
    await db.query('DELETE FROM subscription_lines WHERE subscription_id = $1', [subId]);
    await db.query('DELETE FROM subscriptions WHERE id = $1', [subId]);
    await db.query('DELETE FROM discounts WHERE id = $1', [testDiscount.id]);

    console.log('\n=== All Phase 2 Invoices & Payments Tests Passed! ===\n');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    throw err;
  } finally {
    await db.pool.end();
  }
}

testPhase2();
