const bcrypt = require('bcrypt');
const db = require('../src/config/db');

async function seedLarge() {
  const startTime = Date.now();
  console.log('[Seed-Large] Starting fast set-based large dataset seed...');

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Password hash computed ONCE and reused
    console.log('[Seed-Large] Hashing customer password once...');
    const saltRounds = 10;
    const customerPasswordHash = await bcrypt.hash('Customer@1234', saltRounds);

    // 2. Add 300 customers (set-based via generate_series)
    console.log('[Seed-Large] Inserting 300 customers...');
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, company, phone, address, is_active, created_at, updated_at)
       SELECT
         'Customer ' || gs AS name,
         'customer_' || gs || '@seedtest.com' AS email,
         $1 AS password_hash,
         'CUSTOMER' AS role,
         'Company ' || gs AS company,
         '+1-555-' || lpad(gs::text, 4, '0') AS phone,
         gs || ' Tech Blvd, Suite ' || (gs % 50 + 1) AS address,
         TRUE AS is_active,
         NOW() - ((gs % 365) || ' days')::interval AS created_at,
         NOW() AS updated_at
       FROM generate_series(1, 300) AS gs`,
      [customerPasswordHash]
    );

    // 3. Insert 5,000 subscriptions with realistic spread of statuses (about 60% ACTIVE)
    // Status distribution: 60% ACTIVE, 15% DRAFT, 10% QUOTATION, 10% CONFIRMED, 5% CLOSED
    // Subscriptions will initially have total=0, then we will calculate and update from subscription_lines!
    console.log('[Seed-Large] Inserting 5,000 subscriptions...');
    await client.query(`
      WITH customer_pool AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM users WHERE role = 'CUSTOMER'
      ),
      sub_gen AS (
        SELECT
          gs AS num,
          'SUB-' || CASE WHEN gs < 10000 THEN lpad(gs::text, 4, '0') ELSE gs::text END AS number,
          cp.id AS customer_id,
          CASE WHEN (gs % 5 = 0) THEN 2 ELSE 1 END AS plan_id,
          CASE
            WHEN (gs % 100) < 60 THEN 'ACTIVE'
            WHEN (gs % 100) < 75 THEN 'DRAFT'
            WHEN (gs % 100) < 85 THEN 'QUOTATION'
            WHEN (gs % 100) < 95 THEN 'CONFIRMED'
            ELSE 'CLOSED'
          END AS status,
          (CURRENT_DATE - ((gs % 180) + 30 || ' days')::interval)::DATE AS start_date,
          (CURRENT_DATE - ((gs % 180) + 30 || ' days')::interval)::DATE + interval '1 year' AS expiry_date,
          (CURRENT_DATE + ((gs % 30) || ' days')::interval)::DATE AS next_billing_date,
          15 AS payment_terms_days
        FROM generate_series(1, 5000) AS gs
        JOIN customer_pool cp ON cp.rn = ((gs - 1) % 300) + 1
      )
      INSERT INTO subscriptions (
        number, customer_id, plan_id, status, is_paused,
        start_date, expiry_date, next_billing_date, payment_terms_days,
        subtotal, tax_total, total, created_at, updated_at
      )
      SELECT
        number,
        customer_id,
        plan_id,
        status,
        FALSE AS is_paused,
        start_date,
        expiry_date,
        CASE WHEN status = 'ACTIVE' THEN next_billing_date ELSE NULL END AS next_billing_date,
        payment_terms_days,
        0, 0, 0,
        NOW() - ((num % 180) || ' days')::interval AS created_at,
        NOW() AS updated_at
      FROM sub_gen;
    `);

    // 4. Insert 1-3 lines per subscription
    console.log('[Seed-Large] Inserting subscription lines (1-3 lines each)...');
    await client.query(`
      WITH sub_rows AS (
        SELECT id, plan_id FROM subscriptions
      ),
      lines_to_add AS (
        SELECT
          s.id AS subscription_id,
          line_num,
          (( (s.id + line_num) % 3 ) + 1) AS product_id,
          CASE WHEN (s.id + line_num) % 2 = 0 THEN (( (s.id + line_num) % 3 ) + 1) ELSE NULL END AS variant_id,
          (( (s.id * 3 + line_num) % 3 ) + 1) AS quantity
        FROM sub_rows s
        CROSS JOIN LATERAL generate_series(1, ((s.id % 3) + 1)) AS line_num
      )
      INSERT INTO subscription_lines (
        subscription_id, product_id, variant_id, description,
        quantity, unit_price, tax_id, tax_rate, tax_amount, amount
      )
      SELECT
        l.subscription_id,
        l.product_id,
        l.variant_id,
        p.name || COALESCE(' - ' || pv.attribute || ' ' || pv.value, '') AS description,
        l.quantity,
        (p.sales_price + COALESCE(pv.extra_price, 0)) AS unit_price,
        p.tax_id,
        COALESCE(t.rate_percent, 0) AS tax_rate,
        ROUND((l.quantity * (p.sales_price + COALESCE(pv.extra_price, 0)) * COALESCE(t.rate_percent, 0) / 100.0), 2) AS tax_amount,
        ROUND((l.quantity * (p.sales_price + COALESCE(pv.extra_price, 0))), 2) AS amount
      FROM lines_to_add l
      JOIN products p ON p.id = l.product_id
      LEFT JOIN product_variants pv ON pv.id = l.variant_id
      LEFT JOIN taxes t ON t.id = p.tax_id;
    `);

    // 5. Update subscriptions subtotal, tax_total, total from lines
    console.log('[Seed-Large] Updating subscription totals consistent with lines...');
    await client.query(`
      WITH line_sums AS (
        SELECT
          subscription_id,
          SUM(amount) AS subtotal,
          SUM(tax_amount) AS tax_total,
          SUM(amount + tax_amount) AS total
        FROM subscription_lines
        GROUP BY subscription_id
      )
      UPDATE subscriptions s
      SET
        subtotal = ls.subtotal,
        tax_total = ls.tax_total,
        total = ls.total,
        updated_at = NOW()
      FROM line_sums ls
      WHERE s.id = ls.subscription_id;
    `);

    // 6. Insert 10,000 invoices (exactly two periods per subscription so uq_invoice_sub_period holds)
    // 5,000 subscriptions x 2 periods = 10,000 invoices
    // Period 1: start_date to start_date + 30 days
    // Period 2: start_date + 31 days to start_date + 61 days
    // Mixed DRAFT / CONFIRMED / PAID / CANCELLED:
    // 50% PAID, 30% CONFIRMED, 10% DRAFT, 10% CANCELLED
    // due_dates spread so many are overdue (< CURRENT_DATE)
    // amount_paid = total for PAID, 0 for DRAFT/CANCELLED, some 0 or partial for CONFIRMED
    console.log('[Seed-Large] Inserting 10,000 invoices...');
    await client.query(`
      WITH sub_data AS (
        SELECT id, customer_id, start_date, subtotal, tax_total, total, payment_terms_days
        FROM subscriptions
      ),
      inv_base AS (
        SELECT
          s.id AS subscription_id,
          s.customer_id,
          p_num,
          'INV-' || CASE
            WHEN (ROW_NUMBER() OVER (ORDER BY s.id, p_num)) < 10000
            THEN lpad((ROW_NUMBER() OVER (ORDER BY s.id, p_num))::text, 4, '0')
            ELSE (ROW_NUMBER() OVER (ORDER BY s.id, p_num))::text
          END AS number,
          CASE
            WHEN ((s.id * 2 + p_num) % 10) < 5 THEN 'PAID'
            WHEN ((s.id * 2 + p_num) % 10) < 8 THEN 'CONFIRMED'
            WHEN ((s.id * 2 + p_num) % 10) = 8 THEN 'DRAFT'
            ELSE 'CANCELLED'
          END AS status,
          (s.start_date + ((p_num - 1) * 31 || ' days')::interval)::DATE AS period_start,
          (s.start_date + ((p_num - 1) * 31 + 30 || ' days')::interval)::DATE AS period_end,
          (s.start_date + ((p_num - 1) * 31 || ' days')::interval)::DATE AS invoice_date,
          -- due_date: spread over past and future (some 40 days ago, some 10 days ago, some in future)
          -- For overdue: status CONFIRMED and due_date < CURRENT_DATE
          CASE
            WHEN p_num = 1 THEN (CURRENT_DATE - (( (s.id % 60) + 1 ) || ' days')::interval)::DATE
            ELSE (CURRENT_DATE + (( (s.id % 30) - 15 ) || ' days')::interval)::DATE
          END AS due_date,
          s.subtotal,
          0 AS discount_total,
          s.tax_total,
          s.total
        FROM sub_data s
        CROSS JOIN (VALUES (1), (2)) AS periods(p_num)
      )
      INSERT INTO invoices (
        number, subscription_id, customer_id, status,
        invoice_date, due_date, period_start, period_end,
        subtotal, discount_total, tax_total, total,
        amount_paid, sent_at, created_at, updated_at
      )
      SELECT
        number,
        subscription_id,
        customer_id,
        status,
        invoice_date,
        due_date,
        period_start,
        period_end,
        subtotal,
        discount_total,
        tax_total,
        total,
        CASE
          WHEN status = 'PAID' THEN total
          ELSE 0
        END AS amount_paid,
        CASE WHEN status <> 'DRAFT' THEN invoice_date::timestamp ELSE NULL END AS sent_at,
        invoice_date::timestamp AS created_at,
        NOW() AS updated_at
      FROM inv_base;
    `);

    // 7. Insert invoice lines copying from subscription_lines
    console.log('[Seed-Large] Inserting invoice lines from subscription lines...');
    await client.query(`
      INSERT INTO invoice_lines (
        invoice_id, product_id, variant_id, description,
        quantity, unit_price, tax_id, tax_rate, tax_amount, amount
      )
      SELECT
        i.id AS invoice_id,
        sl.product_id,
        sl.variant_id,
        sl.description,
        sl.quantity,
        sl.unit_price,
        sl.tax_id,
        sl.tax_rate,
        sl.tax_amount,
        sl.amount
      FROM invoices i
      JOIN subscription_lines sl ON sl.subscription_id = i.subscription_id;
    `);

    // 8. Matching payments for paid invoices over the last 12 months
    console.log('[Seed-Large] Inserting matching payments for PAID invoices...');
    await client.query(`
      INSERT INTO payments (
        invoice_id, method, amount, payment_date, note, recorded_by, created_at
      )
      SELECT
        i.id AS invoice_id,
        CASE (i.id % 6)
          WHEN 0 THEN 'CARD'
          WHEN 1 THEN 'UPI'
          WHEN 2 THEN 'BANK_TRANSFER'
          WHEN 3 THEN 'CASH'
          WHEN 4 THEN 'ONLINE'
          ELSE 'CHEQUE'
        END AS method,
        i.total AS amount,
        (CURRENT_DATE - ((i.id % 350) || ' days')::interval)::DATE AS payment_date,
        'Full payment for ' || i.number AS note,
        1 AS recorded_by,
        (CURRENT_DATE - ((i.id % 350) || ' days')::interval)::timestamptz AS created_at
      FROM invoices i
      WHERE i.status = 'PAID' AND i.total > 0;
    `);

    // 9. Advance sequence counters past the highest used
    console.log('[Seed-Large] Advancing number sequences past highest used...');
    await client.query(`
      SELECT setval('subscription_number_seq', (
        SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^SUB-', ''), '')::bigint), 1) + 1
        FROM subscriptions
      ));
    `);

    await client.query(`
      SELECT setval('invoice_number_seq', (
        SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^INV-', ''), '')::bigint), 1) + 1
        FROM invoices
      ));
    `);

    await client.query('COMMIT');

    // 10. Finish with ANALYZE on all tables
    console.log('[Seed-Large] Running ANALYZE on all tables...');
    await client.query(`
      ANALYZE users;
      ANALYZE taxes;
      ANALYZE products;
      ANALYZE product_variants;
      ANALYZE plans;
      ANALYZE quotation_templates;
      ANALYZE quotation_template_lines;
      ANALYZE discounts;
      ANALYZE discount_products;
      ANALYZE subscriptions;
      ANALYZE subscription_lines;
      ANALYZE invoices;
      ANALYZE invoice_lines;
      ANALYZE discount_usages;
      ANALYZE payments;
    `);

    // 11. Print counts and elapsed time
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const subCount = await client.query('SELECT COUNT(*) FROM subscriptions');
    const subActiveCount = await client.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE'");
    const invCount = await client.query('SELECT COUNT(*) FROM invoices');
    const payCount = await client.query('SELECT COUNT(*) FROM payments');
    const invLineCount = await client.query('SELECT COUNT(*) FROM invoice_lines');
    const subLineCount = await client.query('SELECT COUNT(*) FROM subscription_lines');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n              =====');
    console.log(`   SEED-LARGE COMPLETED IN ${elapsed} SECONDS`);
    console.log('              =====');
    console.log(`Users:               ${userCount.rows[0].count} (Customers added: 300)`);
    console.log(`Subscriptions:       ${subCount.rows[0].count} (Active: ${subActiveCount.rows[0].count} ~${((subActiveCount.rows[0].count / subCount.rows[0].count) * 100).toFixed(1)}%)`);
    console.log(`Subscription Lines:  ${subLineCount.rows[0].count}`);
    console.log(`Invoices:            ${invCount.rows[0].count}`);
    console.log(`Invoice Lines:       ${invLineCount.rows[0].count}`);
    console.log(`Payments:            ${payCount.rows[0].count}`);
    console.log('              =====\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed-Large] Error during seed-large:', error);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seedLarge();
