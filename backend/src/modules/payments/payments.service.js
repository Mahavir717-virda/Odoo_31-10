const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { round2 } = require('../../utils/money');

/**
 * Record a payment for an invoice in ONE transaction
 * @param {object} data
 * @param {number} userId
 */
const recordPayment = async (data, userId) => {
  const { invoice_id, method, amount, payment_date, note } = data;
  const payAmount = round2(amount);

  return db.withTransaction(async (client) => {
    // 1. SELECT the invoice FOR UPDATE
    const invRes = await client.query(
      `SELECT * FROM invoices WHERE id = $1 FOR UPDATE`,
      [invoice_id]
    );

    if (invRes.rows.length === 0) {
      throw new ApiError(404, 'Invoice not found');
    }

    const invoice = invRes.rows[0];

    // Require status CONFIRMED (else 409 "Invoice must be confirmed")
    if (invoice.status !== 'CONFIRMED') {
      throw new ApiError(409, 'Invoice must be confirmed');
    }

    const currentPaid = round2(invoice.amount_paid);
    const invoiceTotal = round2(invoice.total);
    const newPaid = round2(currentPaid + payAmount);

    // If amount_paid + amount > total return 400 "Amount exceeds outstanding balance"
    if (newPaid > invoiceTotal) {
      throw new ApiError(400, 'Amount exceeds outstanding balance');
    }

    // Insert payment (recorded_by = req.user.id)
    const payRes = await client.query(
      `INSERT INTO payments (invoice_id, method, amount, payment_date, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [invoice_id, method, payAmount, payment_date, note, userId]
    );

    const payment = payRes.rows[0];

    // If amount_paid = total set status PAID
    const nextStatus = newPaid === invoiceTotal ? 'PAID' : invoice.status;

    const updateRes = await client.query(
      `UPDATE invoices
       SET amount_paid = $1, status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newPaid, nextStatus, invoice_id]
    );

    const updatedInvoice = updateRes.rows[0];
    const balance = round2(Number(updatedInvoice.total) - Number(updatedInvoice.amount_paid));

    return {
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
      invoice: {
        id: updatedInvoice.id,
        status: updatedInvoice.status,
        amount_paid: Number(updatedInvoice.amount_paid),
        total: Number(updatedInvoice.total),
        balance,
      },
    };
  });
};

/**
 * List payments with filters (method, from, to, search) and joins for invoice_number & customer_name
 */
const listPayments = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { method, from, to, search } = query;

  const conditions = [];
  const params = [];

  if (method) {
    params.push(method);
    conditions.push(`p.method = $${params.length}`);
  }

  if (from) {
    params.push(from);
    conditions.push(`p.payment_date >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    conditions.push(`p.payment_date <= $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const pIdx = params.length;
    conditions.push(`(i.number ILIKE $${pIdx} OR u.name ILIKE $${pIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) AS total
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN users u ON u.id = i.customer_id
     ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT p.*,
            i.number AS invoice_number,
            u.name AS customer_name,
            rec.name AS recorded_by_name
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN users u ON u.id = i.customer_id
     LEFT JOIN users rec ON rec.id = p.recorded_by
     ${whereClause}
     ORDER BY p.id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const payments = listRes.rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));

  const meta = buildMeta(page, limit, total);
  return { payments, meta };
};

/**
 * List payments for a specific invoice
 * Staff or the owning customer (404 otherwise)
 */
const listInvoicePayments = async (invoiceId, user) => {
  const invRes = await db.query(`SELECT id, customer_id FROM invoices WHERE id = $1`, [invoiceId]);

  if (invRes.rows.length === 0) {
    throw new ApiError(404, 'Invoice not found');
  }

  const invoice = invRes.rows[0];

  // If customer, ensure owning customer
  if (user && user.role === 'CUSTOMER' && Number(invoice.customer_id) !== Number(user.id)) {
    throw new ApiError(404, 'Invoice not found');
  }

  const payRes = await db.query(
    `SELECT p.*, rec.name AS recorded_by_name
     FROM payments p
     LEFT JOIN users rec ON rec.id = p.recorded_by
     WHERE p.invoice_id = $1
     ORDER BY p.id DESC`,
    [invoiceId]
  );

  return payRes.rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
};

module.exports = {
  recordPayment,
  listPayments,
  listInvoicePayments,
};

