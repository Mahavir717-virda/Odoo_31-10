const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

/**
 * List taxes with search, is_active, and pagination
 * Ordered by id DESC
 */
const listTaxes = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { search, is_active } = query;

  const conditions = [];
  const params = [];

  if (typeof is_active === 'boolean') {
    params.push(is_active);
    conditions.push(`is_active = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    conditions.push(`name ILIKE $${searchIdx}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(`SELECT COUNT(*) AS total FROM taxes ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT * FROM taxes
     ${whereClause}
     ORDER BY id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const meta = buildMeta(page, limit, total);
  return { taxes: listRes.rows, meta };
};

/**
 * Get tax by ID
 */
const getTaxById = async (id) => {
  const res = await db.query('SELECT * FROM taxes WHERE id = $1', [id]);
  if (res.rows.length === 0) {
    throw new ApiError(404, 'Tax not found');
  }
  return res.rows[0];
};

/**
 * Create a new tax
 */
const createTax = async (data) => {
  const { name, rate_percent, is_active = true } = data;

  const res = await db.query(
    `INSERT INTO taxes (name, rate_percent, is_active)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, rate_percent, is_active]
  );

  return res.rows[0];
};

/**
 * Update an existing tax
 */
const updateTax = async (id, data) => {
  const existing = await getTaxById(id);

  const name = data.name !== undefined ? data.name : existing.name;
  const rate_percent = data.rate_percent !== undefined ? data.rate_percent : existing.rate_percent;
  const is_active = data.is_active !== undefined ? data.is_active : existing.is_active;

  const res = await db.query(
    `UPDATE taxes
     SET name = $1, rate_percent = $2, is_active = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [name, rate_percent, is_active, id]
  );

  return res.rows[0];
};

/**
 * DELETE: soft-deactivates if referenced
 */
const deleteTax = async (id) => {
  await getTaxById(id);

  // Check references in products, quotation_template_lines, subscription_lines, invoice_lines
  const prodCheck = await db.query('SELECT 1 FROM products WHERE tax_id = $1 LIMIT 1', [id]);
  const tplCheck = await db.query('SELECT 1 FROM quotation_template_lines WHERE tax_id = $1 LIMIT 1', [id]);
  const subCheck = await db.query('SELECT 1 FROM subscription_lines WHERE tax_id = $1 LIMIT 1', [id]);
  const invCheck = await db.query('SELECT 1 FROM invoice_lines WHERE tax_id = $1 LIMIT 1', [id]);

  const isReferenced =
    prodCheck.rows.length > 0 ||
    tplCheck.rows.length > 0 ||
    subCheck.rows.length > 0 ||
    invCheck.rows.length > 0;

  if (isReferenced) {
    await db.query('UPDATE taxes SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
    return { message: 'Tax is referenced by products or documents; deactivated', deactivated: true };
  } else {
    await db.query('DELETE FROM taxes WHERE id = $1', [id]);
    return { message: 'Tax deleted successfully', deactivated: false };
  }
};

module.exports = {
  listTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
};

