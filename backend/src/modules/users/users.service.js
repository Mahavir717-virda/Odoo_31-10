const bcrypt = require('bcrypt');
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const SALT_ROUNDS = 10;

/**
 * Create a staff user (ADMIN only)
 */
const createStaff = async ({ name, email, password, phone, company, address }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'Email is already registered', [{ field: 'email', message: 'Email already exists' }]);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const insertRes = await db.query(
    `INSERT INTO users (name, email, password_hash, role, phone, company, address, is_active)
     VALUES ($1, $2, $3, 'STAFF', $4, $5, $6, TRUE)
     RETURNING id, name, email, role, phone, company, address, is_active, created_at, updated_at`,
    [name, normalizedEmail, passwordHash, phone || null, company || null, address || null]
  );

  return insertRes.rows[0];
};

/**
 * List users with filtering, search, pagination, and role-based enforcement
 * STAFF may only list role=CUSTOMER
 */
const listUsers = async (query, currentUser) => {
  const { page, limit, offset } = parsePagination(query);
  const { role, search } = query;

  const conditions = [];
  const params = [];

  // Enforce STAFF restriction
  if (currentUser.role === 'STAFF') {
    if (role && role !== 'CUSTOMER') {
      throw new ApiError(403, 'Forbidden: Staff may only view customers');
    }
    conditions.push(`role = 'CUSTOMER'`);
  } else if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }

  // Search by name or email with ILIKE
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    conditions.push(`(name ILIKE $${searchIdx} OR email ILIKE $${searchIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countRes = await db.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Fetch paginated rows, ordered by id DESC
  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT id, name, email, role, phone, company, address, is_active, created_at, updated_at
     FROM users
     ${whereClause}
     ORDER BY id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const meta = buildMeta(page, limit, total);

  return { users: listRes.rows, meta };
};

module.exports = {
  createStaff,
  listUsers,
};

