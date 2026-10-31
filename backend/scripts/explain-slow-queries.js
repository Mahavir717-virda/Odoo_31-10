const db = require('../src/config/db');

async function runExplain(title, query, params) {
  console.log('======================================================================');
  console.log(title);
  console.log('======================================================================');
  const explainSql = 'EXPLAIN (ANALYZE, BUFFERS) ' + query;
  const res = await db.query(explainSql, params);
  res.rows.forEach(r => console.log(r['QUERY PLAN']));
  console.log('\n');
}

async function main() {
  // 1. Subscriptions list with search + status
  await runExplain(
    '1. Subscriptions list with search + status',
    `SELECT s.*, u.name AS customer_name, pl.name AS plan_name, pl.pausable AS plan_pausable, pl.closable AS plan_closable
     FROM subscriptions s
     JOIN users u ON s.customer_id = u.id
     JOIN plans pl ON s.plan_id = pl.id
     WHERE s.status = $1 AND (s.number ILIKE $2 OR u.name ILIKE $2)
     ORDER BY s.id DESC
     LIMIT 20 OFFSET 0`,
    ['ACTIVE', '%Customer 10%']
  );

  // 2. Invoices list with overdue + customer filter
  await runExplain(
    '2. Invoices list with overdue + customer filter',
    `SELECT i.*, u.name AS customer_name, u.email AS customer_email, s.number AS subscription_number
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     JOIN subscriptions s ON s.id = i.subscription_id
     WHERE i.customer_id = $1 AND i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE
     ORDER BY i.id DESC
     LIMIT 20 OFFSET 0`,
    [10]
  );

  // 3. Invoices search by customer name
  await runExplain(
    '3. Invoices search by customer name',
    `SELECT i.*, u.name AS customer_name, u.email AS customer_email, s.number AS subscription_number
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     JOIN subscriptions s ON s.id = i.subscription_id
     WHERE (i.number ILIKE $1 OR u.name ILIKE $1)
     ORDER BY i.id DESC
     LIMIT 20 OFFSET 0`,
    ['%Customer 10%']
  );

  // 4. Payments list with date range
  await runExplain(
    '4. Payments list with date range',
    `SELECT p.*, i.number AS invoice_number, u.name AS customer_name, rec.name AS recorded_by_name
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN users u ON u.id = i.customer_id
     LEFT JOIN users rec ON rec.id = p.recorded_by
     WHERE p.payment_date >= $1 AND p.payment_date <= $2
     ORDER BY p.id DESC
     LIMIT 20 OFFSET 0`,
    ['2026-01-01', '2026-06-30']
  );

  // 5. Users search
  await runExplain(
    '5. Users search',
    `SELECT id, name, email, role, phone, company, address, is_active, created_at, updated_at
     FROM users
     WHERE (name ILIKE $1 OR email ILIKE $1)
     ORDER BY id DESC
     LIMIT 20 OFFSET 0`,
    ['%Customer 10%']
  );

  // 6. Products search
  await runExplain(
    '6. Products search',
    `SELECT p.*, t.name AS tax_name, t.rate_percent AS tax_rate
     FROM products p
     LEFT JOIN taxes t ON p.tax_id = t.id
     WHERE (p.name ILIKE $1 OR p.notes ILIKE $1)
     ORDER BY p.id DESC
     LIMIT 20 OFFSET 0`,
    ['%CRM%']
  );
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

