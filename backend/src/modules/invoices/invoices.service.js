const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { computeInvoiceTotals, round2 } = require('../../utils/money');
const { nextInvoiceNumber } = require('../../utils/numbers');
const { addDays, addPeriod, todayDate } = require('../../utils/dates');
const { sendMail } = require('../../utils/mailer');
const env = require('../../config/env');
const { getApplicableDiscounts, markDiscountUsed } = require('../discounts/discounts.service');

/**
 * Generates an invoice for a single subscription within the caller's transaction
 * @param {number} subscriptionId
 * @param {import('pg').PoolClient} client
 */
const generateForSubscription = async (subscriptionId, client) => {
  if (!client) {
    throw new Error('A database client must be provided to generateForSubscription');
  }

  // 1. SELECT the subscription (+ plan billing_period) FOR UPDATE
  const subRes = await client.query(
    `SELECT s.*, p.billing_period
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.id = $1
     FOR UPDATE`,
    [subscriptionId]
  );

  if (subRes.rows.length === 0) {
    throw new ApiError(404, `Subscription ${subscriptionId} not found`);
  }

  const sub = subRes.rows[0];
  const today = todayDate();

  // If status != ACTIVE, is_paused, next_billing_date is null/in the future, or next_billing_date > expiry_date, return { skipped: true }
  if (
    sub.status !== 'ACTIVE' ||
    sub.is_paused ||
    !sub.next_billing_date ||
    sub.next_billing_date > today ||
    (sub.expiry_date && sub.next_billing_date > sub.expiry_date)
  ) {
    return { skipped: true };
  }

  // 2. Read its lines.
  const linesRes = await client.query(
    `SELECT * FROM subscription_lines WHERE subscription_id = $1 ORDER BY id ASC`,
    [sub.id]
  );
  const lines = linesRes.rows;

  const period_start = sub.next_billing_date;
  const nextPeriod = addPeriod(period_start, sub.billing_period);
  const period_end = addDays(nextPeriod, -1);
  const invoice_date = today;
  const due_date = addDays(invoice_date, sub.payment_terms_days || 0);

  // 3. Call getApplicableDiscounts and computeInvoiceTotals
  const applicableDiscounts = await getApplicableDiscounts(
    {
      id: sub.id,
      customer_id: sub.customer_id,
      subtotal: sub.subtotal,
      lines,
    },
    invoice_date,
    client
  );

  const totals = computeInvoiceTotals(lines, applicableDiscounts);
  const invoiceNum = await nextInvoiceNumber(client);

  // 4. INSERT the invoice with status DRAFT using exactly the partial index WHERE clause
  const insertRes = await client.query(
    `INSERT INTO invoices (
      number, subscription_id, customer_id, status,
      invoice_date, due_date, period_start, period_end,
      subtotal, discount_total, tax_total, total,
      amount_paid, notes
    ) VALUES (
      $1, $2, $3, 'DRAFT',
      $4, $5, $6, $7,
      $8, $9, $10, $11,
      0, $12
    )
    ON CONFLICT (subscription_id, period_start) WHERE status <> 'CANCELLED'
    DO NOTHING
    RETURNING id`,
    [
      invoiceNum,
      sub.id,
      sub.customer_id,
      invoice_date,
      due_date,
      period_start,
      period_end,
      totals.subtotal,
      totals.discount_total,
      totals.tax_total,
      totals.total,
      sub.notes,
    ]
  );

  // If no row is returned, an invoice already exists for this period:
  // skip creating but STILL advance next_billing_date so the subscription is not stuck.
  if (insertRes.rows.length === 0) {
    await client.query(
      `UPDATE subscriptions SET next_billing_date = $1, updated_at = NOW() WHERE id = $2`,
      [nextPeriod, sub.id]
    );
    return { skipped: true, reason: 'Invoice already exists for this period' };
  }

  const invoiceId = insertRes.rows[0].id;

  // 5. Insert invoice_lines and for each applied discount call markDiscountUsed
  for (const line of lines) {
    await client.query(
      `INSERT INTO invoice_lines (
        invoice_id, product_id, variant_id, description,
        quantity, unit_price, tax_id, tax_rate, tax_amount, amount
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10
      )`,
      [
        invoiceId,
        line.product_id,
        line.variant_id,
        line.description,
        line.quantity,
        line.unit_price,
        line.tax_id,
        line.tax_rate,
        line.tax_amount,
        line.amount,
      ]
    );
  }

  for (const applied of totals.appliedDiscounts) {
    await markDiscountUsed(applied.discount_id, invoiceId, applied.amount, client);
  }

  // 6. UPDATE subscriptions SET next_billing_date = addPeriod(next_billing_date, billing_period).
  await client.query(
    `UPDATE subscriptions SET next_billing_date = $1, updated_at = NOW() WHERE id = $2`,
    [nextPeriod, sub.id]
  );

  return { created: true, invoice_id: invoiceId };
};

/**
 * Generates due invoices for all eligible subscriptions
 */
const generateDue = async () => {
  const today = todayDate();

  // Select due subscription ids using idx_sub_due with FOR UPDATE SKIP LOCKED
  const dueRes = await db.query(
    `SELECT id
     FROM subscriptions
     WHERE status = 'ACTIVE'
       AND is_paused = FALSE
       AND next_billing_date <= $1
       AND (expiry_date IS NULL OR expiry_date >= next_billing_date)
     ORDER BY id ASC
     FOR UPDATE SKIP LOCKED`,
    [today]
  );

  const dueIds = dueRes.rows.map((r) => r.id);
  let created = 0;
  let skipped = 0;
  const errors = [];

  for (const subId of dueIds) {
    try {
      await db.withTransaction(async (client) => {
        const res = await generateForSubscription(subId, client);
        if (res.created) {
          created += 1;
        } else {
          skipped += 1;
        }
      });
    } catch (err) {
      errors.push({
        subscription_id: subId,
        message: err.message,
      });
    }
  }

  return { created, skipped, errors };
};

/**
 * List invoices with filters and pagination
 */
const listInvoices = async (query, user) => {
  const { page, limit, offset } = parsePagination(query);
  const { status, overdue, from, to, search } = query;

  const conditions = [];
  const params = [];

  // Forced customer scoping
  if (user && user.role === 'CUSTOMER') {
    params.push(user.id);
    conditions.push(`i.customer_id = $${params.length}`);
  } else if (query.customer_id) {
    params.push(query.customer_id);
    conditions.push(`i.customer_id = $${params.length}`);
  }

  if (query.subscription_id) {
    params.push(query.subscription_id);
    conditions.push(`i.subscription_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }

  if (overdue) {
    conditions.push(`i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE`);
  }

  if (from) {
    params.push(from);
    conditions.push(`i.invoice_date >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    conditions.push(`i.invoice_date <= $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const pIdx = params.length;
    conditions.push(`(i.number ILIKE $${pIdx} OR u.name ILIKE $${pIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) AS total
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     JOIN subscriptions s ON s.id = i.subscription_id
     ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT i.*,
            u.name AS customer_name,
            u.email AS customer_email,
            s.number AS subscription_number
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     JOIN subscriptions s ON s.id = i.subscription_id
     ${whereClause}
     ORDER BY i.id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const invoices = listRes.rows.map((row) => ({
    ...row,
    subtotal: Number(row.subtotal),
    discount_total: Number(row.discount_total),
    tax_total: Number(row.tax_total),
    total: Number(row.total),
    amount_paid: Number(row.amount_paid),
    balance: round2(Number(row.total) - Number(row.amount_paid)),
  }));

  const meta = buildMeta(page, limit, total);
  return { invoices, meta };
};

/**
 * Get full invoice by ID
 */
const getInvoiceById = async (id, user) => {
  const invRes = await db.query(
    `SELECT i.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.company AS customer_company,
            u.address AS customer_address,
            u.phone AS customer_phone,
            s.number AS subscription_number
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     JOIN subscriptions s ON s.id = i.subscription_id
     WHERE i.id = $1`,
    [id]
  );

  if (invRes.rows.length === 0) {
    throw new ApiError(404, 'Invoice not found');
  }

  const invoice = invRes.rows[0];

  // If customer role and invoice does not belong to them, 404
  if (user && user.role === 'CUSTOMER' && Number(invoice.customer_id) !== Number(user.id)) {
    throw new ApiError(404, 'Invoice not found');
  }

  // Get lines
  const linesRes = await db.query(
    `SELECT il.*, p.name AS product_name
     FROM invoice_lines il
     LEFT JOIN products p ON p.id = il.product_id
     WHERE il.invoice_id = $1
     ORDER BY il.id ASC`,
    [id]
  );

  // Get discounts breakdown
  const discRes = await db.query(
    `SELECT du.id, du.discount_id, du.amount, du.created_at,
            d.name AS discount_name, d.type AS discount_type, d.value AS discount_value, d.scope AS discount_scope
     FROM discount_usages du
     JOIN discounts d ON d.id = du.discount_id
     WHERE du.invoice_id = $1
     ORDER BY du.id ASC`,
    [id]
  );

  const subtotal = Number(invoice.subtotal);
  const discount_total = Number(invoice.discount_total);
  const tax_total = Number(invoice.tax_total);
  const total = Number(invoice.total);
  const amount_paid = Number(invoice.amount_paid);
  const balance = round2(total - amount_paid);

  return {
    ...invoice,
    subtotal,
    discount_total,
    tax_total,
    total,
    amount_paid,
    balance,
    lines: linesRes.rows.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unit_price: Number(l.unit_price),
      tax_rate: Number(l.tax_rate),
      tax_amount: Number(l.tax_amount),
      amount: Number(l.amount),
    })),
    discounts: discRes.rows.map((d) => ({
      ...d,
      amount: Number(d.amount),
      discount_value: Number(d.discount_value),
    })),
  };
};

/**
 * Confirm invoice: DRAFT -> CONFIRMED
 */
const confirmInvoice = async (id) => {
  const res = await db.query(
    `UPDATE invoices
     SET status = 'CONFIRMED', updated_at = NOW()
     WHERE id = $1 AND status = 'DRAFT'
     RETURNING *`,
    [id]
  );

  if (res.rows.length === 0) {
    throw new ApiError(409, 'Invoice cannot be confirmed (must be in DRAFT status)');
  }

  return res.rows[0];
};

/**
 * Cancel invoice: DRAFT or CONFIRMED -> CANCELLED (refuse with 409 if amount_paid > 0)
 */
const cancelInvoice = async (id) => {
  return db.withTransaction(async (client) => {
    const invRes = await client.query(
      `SELECT id, status, amount_paid FROM invoices WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (invRes.rows.length === 0) {
      throw new ApiError(404, 'Invoice not found');
    }

    const inv = invRes.rows[0];
    if (Number(inv.amount_paid) > 0) {
      throw new ApiError(409, 'Cannot cancel an invoice with payments already recorded');
    }

    if (inv.status !== 'DRAFT' && inv.status !== 'CONFIRMED') {
      throw new ApiError(409, `Cannot cancel invoice in status ${inv.status}`);
    }

    const updateRes = await client.query(
      `UPDATE invoices
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 AND status IN ('DRAFT', 'CONFIRMED')
       RETURNING *`,
      [id]
    );

    if (updateRes.rows.length === 0) {
      throw new ApiError(409, 'Invoice cancellation failed');
    }

    return updateRes.rows[0];
  });
};

/**
 * Send invoice email: CONFIRMED only
 */
const sendInvoice = async (id) => {
  const invoice = await getInvoiceById(id);

  if (invoice.status !== 'CONFIRMED') {
    throw new ApiError(409, 'Only CONFIRMED invoices can be sent');
  }

  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    throw new ApiError(400, 'Customer has no email address on file');
  }

  const subject = `Invoice ${invoice.number} from Brightloop`;
  const viewUrl = `${env.FRONTEND_URL}/invoices/${invoice.id}`;
  const html = `
    <h2>Invoice ${invoice.number}</h2>
    <p>Dear ${invoice.customer_name},</p>
    <p>Your invoice for the period <strong>${invoice.period_start}</strong> to <strong>${invoice.period_end}</strong> is ready.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td><strong>Invoice Date:</strong></td><td>${invoice.invoice_date}</td></tr>
      <tr><td><strong>Due Date:</strong></td><td>${invoice.due_date}</td></tr>
      <tr><td><strong>Subtotal:</strong></td><td>$${invoice.subtotal.toFixed(2)}</td></tr>
      <tr><td><strong>Discount:</strong></td><td>$${invoice.discount_total.toFixed(2)}</td></tr>
      <tr><td><strong>Tax:</strong></td><td>$${invoice.tax_total.toFixed(2)}</td></tr>
      <tr><td><strong>Total Amount:</strong></td><td>$${invoice.total.toFixed(2)}</td></tr>
      <tr><td><strong>Balance Due:</strong></td><td>$${invoice.balance.toFixed(2)}</td></tr>
    </table>
    <p><a href="${viewUrl}" style="background-color: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Invoice</a></p>
    <p>Thank you for your business!</p>
  `;

  try {
    await sendMail({
      to: customerEmail,
      subject,
      html,
      text: `Invoice ${invoice.number}: Total $${invoice.total.toFixed(2)}. Due date: ${invoice.due_date}. View at ${viewUrl}`,
    });
  } catch (mailErr) {
    console.error('Invoice email delivery failed', {
      invoiceId: id,
      errorName: mailErr?.name,
      errorCode: mailErr?.code,
    });
    throw new ApiError(502, 'Failed to send invoice email. Please try again later.');
  }

  const updateRes = await db.query(
    `UPDATE invoices SET sent_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  return updateRes.rows[0];
};

module.exports = {
  generateForSubscription,
  generateDue,
  listInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
};
