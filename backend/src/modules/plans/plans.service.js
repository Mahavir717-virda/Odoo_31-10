const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

/**
 * List plans with search, status, billing_period, pagination
 * Ordered by id DESC
 */
const listPlans = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { search, status, billing_period } = query;

  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (billing_period) {
    params.push(billing_period);
    conditions.push(`billing_period = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    conditions.push(`name ILIKE $${searchIdx}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(`SELECT COUNT(*) AS total FROM plans ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT * FROM plans
     ${whereClause}
     ORDER BY id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const meta = buildMeta(page, limit, total);
  return { plans: listRes.rows, meta };
};

/**
 * Get plan by ID
 */
const getPlanById = async (id) => {
  const res = await db.query('SELECT * FROM plans WHERE id = $1', [id]);
  if (res.rows.length === 0) {
    throw new ApiError(404, 'Plan not found');
  }
  return res.rows[0];
};

/**
 * Create a plan
 */
const createPlan = async (data) => {
  const {
    name,
    price,
    billing_period,
    min_quantity = 1,
    start_date,
    end_date = null,
    auto_close = false,
    closable = true,
    pausable = false,
    renewable = true,
    status = 'ACTIVE',
  } = data;

  const res = await db.query(
    `INSERT INTO plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [name, price, billing_period, min_quantity, start_date, end_date || null, auto_close, closable, pausable, renewable, status]
  );

  return res.rows[0];
};

/**
 * Update a plan
 */
const updatePlan = async (id, data) => {
  const existing = await getPlanById(id);

  const name = data.name !== undefined ? data.name : existing.name;
  const price = data.price !== undefined ? data.price : existing.price;
  const billing_period = data.billing_period !== undefined ? data.billing_period : existing.billing_period;
  const min_quantity = data.min_quantity !== undefined ? data.min_quantity : existing.min_quantity;
  const start_date = data.start_date !== undefined ? data.start_date : existing.start_date;
  const end_date = data.end_date !== undefined ? data.end_date : existing.end_date;
  const auto_close = data.auto_close !== undefined ? data.auto_close : existing.auto_close;
  const closable = data.closable !== undefined ? data.closable : existing.closable;
  const pausable = data.pausable !== undefined ? data.pausable : existing.pausable;
  const renewable = data.renewable !== undefined ? data.renewable : existing.renewable;
  const status = data.status !== undefined ? data.status : existing.status;

  const res = await db.query(
    `UPDATE plans
     SET name = $1, price = $2, billing_period = $3, min_quantity = $4, start_date = $5, end_date = $6,
         auto_close = $7, closable = $8, pausable = $9, renewable = $10, status = $11, updated_at = NOW()
     WHERE id = $12
     RETURNING *`,
    [name, price, billing_period, min_quantity, start_date, end_date || null, auto_close, closable, pausable, renewable, status, id]
  );

  return res.rows[0];
};

/**
 * Delete a plan:
 * DELETE returns 409 "Plan is in use, close it instead" if subscriptions or templates reference it.
 */
const deletePlan = async (id) => {
  await getPlanById(id);

  const subCheck = await db.query('SELECT 1 FROM subscriptions WHERE plan_id = $1 LIMIT 1', [id]);
  const tplCheck = await db.query('SELECT 1 FROM quotation_templates WHERE plan_id = $1 LIMIT 1', [id]);

  if (subCheck.rows.length > 0 || tplCheck.rows.length > 0) {
    throw new ApiError(409, 'Plan is in use, close it instead');
  }

  await db.query('DELETE FROM plans WHERE id = $1', [id]);
  return { message: 'Plan deleted successfully' };
};

/**
 * PATCH /plans/:id/close
 * Rule: Plan must be closable = TRUE, and status must not already be 'CLOSED'.
 * In a single UPDATE ... WHERE guard so concurrent clicks are safe; 409 with a clear message when not allowed.
 */
const closePlan = async (id) => {
  const plan = await getPlanById(id);

  if (!plan.closable) {
    throw new ApiError(409, 'Plan cannot be closed early because closable is false');
  }
  if (plan.status === 'CLOSED') {
    throw new ApiError(409, 'Plan is already closed');
  }

  const res = await db.query(
    `UPDATE plans
     SET status = 'CLOSED', updated_at = NOW()
     WHERE id = $1 AND closable = TRUE AND status <> 'CLOSED'
     RETURNING *`,
    [id]
  );

  if (res.rows.length === 0) {
    throw new ApiError(409, 'Unable to close plan: plan may already be closed or cannot be closed');
  }

  return res.rows[0];
};

/**
 * PATCH /plans/:id/pause
 * Rule: Plan must be pausable = TRUE, and status must be 'ACTIVE'.
 * In a single UPDATE ... WHERE guard.
 */
const pausePlan = async (id) => {
  const plan = await getPlanById(id);

  if (!plan.pausable) {
    throw new ApiError(409, 'Plan cannot be paused because pausable is false');
  }
  if (plan.status === 'PAUSED') {
    throw new ApiError(409, 'Plan is already paused');
  }
  if (plan.status === 'CLOSED') {
    throw new ApiError(409, 'Closed plan cannot be paused');
  }

  const res = await db.query(
    `UPDATE plans
     SET status = 'PAUSED', updated_at = NOW()
     WHERE id = $1 AND pausable = TRUE AND status = 'ACTIVE'
     RETURNING *`,
    [id]
  );

  if (res.rows.length === 0) {
    throw new ApiError(409, 'Unable to pause plan: plan is not active or pausable is false');
  }

  return res.rows[0];
};

/**
 * PATCH /plans/:id/renew
 * Rule: Plan must be renewable = TRUE. Can activate from PAUSED, or re-open/extend if renewable.
 * Single UPDATE ... WHERE guard.
 */
const renewPlan = async (id) => {
  const plan = await getPlanById(id);

  if (!plan.renewable) {
    throw new ApiError(409, 'Plan cannot be renewed because renewable is false');
  }
  if (plan.status === 'ACTIVE') {
    throw new ApiError(409, 'Plan is already active');
  }

  const res = await db.query(
    `UPDATE plans
     SET status = 'ACTIVE', updated_at = NOW()
     WHERE id = $1 AND renewable = TRUE AND status <> 'ACTIVE'
     RETURNING *`,
    [id]
  );

  if (res.rows.length === 0) {
    throw new ApiError(409, 'Unable to renew plan: plan is already active or renewal is not permitted');
  }

  return res.rows[0];
};

module.exports = {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  closePlan,
  pausePlan,
  renewPlan,
};

