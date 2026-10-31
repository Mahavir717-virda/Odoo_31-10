const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authentication token missing or invalid'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return next(new ApiError(401, 'Invalid or expired token'));
    }

    if (!decoded || !decoded.id) {
      return next(new ApiError(401, 'Invalid token payload'));
    }

    const result = await db.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new ApiError(401, 'User not found'));
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return next(new ApiError(401, 'User account is inactive'));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;

