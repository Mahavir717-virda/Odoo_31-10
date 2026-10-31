const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { getVariantPrice } = require('../products/products.service');

/**
 * Validates that plan exists, and each line has a valid product and variant
 */
const validateTemplateDependencies = async (planId, lines, client = null) => {
  if (planId) {
    const planRes = await db.query('SELECT id, status FROM plans WHERE id = $1', [planId], client);
    if (planRes.rows.length === 0) {
      throw new ApiError(400, `Plan with id ${planId} does not exist`);
    }
  }

  if (lines && lines.length > 0) {
    for (const line of lines) {
      // Validate product and variant existence & pricing
      await getVariantPrice(line.product_id, line.variant_id || null, client);

      // Validate tax_id if provided
      if (line.tax_id) {
        const taxRes = await db.query('SELECT id FROM taxes WHERE id = $1', [line.tax_id], client);
        if (taxRes.rows.length === 0) {
          throw new ApiError(400, `Tax with id ${line.tax_id} does not exist`);
        }
      }
    }
  }
};

/**
 * List quotation templates with search, is_active, pagination, and joined plan_name
 * Ordered by id DESC
 */
const listTemplates = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { search, is_active } = query;

  const conditions = [];
  const params = [];

  if (typeof is_active === 'boolean') {
    params.push(is_active);
    conditions.push(`qt.is_active = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const sIdx = params.length;
    conditions.push(`(qt.name ILIKE $${sIdx} OR pl.name ILIKE $${sIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) AS total
     FROM quotation_templates qt
     LEFT JOIN plans pl ON qt.plan_id = pl.id
     ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT qt.*, pl.name AS plan_name
     FROM quotation_templates qt
     LEFT JOIN plans pl ON qt.plan_id = pl.id
     ${whereClause}
     ORDER BY qt.id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const meta = buildMeta(page, limit, total);
  return { templates: listRes.rows, meta };
};

/**
 * Get quotation template by ID with detail:
 * lines with product_name, variant_label (e.g. "Brand: Odoo"), and unit_price from getVariantPrice
 */
const getTemplateById = async (id, client = null) => {
  const tplRes = await db.query(
    `SELECT qt.*, pl.name AS plan_name
     FROM quotation_templates qt
     LEFT JOIN plans pl ON qt.plan_id = pl.id
     WHERE qt.id = $1`,
    [id],
    client
  );

  if (tplRes.rows.length === 0) {
    throw new ApiError(404, 'Quotation template not found');
  }

  const template = tplRes.rows[0];

  const linesRes = await db.query(
    `SELECT qtl.*,
            p.name AS product_name,
            pv.attribute AS variant_attribute,
            pv.value AS variant_value,
            t.name AS tax_name,
            t.rate_percent AS tax_rate
     FROM quotation_template_lines qtl
     JOIN products p ON qtl.product_id = p.id
     LEFT JOIN product_variants pv ON qtl.variant_id = pv.id
     LEFT JOIN taxes t ON qtl.tax_id = t.id
     WHERE qtl.template_id = $1
     ORDER BY qtl.id ASC`,
    [id],
    client
  );

  const lines = [];
  for (const row of linesRes.rows) {
    let variant_label = null;
    if (row.variant_attribute && row.variant_value) {
      variant_label = `${row.variant_attribute}: ${row.variant_value}`;
    }

    const unit_price = await getVariantPrice(row.product_id, row.variant_id, client);

    lines.push({
      id: row.id,
      template_id: row.template_id,
      product_id: row.product_id,
      product_name: row.product_name,
      variant_id: row.variant_id,
      variant_label,
      quantity: row.quantity,
      unit_price,
      tax_id: row.tax_id,
      tax_name: row.tax_name,
      tax_rate: row.tax_rate !== null && row.tax_rate !== undefined ? Number(row.tax_rate) : null,
    });
  }

  template.lines = lines;
  return template;
};

/**
 * Create quotation template with nested lines inside a transaction
 */
const createTemplate = async (data, userId) => {
  return db.withTransaction(async (client) => {
    const { name, validity_days = 30, plan_id, payment_terms_days = 15, notes = null, is_active = true, lines = [] } = data;

    await validateTemplateDependencies(plan_id, lines, client);

    const tplRes = await client.query(
      `INSERT INTO quotation_templates (name, validity_days, plan_id, payment_terms_days, notes, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, validity_days, plan_id, payment_terms_days, notes, is_active, userId]
    );

    const template = tplRes.rows[0];

    for (const line of lines) {
      await client.query(
        `INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, tax_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [template.id, line.product_id, line.variant_id || null, line.quantity || 1, line.tax_id || null]
      );
    }

    return getTemplateById(template.id, client);
  });
};

/**
 * Update quotation template with replace-all lines inside a transaction
 */
const updateTemplate = async (id, data) => {
  return db.withTransaction(async (client) => {
    const existingRes = await client.query('SELECT * FROM quotation_templates WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      throw new ApiError(404, 'Quotation template not found');
    }

    const current = existingRes.rows[0];
    const planId = data.plan_id !== undefined ? data.plan_id : current.plan_id;

    if (data.lines !== undefined) {
      await validateTemplateDependencies(planId, data.lines, client);
    } else if (data.plan_id !== undefined) {
      await validateTemplateDependencies(planId, [], client);
    }

    const updatedName = data.name !== undefined ? data.name : current.name;
    const updatedValidity = data.validity_days !== undefined ? data.validity_days : current.validity_days;
    const updatedTerms = data.payment_terms_days !== undefined ? data.payment_terms_days : current.payment_terms_days;
    const updatedNotes = data.notes !== undefined ? data.notes : current.notes;
    const updatedIsActive = data.is_active !== undefined ? data.is_active : current.is_active;

    await client.query(
      `UPDATE quotation_templates
       SET name = $1, validity_days = $2, plan_id = $3, payment_terms_days = $4, notes = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7`,
      [updatedName, updatedValidity, planId, updatedTerms, updatedNotes, updatedIsActive, id]
    );

    // Replace-all lines if provided
    if (data.lines !== undefined) {
      await client.query('DELETE FROM quotation_template_lines WHERE template_id = $1', [id]);

      for (const line of data.lines) {
        await client.query(
          `INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, tax_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, line.product_id, line.variant_id || null, line.quantity || 1, line.tax_id || null]
        );
      }
    }

    return getTemplateById(id, client);
  });
};

/**
 * Delete quotation template
 */
const deleteTemplate = async (id) => {
  const existingRes = await db.query('SELECT id FROM quotation_templates WHERE id = $1', [id]);
  if (existingRes.rows.length === 0) {
    throw new ApiError(404, 'Quotation template not found');
  }

  // Check if referenced in subscriptions
  const subRef = await db.query('SELECT 1 FROM subscriptions WHERE template_id = $1 LIMIT 1', [id]);
  if (subRef.rows.length > 0) {
    // Schema has ON DELETE SET NULL on subscriptions(template_id), but soft-deactivation or standard deletion
    await db.query('UPDATE quotation_templates SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
    return { message: 'Template is referenced by subscriptions; marked as inactive', deactivated: true };
  }

  await db.query('DELETE FROM quotation_templates WHERE id = $1', [id]);
  return { message: 'Quotation template deleted successfully', deactivated: false };
};

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
