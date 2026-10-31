const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { computeLineAmount, computeTaxAmount, computeTotals } = require('../../utils/money');
const { nextSubscriptionNumber } = require('../../utils/numbers');
const { addDays, todayDate } = require('../../utils/dates');
const { canTransition } = require('./subscriptions.statusFlow');
const { getVariantPrice } = require('../products/products.service');

/**
 * Shared internal function buildLines(lines, client)
 * For each input line:
 * - gets unit_price via getVariantPrice
 * - takes tax_id from input or falls back to product's tax_id
 * - reads tax rate from taxes with plain SQL
 * - computes amount, tax_rate (snapshot), tax_amount via money.js
 * Returns { builtLines, subtotal, tax_total, total }
 */
const buildLines = async (lines, client) => {
  const builtLines = [];

  for (const line of lines) {
    const unitPrice = await getVariantPrice(line.product_id, line.variant_id || null, client);

    // Fetch product to get fallback tax_id and product name for default description
    const prodRes = await db.query(
      'SELECT id, name, tax_id FROM products WHERE id = $1',
      [line.product_id],
      client
    );
    if (prodRes.rows.length === 0) {
      throw new ApiError(400, `Product with id ${line.product_id} not found`);
    }
    const prod = prodRes.rows[0];

    const taxId = line.tax_id !== undefined && line.tax_id !== null ? line.tax_id : prod.tax_id;
    let taxRate = 0;

    if (taxId) {
      const taxRes = await db.query('SELECT id, rate_percent FROM taxes WHERE id = $1', [taxId], client);
      if (taxRes.rows.length === 0) {
        throw new ApiError(400, `Tax with id ${taxId} not found`);
      }
      taxRate = Number(taxRes.rows[0].rate_percent) || 0;
    }

    const qty = Number(line.quantity) || 1;
    const amount = computeLineAmount(qty, unitPrice);
    const taxAmount = computeTaxAmount(amount, taxRate);
    const description = line.description || prod.name;

    builtLines.push({
      product_id: line.product_id,
      variant_id: line.variant_id || null,
      description,
      quantity: qty,
      unit_price: unitPrice,
      tax_id: taxId || null,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      amount,
    });
  }

  const { subtotal, tax_total, total } = computeTotals(builtLines);

  return {
    lines: builtLines,
    subtotal,
    tax_total,
    total,
  };
};

/**
 * Validates plan rules:
 * - plan exists and status is ACTIVE
 * - start_date is inside the plan's availability window (start_date >= plan.start_date and (plan.end_date is null or start_date <= plan.end_date))
 * - total quantity of lines >= plan.min_quantity
 */
const validatePlanAndQuantity = (plan, startDate, totalQuantity) => {
  if (plan.status !== 'ACTIVE') {
    throw new ApiError(400, `Plan is not ACTIVE (current status: ${plan.status})`);
  }

  const sDate = new Date(startDate);
  const pStartDate = new Date(plan.start_date);
  if (sDate < pStartDate) {
    throw new ApiError(400, `Subscription start_date (${startDate}) cannot be earlier than plan start_date (${plan.start_date})`);
  }

  if (plan.end_date) {
    const pEndDate = new Date(plan.end_date);
    if (sDate > pEndDate) {
      throw new ApiError(400, `Subscription start_date (${startDate}) cannot be later than plan end_date (${plan.end_date})`);
    }
  }

  if (totalQuantity < plan.min_quantity) {
    throw new ApiError(
      400,
      `Total quantity of lines (${totalQuantity}) must be greater than or equal to plan min_quantity (${plan.min_quantity})`
    );
  }
};

/**
 * GET /subscriptions:
 * filters status, customer_id, search (number or customer name via ILIKE), from/to on start_date, pagination, ordered by id DESC.
 * One query with joins returning customer_name, plan_name, plan_pausable, plan_closable.
 * Customers: forced customer_id = req.user.id.
 */
const listSubscriptions = async (query, user) => {
  const { page, limit, offset } = parsePagination(query);
  const { status, search, from, to } = query;

  let customerId = query.customer_id;
  if (user.role === 'CUSTOMER') {
    customerId = user.id;
  }

  const conditions = [];
  const params = [];

  if (customerId) {
    params.push(customerId);
    conditions.push(`s.customer_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`s.status = $${params.length}`);
  }

  if (from) {
    params.push(from);
    conditions.push(`s.start_date >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    conditions.push(`s.start_date <= $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const sIdx = params.length;
    conditions.push(`(s.number ILIKE $${sIdx} OR u.name ILIKE $${sIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) AS total
     FROM subscriptions s
     JOIN users u ON s.customer_id = u.id
     JOIN plans pl ON s.plan_id = pl.id
     ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT s.*,
            u.name AS customer_name,
            pl.name AS plan_name,
            pl.pausable AS plan_pausable,
            pl.closable AS plan_closable
     FROM subscriptions s
     JOIN users u ON s.customer_id = u.id
     JOIN plans pl ON s.plan_id = pl.id
     ${whereClause}
     ORDER BY s.id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const meta = buildMeta(page, limit, total);
  return { subscriptions: listRes.rows, meta };
};

/**
 * GET /subscriptions/:id:
 * Returns subscription with lines; customer requesting someone else's returns 404.
 */
const getSubscriptionById = async (id, user, client = null) => {
  const subRes = await db.query(
    `SELECT s.*,
            u.name AS customer_name,
            pl.name AS plan_name,
            pl.pausable AS plan_pausable,
            pl.closable AS plan_closable
     FROM subscriptions s
     JOIN users u ON s.customer_id = u.id
     JOIN plans pl ON s.plan_id = pl.id
     WHERE s.id = $1`,
    [id],
    client
  );

  if (subRes.rows.length === 0) {
    throw new ApiError(404, 'Subscription not found');
  }

  const subscription = subRes.rows[0];

  if (user && user.role === 'CUSTOMER' && subscription.customer_id !== user.id) {
    throw new ApiError(404, 'Subscription not found');
  }

  const linesRes = await db.query(
    `SELECT sl.*,
            p.name AS product_name,
            pv.attribute AS variant_attribute,
            pv.value AS variant_value,
            t.name AS tax_name
     FROM subscription_lines sl
     JOIN products p ON sl.product_id = p.id
     LEFT JOIN product_variants pv ON sl.variant_id = pv.id
     LEFT JOIN taxes t ON sl.tax_id = t.id
     WHERE sl.subscription_id = $1
     ORDER BY sl.id ASC`,
    [id],
    client
  );

  subscription.lines = linesRes.rows.map((row) => ({
    id: row.id,
    subscription_id: row.subscription_id,
    product_id: row.product_id,
    product_name: row.product_name,
    variant_id: row.variant_id,
    variant_label: row.variant_attribute && row.variant_value ? `${row.variant_attribute}: ${row.variant_value}` : null,
    description: row.description,
    quantity: row.quantity,
    unit_price: Number(row.unit_price),
    tax_id: row.tax_id,
    tax_name: row.tax_name,
    tax_rate: Number(row.tax_rate),
    tax_amount: Number(row.tax_amount),
    amount: Number(row.amount),
  }));

  return subscription;
};

/**
 * POST /subscriptions (ADMIN, STAFF):
 * - validate customer exists with role CUSTOMER
 * - plan status is ACTIVE
 * - start_date is inside plan availability window
 * - total quantity of lines >= plan.min_quantity
 * - expiry_date >= start_date
 * In one transaction: nextSubscriptionNumber, insert header (status DRAFT, totals) and lines.
 */
const createSubscription = async (data, user) => {
  return db.withTransaction(async (client) => {
    const { customer_id, plan_id, start_date, expiry_date, payment_terms_days = 15, notes = null, lines } = data;

    // Validate customer exists with role CUSTOMER
    const custRes = await client.query('SELECT id, role, is_active FROM users WHERE id = $1', [customer_id]);
    if (custRes.rows.length === 0 || custRes.rows[0].role !== 'CUSTOMER') {
      throw new ApiError(400, 'Invalid customer: user must exist and have role CUSTOMER');
    }
    if (!custRes.rows[0].is_active) {
      throw new ApiError(400, 'Customer account is inactive');
    }

    // Validate plan
    const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [plan_id]);
    if (planRes.rows.length === 0) {
      throw new ApiError(400, `Plan with id ${plan_id} does not exist`);
    }
    const plan = planRes.rows[0];

    // Validate expiry_date >= start_date
    if (expiry_date && expiry_date < start_date) {
      throw new ApiError(400, 'expiry_date must be greater than or equal to start_date');
    }

    // Total quantity check
    const totalQuantity = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    validatePlanAndQuantity(plan, start_date, totalQuantity);

    // Build lines and calculate totals via buildLines
    const { lines: builtLines, subtotal, tax_total, total } = await buildLines(lines, client);

    const number = await nextSubscriptionNumber(client);

    const subInsertRes = await client.query(
      `INSERT INTO subscriptions (
        number, customer_id, plan_id, status, is_paused, start_date, expiry_date,
        payment_terms_days, notes, subtotal, tax_total, total, created_by
      ) VALUES ($1, $2, $3, 'DRAFT', FALSE, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [number, customer_id, plan_id, start_date, expiry_date || null, payment_terms_days, notes, subtotal, tax_total, total, user.id]
    );

    const subscription = subInsertRes.rows[0];

    for (const line of builtLines) {
      await client.query(
        `INSERT INTO subscription_lines (
          subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, tax_rate, tax_amount, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          subscription.id,
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

    return getSubscriptionById(subscription.id, user, client);
  });
};

/**
 * PUT /subscriptions/:id:
 * Only while status is DRAFT or QUOTATION (else 409).
 * Replaces lines and recomputes totals in a transaction.
 */
const updateSubscription = async (id, data, user) => {
  return db.withTransaction(async (client) => {
    const existingRes = await client.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      throw new ApiError(404, 'Subscription not found');
    }

    const sub = existingRes.rows[0];
    if (sub.status !== 'DRAFT' && sub.status !== 'QUOTATION') {
      throw new ApiError(409, `Cannot edit subscription with status ${sub.status}. Editing is only allowed in DRAFT or QUOTATION.`);
    }

    const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [sub.plan_id]);
    const plan = planRes.rows[0];

    const updatedExpiry = data.expiry_date !== undefined ? data.expiry_date : sub.expiry_date;
    const updatedTerms = data.payment_terms_days !== undefined ? data.payment_terms_days : sub.payment_terms_days;
    const updatedNotes = data.notes !== undefined ? data.notes : sub.notes;

    if (updatedExpiry && updatedExpiry < sub.start_date) {
      throw new ApiError(400, 'expiry_date must be greater than or equal to start_date');
    }

    let subtotal = sub.subtotal;
    let taxTotal = sub.tax_total;
    let total = sub.total;

    if (data.lines !== undefined) {
      const totalQuantity = data.lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      validatePlanAndQuantity(plan, sub.start_date, totalQuantity);

      const computed = await buildLines(data.lines, client);
      subtotal = computed.subtotal;
      taxTotal = computed.tax_total;
      total = computed.total;

      // Replace lines
      await client.query('DELETE FROM subscription_lines WHERE subscription_id = $1', [id]);

      for (const line of computed.lines) {
        await client.query(
          `INSERT INTO subscription_lines (
            subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, tax_rate, tax_amount, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
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
    }

    await client.query(
      `UPDATE subscriptions
       SET expiry_date = $1, payment_terms_days = $2, notes = $3, subtotal = $4, tax_total = $5, total = $6, updated_at = NOW()
       WHERE id = $7`,
      [updatedExpiry, updatedTerms, updatedNotes, subtotal, taxTotal, total, id]
    );

    return getSubscriptionById(id, user, client);
  });
};

/**
 * POST /subscriptions/from-template/:id {customer_id, start_date}:
 * Copies plan, payment_terms_days, lines from the template,
 * sets template_id and quotation_valid_until = start_date + validity_days, status DRAFT.
 * Returns the full subscription.
 */
const createFromTemplate = async (templateId, data, user) => {
  return db.withTransaction(async (client) => {
    const { customer_id, start_date } = data;

    // Validate customer exists with role CUSTOMER
    const custRes = await client.query('SELECT id, role, is_active FROM users WHERE id = $1', [customer_id]);
    if (custRes.rows.length === 0 || custRes.rows[0].role !== 'CUSTOMER') {
      throw new ApiError(400, 'Invalid customer: user must exist and have role CUSTOMER');
    }
    if (!custRes.rows[0].is_active) {
      throw new ApiError(400, 'Customer account is inactive');
    }

    // Fetch template
    const tplRes = await client.query('SELECT * FROM quotation_templates WHERE id = $1', [templateId]);
    if (tplRes.rows.length === 0) {
      throw new ApiError(404, 'Quotation template not found');
    }
    const template = tplRes.rows[0];
    if (!template.is_active) {
      throw new ApiError(400, 'Quotation template is inactive');
    }

    // Fetch plan
    const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [template.plan_id]);
    if (planRes.rows.length === 0) {
      throw new ApiError(400, 'Plan referenced by template not found');
    }
    const plan = planRes.rows[0];

    // Fetch template lines
    const tplLinesRes = await client.query(
      'SELECT * FROM quotation_template_lines WHERE template_id = $1 ORDER BY id ASC',
      [templateId]
    );
    if (tplLinesRes.rows.length === 0) {
      throw new ApiError(400, 'Template has no lines');
    }

    const totalQuantity = tplLinesRes.rows.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    validatePlanAndQuantity(plan, start_date, totalQuantity);

    // Compute lines via buildLines
    const { lines: builtLines, subtotal, tax_total, total } = await buildLines(tplLinesRes.rows, client);

    const quotationValidUntil = addDays(start_date, template.validity_days);
    const number = await nextSubscriptionNumber(client);

    const subInsertRes = await client.query(
      `INSERT INTO subscriptions (
        number, customer_id, plan_id, template_id, status, is_paused, start_date, quotation_valid_until,
        payment_terms_days, notes, subtotal, tax_total, total, created_by
      ) VALUES ($1, $2, $3, $4, 'DRAFT', FALSE, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        number,
        customer_id,
        template.plan_id,
        template.id,
        start_date,
        quotationValidUntil,
        template.payment_terms_days,
        template.notes,
        subtotal,
        tax_total,
        total,
        user.id,
      ]
    );

    const subscription = subInsertRes.rows[0];

    for (const line of builtLines) {
      await client.query(
        `INSERT INTO subscription_lines (
          subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, tax_rate, tax_amount, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          subscription.id,
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

    return getSubscriptionById(subscription.id, user, client);
  });
};

/**
 * PATCH /subscriptions/:id/status (ADMIN, STAFF):
 * Only the exact next step is allowed, otherwise 409 "Cannot move from X to Y".
 * Use UPDATE ... WHERE id=$1 AND status=$2 so double clicks are safe.
 * Side effects:
 * - -> QUOTATION sets quotation_valid_until if empty (today + 30 days)
 * - -> ACTIVE requires at least one line and sets next_billing_date = start_date
 * - -> CLOSED clears next_billing_date (NULL) and sets is_paused false
 */
const patchStatus = async (id, targetStatus, user) => {
  return db.withTransaction(async (client) => {
    const existingRes = await client.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      throw new ApiError(404, 'Subscription not found');
    }

    const currentSub = existingRes.rows[0];
    const currentStatus = currentSub.status;

    if (!canTransition(currentStatus, targetStatus)) {
      throw new ApiError(409, `Cannot move from ${currentStatus} to ${targetStatus}`);
    }

    // Additional side effect checks before atomic update:
    // -> ACTIVE requires at least one line
    if (targetStatus === 'ACTIVE') {
      const lineCountRes = await client.query(
        'SELECT COUNT(*) AS total FROM subscription_lines WHERE subscription_id = $1',
        [id]
      );
      if (parseInt(lineCountRes.rows[0].total, 10) === 0) {
        throw new ApiError(400, 'Cannot activate subscription without any lines');
      }
    }

    let updateQuery;
    let queryParams;

    if (targetStatus === 'QUOTATION') {
      const defaultValidUntil = addDays(todayDate(), 30);
      updateQuery = `
        UPDATE subscriptions
        SET status = $1,
            quotation_valid_until = COALESCE(quotation_valid_until, $2),
            updated_at = NOW()
        WHERE id = $3 AND status = $4
        RETURNING *`;
      queryParams = [targetStatus, defaultValidUntil, id, currentStatus];
    } else if (targetStatus === 'ACTIVE') {
      updateQuery = `
        UPDATE subscriptions
        SET status = $1,
            next_billing_date = start_date,
            updated_at = NOW()
        WHERE id = $2 AND status = $3
        RETURNING *`;
      queryParams = [targetStatus, id, currentStatus];
    } else if (targetStatus === 'CLOSED') {
      updateQuery = `
        UPDATE subscriptions
        SET status = $1,
            next_billing_date = NULL,
            is_paused = FALSE,
            updated_at = NOW()
        WHERE id = $2 AND status = $3
        RETURNING *`;
      queryParams = [targetStatus, id, currentStatus];
    } else {
      // CONFIRMED or any other allowed transition
      updateQuery = `
        UPDATE subscriptions
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2 AND status = $3
        RETURNING *`;
      queryParams = [targetStatus, id, currentStatus];
    }

    const updateRes = await client.query(updateQuery, queryParams);

    if (updateRes.rows.length === 0) {
      throw new ApiError(409, `Concurrent update conflict: status may have already changed from ${currentStatus}`);
    }

    return getSubscriptionById(id, user, client);
  });
};

module.exports = {
  buildLines,
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  createFromTemplate,
  patchStatus,
};
