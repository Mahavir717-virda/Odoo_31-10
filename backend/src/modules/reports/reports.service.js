const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

/**
 * GET /reports/summary?from=&to=
 * - active_subscriptions = COUNT where status ACTIVE (not date filtered)
 * - revenue_received = SUM(payments.amount) with payment_date in range
 * - outstanding_amount = SUM(total - amount_paid) over CONFIRMED invoices (invoice_date in range if given)
 * - overdue_count and overdue_amount = CONFIRMED with due_date < CURRENT_DATE
 * Compute everything in one or two queries (FILTER clauses), COALESCE to 0.
 */
const getSummary = async ({ from = null, to = null }) => {
  const query = `
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
  `;

  const res = await db.query(query, [from || null, to || null]);
  const row = res.rows[0];

  return {
    active_subscriptions: parseInt(row.active_subscriptions || 0, 10),
    revenue_received: parseFloat(row.revenue_received || 0),
    outstanding_amount: parseFloat(row.outstanding_amount || 0),
    overdue_count: parseInt(row.overdue_count || 0, 10),
    overdue_amount: parseFloat(row.overdue_amount || 0),
  };
};

/**
 * GET /reports/overdue
 * - Paginated, ordered by due_date ASC
 * - With customer_name, days_overdue = CURRENT_DATE - due_date, balance = total - amount_paid
 * - meta.total from a COUNT query
 */
const getOverdue = async (query) => {
  const { page, limit, offset } = parsePagination(query);

  const whereClause = `WHERE i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE`;

  const countRes = await db.query(
    `SELECT COUNT(*) AS total
     FROM invoices i
     ${whereClause}`
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const listRes = await db.query(
    `SELECT i.id,
            i.number,
            i.customer_id,
            u.name AS customer_name,
            u.email AS customer_email,
            i.subscription_id,
            i.status,
            i.invoice_date,
            i.due_date,
            (CURRENT_DATE - i.due_date)::int AS days_overdue,
            i.total,
            i.amount_paid,
            (i.total - i.amount_paid)::numeric(12,2) AS balance
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     ${whereClause}
     ORDER BY i.due_date ASC, i.id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const overdueInvoices = listRes.rows.map((row) => ({
    ...row,
    days_overdue: parseInt(row.days_overdue, 10),
    total: parseFloat(row.total),
    amount_paid: parseFloat(row.amount_paid),
    balance: parseFloat(row.balance),
  }));

  const meta = buildMeta(page, limit, total);
  return { overdue: overdueInvoices, meta };
};

/**
 * GET /reports/revenue?from=&to=
 * - SUM of payments grouped by to_char(payment_date, 'YYYY-MM')
 * - Ordered ascending
 * - Zero-filled for months with no payments (generate_series)
 * - Default last 12 months
 */
const getRevenue = async ({ from = null, to = null }) => {
  const query = `
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
    SELECT
      m.month,
      COALESCE(SUM(p.amount), 0)::numeric(12,2) AS revenue
    FROM months m
    LEFT JOIN payments p ON p.payment_date >= m.month_start AND p.payment_date <= m.month_end
    GROUP BY m.month
    ORDER BY m.month ASC
  `;

  const res = await db.query(query, [from || null, to || null]);

  return res.rows.map((r) => ({
    month: r.month,
    revenue: parseFloat(r.revenue),
  }));
};

module.exports = {
  getSummary,
  getOverdue,
  getRevenue,
};

