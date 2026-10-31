const db = require('../src/config/db');

async function test() {
  const explain = async (name, q, p = []) => {
    const res = await db.query('EXPLAIN (ANALYZE, BUFFERS) ' + q, p);
    const timeRow = res.rows.find(r => r['QUERY PLAN'].includes('Execution Time'));
    console.log(name, timeRow ? timeRow['QUERY PLAN'] : '');
  };

  await explain('Report Summary', `
    SELECT
      (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'ACTIVE') AS active_subscriptions,
      (SELECT COALESCE(SUM(amount), 0)::numeric(12,2)
       FROM payments
       WHERE ($1::date IS NULL OR payment_date >= $1)
         AND ($2::date IS NULL OR payment_date <= $2)
      ) AS revenue_received,
      COALESCE(SUM(total - amount_paid) FILTER (
        WHERE status = 'CONFIRMED'
          AND ($1::date IS NULL OR invoice_date >= $1)
          AND ($2::date IS NULL OR invoice_date <= $2)
      ), 0)::numeric(12,2) AS outstanding_amount,
      COALESCE(COUNT(*) FILTER (
        WHERE status = 'CONFIRMED' AND due_date < CURRENT_DATE
      ), 0)::int AS overdue_count,
      COALESCE(SUM(total - amount_paid) FILTER (
        WHERE status = 'CONFIRMED' AND due_date < CURRENT_DATE
      ), 0)::numeric(12,2) AS overdue_amount
    FROM invoices
  `, ['2025-01-01', '2026-12-31']);

  await explain('Report Overdue Count', `SELECT COUNT(*) AS total FROM invoices i WHERE i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE`);
  
  await explain('Report Overdue List', `
    SELECT i.id, i.number, i.customer_id, u.name AS customer_name, u.email AS customer_email,
           i.subscription_id, i.status, i.invoice_date, i.due_date,
           (CURRENT_DATE - i.due_date)::int AS days_overdue, i.total, i.amount_paid,
           (i.total - i.amount_paid)::numeric(12,2) AS balance
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
    WHERE i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE
    ORDER BY i.due_date ASC, i.id ASC
    LIMIT 20 OFFSET 0
  `);

  await explain('Report Revenue', `
    WITH months AS (
      SELECT to_char(date_trunc('month', d), 'YYYY-MM') AS month,
             date_trunc('month', d)::date AS month_start,
             (date_trunc('month', d) + interval '1 month - 1 day')::date AS month_end
      FROM generate_series(
        date_trunc('month', COALESCE($1::date, CURRENT_DATE - interval '11 months')),
        date_trunc('month', COALESCE($2::date, CURRENT_DATE)),
        '1 month'::interval
      ) AS d
    )
    SELECT m.month, COALESCE(SUM(p.amount), 0)::numeric(12,2) AS revenue
    FROM months m
    LEFT JOIN payments p ON p.payment_date >= m.month_start AND p.payment_date <= m.month_end
    GROUP BY m.month
    ORDER BY m.month ASC
  `, [null, null]);

  await db.pool.end();
}

test().catch(console.error);

