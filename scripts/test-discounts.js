const path = require('path');
// Support running from repo root or backend folder
require(path.resolve(__dirname, '../backend/node_modules/dotenv')).config({ path: path.resolve(__dirname, '../backend/.env') });

const db = require(path.resolve(__dirname, '../backend/src/config/db'));
const {
  getApplicableDiscounts,
  markDiscountUsed,
  createDiscount,
} = require(path.resolve(__dirname, '../backend/src/modules/discounts/discounts.service'));

async function runTests() {
  console.log('=== Starting Discounts Test Suite ===\n');
  const client = await db.getClient();

  try {
    // We run tests inside a transaction that we can roll back or clean up
    await client.query('BEGIN');

    // Clean up test discounts before starting
    await client.query("DELETE FROM discounts WHERE name LIKE 'TEST_%'");

    // 1. Create test discounts
    console.log('1. Setting up test discounts...');
    
    // (a) Valid discount (scope SUBSCRIPTION)
    const validSubRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, scope, is_active)
      VALUES ('TEST_VALID_SUB', 'PERCENT', 10, 500, 2, '2026-01-01', '2026-12-31', 10, 'SUBSCRIPTION', true)
      RETURNING *
    `);
    const validSub = validSubRes.rows[0];

    // (b) Expired discount
    const expiredRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, scope, is_active)
      VALUES ('TEST_EXPIRED', 'PERCENT', 10, 0, 0, '2025-01-01', '2025-12-31', 10, 'SUBSCRIPTION', true)
      RETURNING *
    `);
    const expired = expiredRes.rows[0];

    // (c) Not-yet-started discount
    const futureRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, scope, is_active)
      VALUES ('TEST_FUTURE', 'PERCENT', 10, 0, 0, '2027-01-01', '2027-12-31', 10, 'SUBSCRIPTION', true)
      RETURNING *
    `);
    const future = futureRes.rows[0];

    // (d) Exhausted discount (usage_limit = 1, used_count = 1)
    const exhaustedRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, used_count, scope, is_active)
      VALUES ('TEST_EXHAUSTED', 'PERCENT', 10, 0, 0, '2026-01-01', '2026-12-31', 1, 1, 'SUBSCRIPTION', true)
      RETURNING *
    `);
    const exhausted = exhaustedRes.rows[0];

    // (e) Below minimum purchase discount (min_purchase = 2000)
    const highMinRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, scope, is_active)
      VALUES ('TEST_HIGH_MIN', 'FIXED', 50, 2000, 1, '2026-01-01', '2026-12-31', 10, 'SUBSCRIPTION', true)
      RETURNING *
    `);
    const highMin = highMinRes.rows[0];

    // (f) PRODUCTS scope discount on product 1
    const prodDiscRes = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, scope, is_active)
      VALUES ('TEST_PROD_1', 'PERCENT', 15, 100, 1, '2026-01-01', '2026-12-31', 10, 'PRODUCTS', true)
      RETURNING *
    `);
    const prodDisc = prodDiscRes.rows[0];
    await client.query('INSERT INTO discount_products (discount_id, product_id) VALUES ($1, 1)', [prodDisc.id]);

    // (g) PRODUCTS scope discount on product 3 (which subscription lines might not match)
    const prodDisc3Res = await client.query(`
      INSERT INTO discounts (name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, scope, is_active)
      VALUES ('TEST_PROD_3', 'PERCENT', 20, 100, 1, '2026-01-01', '2026-12-31', 10, 'PRODUCTS', true)
      RETURNING *
    `);
    const prodDisc3 = prodDisc3Res.rows[0];
    await client.query('INSERT INTO discount_products (discount_id, product_id) VALUES ($1, 3)', [prodDisc3.id]);

    console.log('Test discounts prepared successfully.\n');

    // 2. Test getApplicableDiscounts
    console.log('2. Testing getApplicableDiscounts...');

    const testSubscription = {
      id: 9999,
      customer_id: 1,
      subtotal: 1000,
      lines: [
        { product_id: 1, quantity: 2, amount: 600 },
        { product_id: 2, quantity: 1, amount: 400 },
      ],
    };

    const targetDate = '2026-06-15';
    const applicable = await getApplicableDiscounts(testSubscription, targetDate, client);

    const applicableNames = applicable.map((d) => d.name);
    console.log('Applicable discount names found:', applicableNames);

    // Assertions
    const assert = (condition, msg) => {
      if (!condition) {
        throw new Error(`FAIL: ${msg}`);
      }
      console.log(`PASS: ${msg}`);
    };

    assert(applicableNames.includes('TEST_VALID_SUB'), 'Valid discount is included');
    assert(!applicableNames.includes('TEST_EXPIRED'), 'Expired discount is excluded');
    assert(!applicableNames.includes('TEST_FUTURE'), 'Not-yet-started discount is excluded');
    assert(!applicableNames.includes('TEST_EXHAUSTED'), 'Exhausted discount is excluded');
    assert(!applicableNames.includes('TEST_HIGH_MIN'), 'Below minimum purchase discount is excluded (min 2000 > 1000)');
    assert(applicableNames.includes('TEST_PROD_1'), 'PRODUCTS scope discount WITH matching product line (prod 1) is included');
    assert(!applicableNames.includes('TEST_PROD_3'), 'PRODUCTS scope discount WITHOUT matching product line (prod 3) is excluded');

    // Check discount properties
    const validProdMatch = applicable.find((d) => d.name === 'TEST_PROD_1');
    assert(Array.isArray(validProdMatch.product_ids) && validProdMatch.product_ids.includes(1), 'Discount response includes product_ids[]');

    // 3. Test markDiscountUsed
    console.log('\n3. Testing markDiscountUsed...');
    
    // First, let's create a dummy invoice to link or use invoice_id
    // We can check if invoices exist or insert a test invoice
    const invRes = await client.query(`
      SELECT id FROM invoices LIMIT 1
    `);
    let invoiceId;
    if (invRes.rows.length > 0) {
      invoiceId = invRes.rows[0].id;
    } else {
      // Create a test subscription and invoice for FK satisfaction
      const subRes = await client.query(`
        INSERT INTO subscriptions (number, customer_id, plan_id, status, start_date, payment_terms_days)
        VALUES ('SUB-TEST-99', 1, 1, 'ACTIVE', '2026-01-01', 15)
        RETURNING id
      `);
      const testSubId = subRes.rows[0].id;

      const dummyInv = await client.query(`
        INSERT INTO invoices (number, subscription_id, customer_id, status, invoice_date, due_date, period_start, period_end)
        VALUES ('INV-TEST-99', $1, 1, 'DRAFT', '2026-06-01', '2026-06-15', '2026-06-01', '2026-06-30')
        RETURNING id
      `, [testSubId]);
      invoiceId = dummyInv.rows[0].id;
    }

    // Mark discount used
    const markRes = await markDiscountUsed(validSub.id, invoiceId, 50.00, client);
    assert(markRes.discountId === validSub.id, 'markDiscountUsed returned correct discountId');

    // Verify used_count incremented
    const checkDisc = await client.query('SELECT used_count FROM discounts WHERE id = $1', [validSub.id]);
    assert(checkDisc.rows[0].used_count === 1, 'used_count incremented to 1');

    // Verify discount_usages row inserted
    const checkUsage = await client.query('SELECT * FROM discount_usages WHERE discount_id = $1 AND invoice_id = $2', [validSub.id, invoiceId]);
    assert(checkUsage.rows.length === 1 && Number(checkUsage.rows[0].amount) === 50.00, 'discount_usages row inserted with correct amount');

    // Test markDiscountUsed on exhausted discount throws 409
    let threw409 = false;
    try {
      await markDiscountUsed(exhausted.id, invoiceId, 10.00, client);
    } catch (err) {
      if (err.statusCode === 409) {
        threw409 = true;
      }
    }
    assert(threw409, 'markDiscountUsed on exhausted discount threw 409 ApiError');

    console.log('\n=== All Tests Passed Successfully! ===');

    // Rollback test changes to leave DB clean
    await client.query('ROLLBACK');
    console.log('Transaction rolled back successfully. Database remains clean.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

runTests();
