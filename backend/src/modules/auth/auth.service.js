const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const mailer = require('../../utils/mailer');

const SALT_ROUNDS = 10;

/**
 * Register a new customer
 */
const register = async ({ name, email, password, phone, company, address }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check duplicate email
  const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'Email is already registered', [{ field: 'email', message: 'Email already exists' }]);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const insertRes = await db.query(
    `INSERT INTO users (name, email, password_hash, role, phone, company, address, is_active)
     VALUES ($1, $2, $3, 'CUSTOMER', $4, $5, $6, TRUE)
     RETURNING id, name, email, role, phone, company, address, is_active, created_at, updated_at`,
    [name, normalizedEmail, passwordHash, phone || null, company || null, address || null]
  );

  const user = insertRes.rows[0];

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user };
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
  if (res.rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = res.rows[0];

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.is_active) {
    throw new ApiError(401, 'User account is inactive');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const { password_hash, reset_token_hash, reset_token_expires, ...userWithoutSecrets } = user;

  return { token, user: userWithoutSecrets };
};

/**
 * Forgot password
 */
const forgotPassword = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);

  if (res.rows.length > 0) {
    const user = res.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // +1 hour

    await db.query(
      `UPDATE users
       SET reset_token_hash = $1, reset_token_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [tokenHash, expires, user.id]
    );

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // Send email / log link
    await mailer.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Hello ${user.name},\n\nPlease use the following link to reset your password:\n${resetLink}\n\nThis link is valid for 1 hour.`,
      html: `<p>Hello ${user.name},</p><p>Please use the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link is valid for 1 hour.</p>`,
    });
  }

  return { message: 'If an account with that email exists, a reset link has been sent' };
};

/**
 * Reset password
 */
const resetPassword = async ({ token, password }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const res = await db.query(
    `SELECT id FROM users
     WHERE reset_token_hash = $1 AND reset_token_expires > NOW()`,
    [tokenHash]
  );

  if (res.rows.length === 0) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  const userId = res.rows[0].id;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.query(
    `UPDATE users
     SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, userId]
  );

  return { message: 'Password has been reset successfully' };
};

/**
 * Get current authenticated user details
 */
const getMe = async (userId) => {
  const res = await db.query(
    `SELECT id, name, email, role, phone, company, address, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  return res.rows[0];
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};

